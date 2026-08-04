import React from 'react';

export default function TrustCard({ score = 1 }){
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="bg-white/5 p-4 rounded-2xl shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white font-bold">🌿</div>
        <div className="flex-1">
          <div className="text-sm text-slate-300 font-medium">Trust Score</div>
          <div className="text-2xl font-semibold mt-1">{score}</div>
          <div className="w-full bg-slate-700 h-3 rounded-full mt-3 overflow-hidden">
            <div className="h-3 bg-emerald-400 rounded-full" style={{ width: `${pct}%` }}></div>
          </div>
          <div className="text-xs text-slate-400 mt-2">{Math.max(0, 20 - score)} more to <strong>Beginner</strong> · tap to upgrade</div>
        </div>
        <div>
          <div className="badge badge-outline">Free</div>
        </div>
      </div>
    </div>
  );
}
