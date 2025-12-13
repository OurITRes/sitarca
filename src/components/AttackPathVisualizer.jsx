import { User, Server, Target } from 'lucide-react';

export const AttackPathVisualizer = () => (
  <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
    <div className="absolute top-4 left-4 text-xs text-slate-400 font-mono">
      {`> GRAPH_QUERY: MATCH p=(u:User)-[r:MemberOf*1..]->(g:Group {name:'DOMAIN ADMINS'}) RETURN p`}
    </div>
   
    <svg className="w-full h-full" viewBox="0 0 600 200">
      <line x1="100" y1="100" x2="250" y2="100" stroke="#64748b" strokeWidth="2" strokeDasharray="4"/>
      <line x1="250" y1="100" x2="400" y2="100" stroke="#ef4444" strokeWidth="3" />
      <line x1="400" y1="100" x2="500" y2="100" stroke="#ef4444" strokeWidth="3" />
     
      <g className="cursor-pointer hover:opacity-80 transition-opacity">
        <circle cx="100" cy="100" r="25" fill="#3b82f6" />
        <User x="88" y="88" className="text-white w-6 h-6" />
        <text x="100" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Compromised User</text>
      </g>

      <g className="cursor-pointer hover:opacity-80 transition-opacity">
        <rect x="225" y="75" width="50" height="50" rx="4" fill="#6366f1" />
        <UsersGroupIcon x="238" y="88" className="text-white w-6 h-6" />
        <text x="250" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Helpdesk Group</text>
        <text x="175" y="95" fill="#64748b" fontSize="10">MemberOf</text>
      </g>

      <g className="cursor-pointer hover:opacity-80 transition-opacity">
        <rect x="375" y="75" width="50" height="50" rx="4" fill="#f59e0b" />
        <Server x="388" y="88" className="text-white w-6 h-6" />
        <text x="400" y="140" textAnchor="middle" fill="#94a3b8" fontSize="12">Admin Server</text>
        <text x="325" y="95" fill="#ef4444" fontSize="10" fontWeight="bold">AdminTo</text>
      </g>

      <g className="cursor-pointer hover:opacity-80 transition-opacity animate-pulse">
        <circle cx="500" cy="100" r="30" fill="#ef4444" stroke="#7f1d1d" strokeWidth="4" />
        <Target x="488" y="88" className="text-white w-6 h-6" />
        <text x="500" y="150" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">DOMAIN ADMINS</text>
        <text x="450" y="95" fill="#ef4444" fontSize="10" fontWeight="bold">MemberOf</text>
      </g>
    </svg>
  </div>
);

const UsersGroupIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
