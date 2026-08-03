require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const INTERVAL_MS = 1000 * 60;

async function checkProvider(p) {
  try {
    if (p.meta && p.meta.health_url) {
      const r = await axios.get(p.meta.health_url, { timeout: 5000 });
      if (r.status === 200) {
        await prisma.providerStatusHistory.create({ data: { providerId: p.id, status: 'ok', message: 'healthy' }});
        return { ok: true, message: 'ok' };
      }
    }
    await prisma.providerStatusHistory.create({ data: { providerId: p.id, status: 'ok', message: 'no health_url (assumed ok)' }});
    return { ok: true, message: 'assumed ok' };
  } catch (err) {
    await prisma.providerStatusHistory.create({ data: { providerId: p.id, status: 'down', message: err.message }});
    await prisma.provider.update({ where: { id: p.id }, data: { isActive: false }});
    return { ok: false, message: err.message };
  }
}

async function run() {
  while (true) {
    try {
      const providers = await prisma.provider.findMany();
      for (const p of providers) {
        const result = await checkProvider(p);
        console.log('checked provider', p.name, result);
      }
    } catch (err) {
      console.error('provider monitor error', err);
    }
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
}

run();
