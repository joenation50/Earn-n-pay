import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';

const PROVIDERS = ['PalmPay', 'Opay', 'Kuda', 'GTBank', 'UBA', 'Wallet'];

export default function Withdraw() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      // fetch user to check wallet
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!user) throw new Error('User not found');
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (amountCents <= 0 || amountCents > user.wallet) throw new Error('Invalid amount');

      // create withdrawal
      const { data: w, error } = await supabase.from('withdrawals').insert([{ user_id: userId, provider, provider_account: account, amount_cents: amountCents, status: 'pending' }]).select().single();
      if (error) throw error;

      // decrement wallet
      await supabase.from('users').update({ wallet: user.wallet - amountCents }).eq('id', userId);

      // simulate payout
      setTimeout(async () => {
        const success = Math.random() > 0.2;
        const newStatus = success ? 'success' : 'failed';
        await supabase.from('withdrawals').update({ status: newStatus, provider_tx_ref: success ? `SIM-${w.id}` : null }).eq('id', w.id);
      }, 2000);

      setStatus('Processing');
    } catch (err) {
      setStatus('failed: ' + (err.message || JSON.stringify(err)));
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
