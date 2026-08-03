import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setUser(null);
      const userId = session.user.id;
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) {
        console.warn('Could not fetch profile', error);
        return setUser(null);
      }
      if (mounted) setUser(data);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <div>
      <section className="bg-slate-800 rounded p-4">
        <h2 className="text-lg">Good morning, {user?.name ?? 'Guest'}</h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Available Balance</div>
            <div className="text-2xl font-semibold text-teal-400">₦{((user?.wallet ?? 0)/100).toFixed(2)}</div>
          </div>
          <div className="space-y-2">
            <Link to="/withdraw" className="block bg-amber-400 text-slate-900 px-3 py-2 rounded">Withdraw</Link>
            <button onClick={logout} className="block bg-slate-700 text-white px-3 py-2 rounded">Logout</button>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h3 className="text-sm text-slate-400">Trust Score</h3>
        <div className="mt-2 bg-slate-800 rounded h-3 w-full">
          <div className="bg-teal-500 h-3 rounded" style={{width: `${Math.min((user?.trust_score ?? 0)*10, 100)}%`}} />
        </div>
        <div className="text-sm text-slate-400 mt-2">Tasks today: 0 done / 3 remaining</div>
      </section>
    </div>
  );
}
