import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Header from '../components/Header';
import BalanceCard from '../components/BalanceCard';
import TrustCard from '../components/TrustCard';
import CheckinCard from '../components/CheckinCard';
import BottomNav from '../components/BottomNav';

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
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; if (sub && sub.subscription) sub.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-900">
      <Header />
      <main className="app-container space-y-6">
        <BalanceCard balanceKobo={user?.wallet ?? 0} />

        <div className="grid grid-cols-1 gap-4">
          <TrustCard score={user?.trust_score ?? 1} />
          <CheckinCard streak={3} done={true} />
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <div className="text-slate-400">No activity yet.</div>
        </section>

        <div className="mt-6 flex gap-3">
          <button onClick={logout} className="btn btn-ghost">Logout</button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
