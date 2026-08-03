import React, {useState} from 'react';
import supabase from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        // sign up
        const { data: signData, error: signErr } = await supabase.auth.signUp({ email, password });
        if (signErr) throw signErr;
        const user = signData.user;
        // ensure profile exists (upsert avoids duplicate key errors)
        await supabase.from('users').upsert([{ id: user.id, name: name || email.split('@')[0], email, wallet: 0, trust_score: 0 }], { onConflict: 'id' });
        // auto-login after sign up (some Supabase setups require email confirm; this will attempt login)
        const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signinErr) {
          // if signin fails due to confirmation, just inform user
          alert('Registered. Please check your email to confirm your account, then login.');
          setLoading(false);
          return;
        }
        nav('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Got session — redirect to dashboard
        nav('/');
      }
    } catch (err) {
      alert('Auth error: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <div className="max-w-md mx-auto">
        <div className="card bg-slate-800 shadow-md">
          <div className="card-body">
            <h2 className="card-title">{isRegister ? 'Create account' : 'Welcome back'}</h2>
            <p className="text-slate-400">{isRegister ? 'Register to start earning' : 'Login to continue'}</p>

            {isRegister && (
              <input className="input input-bordered w-full mt-4" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
            )}

            <input className="input input-bordered w-full mt-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" className="input input-bordered w-full mt-3" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

            <div className="mt-4">
              <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} onClick={submit} disabled={loading}>{isRegister ? 'Create account' : 'Sign in'}</button>
            </div>

            <div className="mt-3 text-center text-slate-400">
              <button className="link link-hover" type="button" onClick={()=>setIsRegister(r=>!r)}>{isRegister ? 'Have an account? Sign in' : "Don't have an account? Register"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
