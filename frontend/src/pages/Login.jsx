import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      if (isRegister) {
        // sign up
        const { data: signData, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        const user = signData.user;
        // create profile in users table
        await supabase.from('users').insert([{ id: user.id, name: name || email.split('@')[0], email, wallet: 0, trust_score: 0 }]);
        alert('Registered. Please check your email to confirm if required, then login.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Got session — redirect to dashboard
        nav('/');
      }
    } catch (err) {
      alert('Auth error: ' + (err.message || JSON.stringify(err)));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-semibold">{isRegister ? 'Register' : 'Login'}</h2>
      {isRegister && (
        <input className="w-full p-3 rounded bg-slate-800" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
      )}
      <input className="w-full p-3 rounded bg-slate-800" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" className="w-full p-3 rounded bg-slate-800" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full bg-teal-500 p-3 rounded" type="submit">{isRegister ? 'Create account' : 'Login'}</button>
      <div className="text-sm text-slate-400">
        <button type="button" className="underline" onClick={()=>setIsRegister(r=>!r)}>{isRegister ? 'Have an account? Login' : "Don't have an account? Register"}</button>
      </div>
    </form>
  );
}
