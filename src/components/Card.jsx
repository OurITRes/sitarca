export const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}>
    {children}
  </div>
);
