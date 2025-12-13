export const Badge = ({ type, text }) => {
  const colors = {
    Critical: 'bg-rose-100 text-rose-800 border-rose-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    SourcePC: 'bg-blue-50 text-blue-700 border-blue-200',
    SourceBH: 'bg-purple-50 text-purple-700 border-purple-200',
    Validated: 'bg-green-100 text-green-800 border-green-200',
    Done: 'bg-green-100 text-green-800 border-green-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'To Do': 'bg-slate-100 text-slate-600 border-slate-200',
    Pending: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[type] || colors.Medium}`}>
      {text}
    </span>
  );
};
