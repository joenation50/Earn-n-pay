require('dotenv').config();
const { Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const flw = require('./services/flutterwave');

const connection = new IORedis(process.env.REDIS_URL);
new QueueScheduler('payouts', { connection });

const prisma = new PrismaClient();

const MAX_RETRIES = 3;
const CIRCUIT_FAIL_THRESHOLD = 3; // mark provider degraded after 3 failures

async function dispatchToProvider(provider, withdrawal) {
  const amountCents = withdrawal.amount;
  const reqBody = {
    amount_kobo: amountCents,
    recipient_account: withdrawal.providerAccount,
    recipient_bank: provider.meta?.bank_code || provider.name,
    narration: `EarnnPay payout for ${withdrawal.userId}`,
    reference: `withdrawal-${withdrawal.id}`
  };

  const pTx = await prisma.providerTransaction.create({
    data: { providerId: provider.id, withdrawalId: withdrawal.id, requestJson: reqBody, status: 'attempt' }
  });

  const res = await flw.initiateTransfer(reqBody);

  await prisma.providerTransaction.update({
    where: { id: pTx.id },
    data: { responseJson: res, status: res.success ? 'success' : 'failed' }
  });

  return res;
}

const worker = new Worker('payouts', async job => {
  const { withdrawalId, preferredProvider } = job.data;
  console.log('Processing payout', withdrawalId);
  const w = await prisma.withdrawal.findUnique({ where: { id: withdrawalId }});
  if (!w) throw new Error('Withdrawal not found');

  await prisma.withdrawal.update({ where: { id: w.id }, data: { status: 'processing' }});

  let providers = [];
  if (preferredProvider) {
    const p = await prisma.provider.findFirst({ where: { name: { equals: preferredProvider }, isActive: true }});
    if (p) providers.push(p);
  }
  const others = await prisma.provider.findMany({ where: { isActive: true }, orderBy: { priority: 'asc' }});
  for (const o of others) {
    if (!providers.find(x => x.id === o.id)) providers.push(o);
  }
  if (providers.length === 0) {
    await prisma.withdrawal.update({ where: { id: w.id }, data: { status: 'failed' }});
    return;
  }

  let finalStatus = 'failed';
  let lastError = null;

  for (const provider of providers) {
    const recent = await prisma.providerTransaction.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      take: CIRCUIT_FAIL_THRESHOLD
    });
    const recentFails = recent.filter(r => r.status === 'failed').length;
    if (recentFails >= CIRCUIT_FAIL_THRESHOLD) {
      await prisma.providerStatusHistory.create({ data: { providerId: provider.id, status: 'degraded', message: 'Circuit open due to recent failures' }});
      continue;
    }

    let attempt = 0;
    let attemptedSuccess = false;
    while (attempt < MAX_RETRIES && !attemptedSuccess) {
      attempt++;
      const res = await dispatchToProvider(provider, w);
      if (res.success) {
        await prisma.withdrawal.update({ where: { id: w.id }, data: { status: 'success', providerTxRef: res.data?.data?.id || res.data?.data?.reference || res.data?.status }});
        finalStatus = 'success';
        attemptedSuccess = true;
      } else {
        lastError = res.error;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    if (finalStatus === 'success') break;
    await prisma.providerStatusHistory.create({ data: { providerId: provider.id, status: 'down', message: `Failed to process withdrawal ${w.id}: ${lastError ? JSON.stringify(lastError) : 'unknown'}` }});
  }

  if (finalStatus !== 'success') {
    await prisma.withdrawal.update({ where: { id: w.id }, data: { status: 'failed' }});
    console.log('Withdrawal failed after trying providers', w.id);
  }
}, { connection });

worker.on('completed', job => console.log('Job completed', job.id));
worker.on('failed', (job, err) => console.error('Job failed', job.id, err));
