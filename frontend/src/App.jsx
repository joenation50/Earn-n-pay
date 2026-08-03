import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="p-4 border-b border-slate-800">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Earn'n'Pay</h1>
          <nav>
            <Link to="/withdraw" className="bg-teal-500 text-white px-3 py-1 rounded">Withdraw</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
