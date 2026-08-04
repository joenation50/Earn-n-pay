import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function NavItem({ to, label, active }){
  return (
    <Link to={to} className={`flex-1 text-center py-2 ${active ? 'text-sky-400' : 'text-slate-400'}`}>
      <div className="text-2xl">{label}</div>
    </Link>
  );
}

export default function BottomNav(){
  const loc = useLocation();
  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[94%] bg-white/5 backdrop-blur-md rounded-3xl shadow-lg px-3 py-2 flex items-center">
      <NavItem to="/" label="🏠" active={loc.pathname === '/'} />
      <NavItem to="/earn" label="⚡" active={loc.pathname === '/earn'} />
      <NavItem to="/upgrade" label="📈" active={loc.pathname === '/upgrade'} />
      <NavItem to="/referral" label="👥" active={loc.pathname === '/referral'} />
      <NavItem to="/contact" label="🎧" active={loc.pathname === '/contact'} />
    </nav>
  );
}
