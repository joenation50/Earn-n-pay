import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import Header from '../components/Header';

const PROVIDERS = ['PalmPay', 'Opay', 'Kuda', 'GTBank', 'UBA', 'Wallet'];

export default function Withdraw() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const userId = session.user.id;

      // fetch user to check wallet
      const { data: user, error: userErr } = await supabase.from('users').select('*').eq('id', userId).single();
      if (userErr) throw userErr;
      const amountCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) throw new Error('Enter a valid amount');
      if (amountCents > user.wallet) throw new Error('Insufficient balance');

      // create withdrawal
      const { data: w, error } = await supabase.from('withdrawals').insert([{ user_id: userId, provider, provider_account: account, amount_cents: amountCents, status: 'pending' }]).select().single();
      if (error) throw error;

      // decrement wallet
      await supabase.from('users').update({ wallet: user.wallet - amountCents }).eq('id', userId);

      // simulate payout
      setStatus('Processing…');
      setTimeout(async () => {
        try {
          const success = Math.random() > 0.2;
          const newStatus = success ? 'success' : 'failed';
          await supabase.from('withdrawals').update({ status: newStatus, provider_tx_ref: success ? `SIM-${w.id}` : null }).eq('id', w.id);
          setStatus(newStatus === 'success' ? 'Completed' : 'Failed');
        } catch (e) {
          setStatus('Error updating payout');
        }
      }, 1800);

    } catch (err) {
      setStatus(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header />
      <main className="app-container">
        <div className="card bg-slate-800 p-4">
          <h2 className="text-xl font-semibold mb-2">Withdraw Funds</h2>
          <form onSubmit={submit} className="space-y-3">
            <select className="select select-bordered w-full" value={provider} onChange={e=>setProvider(e.target.value)}>
              {PROVIDERS.map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="input input-bordered w-full" placeholder="Account Number" value={account} onChange={e=>setAccount(e.target.value)} />
            <input className="input input-bordered w-full" placeholder="Amount (₦)" value={amount} onChange={e=>setAmount(e.target.value)} />
            <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>Confirm Withdrawal</button>
          </form>

          <div className="mt-4 p-3 bg-slate-900 rounded">
            <div className="text-slate-400">Note: Processing times vary by provider. Instant payouts are available for Wallet withdrawals.</div>
            <div className="mt-2">Status: <span className="font-medium">{status ?? '—'}</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}
