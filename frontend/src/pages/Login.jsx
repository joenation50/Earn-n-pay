import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const r = await axios.post('http://localhost:4000/api/auth/login', { email, password });
      localStorage.setItem('token', r.data.token);
      nav('/');
    } catch (err) {
      alert('Login failed');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-2xl font-semibold">Login</h2>
      <input className="w-full p-3 rounded bg-slate-800" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" className="w-full p-3 rounded bg-slate-800" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full bg-teal-500 p-3 rounded">Login</button>
    </form>
  );
}
