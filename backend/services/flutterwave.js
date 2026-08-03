/**
 * Simple Flutterwave adapter (sandbox-ready)
 */

const crypto = require('crypto');
const axios = require('axios');

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE = 'https://api.flutterwave.com/v3';

if (!FLW_SECRET_KEY) console.warn('FLW_SECRET_KEY not set — Flutterwave calls will fail until set.');

function flwHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${FLW_SECRET_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function createRecipient({ account_number, account_bank, name }) {
  return { success: true, recipient: { account_number, account_bank, name } };
}

async function initiateTransfer({ amount_kobo, currency = 'NGN', recipient_account, recipient_bank, narration, reference }) {
  try {
    const body = {
      account_bank: recipient_bank,
      account_number: recipient_account,
      amount: amount_kobo / 100,
      narration: narration || 'EarnnPay Payout',
      currency: currency,
      reference: reference || `earnnpay-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    };

    const resp = await axios.post(`${FLW_BASE}/transfers`, body, { headers: flwHeaders() });
    return { success: true, data: resp.data };
  } catch (err) {
    return { success: false, error: err.response?.data || err.message };
  }
}

function verifyWebhookSignature(req) {
  const signatureHeader = req.headers['verif-hash'] || req.headers['x-flw-signature'];
  const secret = process.env.FLW_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const raw = req.rawBody || JSON.stringify(req.body);
  const computed = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return computed === signatureHeader;
}

module.exports = {
  createRecipient,
  initiateTransfer,
  verifyWebhookSignature
};
