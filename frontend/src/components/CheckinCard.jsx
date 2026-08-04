import React from 'react';

export default function CheckinCard({ streak = 0, done = false }){
  return (
    <div className="bg-white/5 p-4 rounded-2xl shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold">🔥</div>
      <div className="flex-1">
        <div className="text-lg font-semibold">Daily check-in</div>
        <div className="text-sm text-slate-400">{streak}-day streak · {done ? 'come back tomorrow' : 'come back today'}</div>
      </div>
      <div>
        <div className={`px-3 py-1 rounded-full ${done ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-700 text-slate-200'}`}>
          {done ? 'Done today' : 'Tap to check in'}
        </div>
      </div>
    </div>
  );
}
