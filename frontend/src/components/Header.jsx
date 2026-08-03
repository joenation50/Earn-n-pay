import React from 'react';
import { Link } from 'react-router-dom';

export default function Header(){
  return (
    <header className="app-container flex items-center justify-between py-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-amber-400 rounded flex items-center justify-center font-bold text-slate-900">E</div>
        <div>
          <div className="text-lg font-semibold">Earn'n'Pay</div>
          <div className="text-xs text-slate-400">Earn & withdraw instantly</div>
        </div>
      </div>
      <nav className="hidden md:flex space-x-3">
        <Link to="/" className="btn btn-ghost">Dashboard</Link>
        <Link to="/withdraw" className="btn btn-ghost">Withdraw</Link>
        <Link to="/login" className="btn">Login</Link>
      </nav>
    </header>
  );
}
