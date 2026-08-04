import React, {useState, useEffect} from 'react';
import supabase from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    let mounted = true;
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) nav('/');
    }
    check();
    return () => { mounted = false; };
  }, [nav]);

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Create account
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // If user object present, upsert profile record.
        const user = (data && data.user) || null;
        if (user) {
          await supabase.from('users').upsert([{ id: user.id, name: name || email.split('@')[0], email, wallet: 0, trust_score: 0 }], { onConflict: 'id' });
        }

        // If a session was returned, user is already logged in; redirect.
        if (data && data.session) {
          nav('/');
          return;
        }

        // Otherwise show a helpful message (email confirmation may be required)
        setMessage('Registered — please check your email to confirm your account before signing in.');
        setIsRegister(false);
        setEmail(email);
        setPassword('');
        setLoading(false);
        return;
      }

      // Sign in flow
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Redirect to dashboard on success
      nav('/');

    } catch (err) {
      const text = err?.message || JSON.stringify(err);
      setMessage(text);
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

            {message && (
              <div className="alert alert-info mt-3">
                <div>{message}</div>
              </div>
            )}

            {isRegister && (
              <input className="input input-bordered w-full mt-4" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
            )}

            <input className="input input-bordered w-full mt-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" className="input input-bordered w-full mt-3" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

            <div className="mt-4">
              <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} onClick={submit} disabled={loading}>{isRegister ? 'Create account' : 'Sign in'}</button>
            </div>

            <div className="mt-3 text-center text-slate-400">
              <button className="link link-hover" type="button" onClick={()=>{setIsRegister(r=>!r); setMessage(null);}}>{isRegister ? 'Have an account? Sign in' : "Don't have an account? Register"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
