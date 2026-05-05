import { useEffect, useState } from 'react';

export default function Header({ title, onPrint }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatted = now.toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{formatted}</span>
        {onPrint && (
          <button
            onClick={onPrint}
            className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
          >
            Print Handover
          </button>
        )}
      </div>
    </header>
  );
}
