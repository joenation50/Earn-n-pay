import React from 'react';

export default function BalanceCard({ balanceKobo = 0 }){
  const balanceNaira = (balanceKobo/100).toFixed(2);
  return (
    <div className="bg-gradient-to-r from-sky-500 to-indigo-500 text-slate-900 p-5 rounded-2xl shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">Available balance</div>
          <div className="text-3xl font-bold mt-2">₦{balanceNaira}</div>
        </div>
        <div className="space-x-2">
          <button className="btn btn-sm bg-white text-slate-900">Withdraw</button>
          <button className="btn btn-ghost btn-sm border border-white/40 text-white">Earn</button>
        </div>
      </div>
    </div>
  );
}
