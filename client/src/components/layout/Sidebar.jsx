import { NavLink } from 'react-router-dom';

export default function Sidebar({ patients, onAddPatient }) {
  return (
    <aside className="w-56 bg-slate-800 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Handover</h1>
        <p className="text-xs text-slate-400 mt-1">Nursing Shift Tool</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <NavLink
          to="/ward-notes"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-md mb-3 text-sm font-medium transition-colors ${
              isActive ? 'bg-amber-500 text-white' : 'text-amber-300 hover:bg-slate-700'
            }`
          }
        >
          <span>📋</span>
          <span>Ward Notes & To-Dos</span>
        </NavLink>
        <div className="text-xs uppercase text-slate-500 font-semibold mb-2 px-1">Patients</div>
        {patients.length === 0 && (
          <p className="text-slate-500 text-sm px-1">No patients yet</p>
        )}
        {patients.map((p) => (
          <NavLink
            key={p.id}
            to={`/patient/${p.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md mb-1 text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
              }`
            }
          >
            <span className="font-mono text-xs bg-slate-600 px-1.5 py-0.5 rounded">{p.bed}</span>
            <span className="truncate">{p.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={onAddPatient}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
        >
          + Add Patient
        </button>
      </div>
    </aside>
  );
}
