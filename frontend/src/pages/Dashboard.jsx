import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return setUser(null);
        const userId = session.user.id;
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) {
          console.warn('Could not fetch profile', error);
          return setUser(null);
        }
        if (mounted) setUser(data);
      } catch (err) {
        console.warn('Error loading profile', err);
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      load();
    });
    return () => { mounted = false; if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <div>
      <Header />
      <main className="app-container">
        <div className="card bg-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Available Balance</div>
              <div className="text-3xl font-semibold text-amber-400">₦{((user?.wallet ?? 0)/100).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Trust Score</div>
              <progress className="progress progress-info" value={user?.trust_score ?? 0} max="100"></progress>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <div className="text-slate-400">No activity yet.</div>
        </section>

        <div className="mt-6 flex gap-3">
          <Link to="/withdraw" className="btn btn-primary">Withdraw</Link>
          <button onClick={logout} className="btn btn-ghost">Logout</button>
        </div>
      </main>
    </div>
  );
}
