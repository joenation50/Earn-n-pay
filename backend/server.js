require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const http = require('http');
const { createServer } = http;

const prisma = new PrismaClient();
const app = express();

// capture raw body for webhook verification
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data || '';
    next();
  });
});
app.use(express.json());
app.use(cors());

const server = createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

const redis = new IORedis(process.env.REDIS_URL);
const payoutQueue = new Queue('payouts', { connection: redis });

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).send({ error: 'No token' });
  const token = h.replace('Bearer ', '');
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = data.sub;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Invalid token' });
  }
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const pw = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { name, email, password: pw }});
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email }});
  } catch (err) {
    res.status(400).json({ error: 'Email likely already used' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, wallet: user.wallet }});
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }});
  res.json(user);
});

// Create withdrawal (enqueue payout)
app.post('/api/withdrawals', authMiddleware, async (req, res) => {
  const { provider, providerAccount, amount } = req.body;
  if (!provider || !providerAccount || !amount) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { id: req.userId }});
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (amount <= 0 || amount > user.wallet / 100) return res.status(400).json({ error: 'Invalid amount' });

  const w = await prisma.withdrawal.create({
    data: {
      userId: user.id,
      provider,
      providerAccount,
      amount: Math.round(amount * 100)
    }
  });

  // deduct balance immediately for demo
  await prisma.user.update({ where: { id: user.id }, data: { wallet: { decrement: Math.round(amount * 100) }}});

  // enqueue payout job with hint (provider)
  await payoutQueue.add('dispatch', { withdrawalId: w.id, preferredProvider: provider });

  // notify via socket
  io.to(user.id).emit('withdrawal_created', { id: w.id, status: w.status });

  res.json({ withdrawalId: w.id, status: w.status });
});

app.get('/api/withdrawals', authMiddleware, async (req, res) => {
  const list = await prisma.withdrawal.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }});
  res.json(list);
});

// Admin endpoints: providers list + set active/inactive
app.get('/api/admin/providers', authMiddleware, async (req, res) => {
  const providers = await prisma.provider.findMany({ orderBy: { priority: 'asc' }});
  res.json(providers);
});

app.post('/api/admin/providers/:id/status', authMiddleware, async (req, res) => {
  const { isActive, priority } = req.body;
  const { id } = req.params;
  const p = await prisma.provider.update({ where: { id }, data: { isActive: !!isActive, priority: priority ?? undefined }});
  io.emit('provider_update', p);
  res.json(p);
});

// Webhook endpoint for Flutterwave
const flw = require('./services/flutterwave');

app.post('/webhooks/flutterwave', async (req, res) => {
  try {
    const ok = flw.verifyWebhookSignature(req);
    if (!ok) {
      return res.status(400).send('invalid signature');
    }
    const event = req.body;

    const reference = event.data?.reference || event.data?.tx_ref || event.data?.id;
    let withdrawal = null;
    if (event.data?.external_id) {
      withdrawal = await prisma.withdrawal.findUnique({ where: { id: event.data.external_id }});
    }
    if (!withdrawal && event.data?.reference) {
      withdrawal = await prisma.withdrawal.findFirst({ where: { providerTxRef: event.data.reference }});
    }

    let status = 'processing';
    if (event.data?.status === 'successful' || event.event === 'transfer.completed') status = 'success';
    if (event.data?.status === 'failed' || event.event === 'transfer.failed') status = 'failed';

    if (withdrawal) {
      await prisma.withdrawal.update({ where: { id: withdrawal.id }, data: { status, providerTxRef: event.data?.id || event.data?.reference }});
      io.to(withdrawal.userId).emit('withdrawal_update', { id: withdrawal.id, status });
    } else {
      await prisma.webhook.create({ data: { event_type: 'flutterwave', payload: event }});
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('webhook error', err);
    return res.status(500).send('error');
  }
});

// Socket.IO connection handling
io.on('connection', socket => {
  socket.on('join', userId => {
    socket.join(userId);
  });
});

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`API + Socket.IO listening on ${PORT}`);
});
