import React, { useState } from 'react';
import axios from 'axios';

const PROVIDERS = ['PalmPay', 'Opay', 'Kuda', 'GTBank', 'UBA', 'Wallet'];

export default function Withdraw() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setStatus('submitting');
    const token = localStorage.getItem('token');
    try {
      const r = await axios.post('http://localhost:4000/api/withdrawals', {
        provider, providerAccount: account, amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Processing');
      const id = r.data.withdrawalId;
      const interval = setInterval(async () => {
        const res = await axios.get('http://localhost:4000/api/withdrawals', { headers: { Authorization: `Bearer ${token}` }});
        const w = res.data.find(x=>x.id === id);
        if (w && w.status !== 'pending' && w.status !== 'processing') {
          setStatus(w.status);
          clearInterval(interval);
        }
      }, 1500);
    } catch (err) {
      setStatus('failed');
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Withdraw Funds</h2>
      <div className="text-sm text-slate-400">Select Provider to receive payout.</div>
      <form onSubmit={submit} className="space-y-3 mt-3">
        <select className="w-full p-3 rounded bg-slate-800" value={provider} onChange={e=>setProvider(e.target.value)}>
          {PROVIDERS.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="w-full p-3 rounded bg-slate-800" placeholder="Account Number" value={account} onChange={e=>setAccount(e.target.value)} />
        <input className="w-full p-3 rounded bg-slate-800" placeholder="Amount (₦)" value={amount} onChange={e=>setAmount(e.target.value)} />
        <button className="w-full bg-teal-500 p-3 rounded">CONFIRM WITHDRAWAL</button>
      </form>

      <div className="mt-4 p-3 bg-slate-800 rounded">
        <div>Note: Processing times vary by provider. Instant payouts are available for Wallet withdrawals.</div>
        <div className="mt-2">Status: <span className="font-medium">{status ?? '—'}</span></div>
      </div>
    </div>
  );
}
