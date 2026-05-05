import { patchMedication, deleteMedication } from '../../api/client';

const statusStyle = {
  given: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  missed: 'bg-red-100 text-red-800',
  withheld: 'bg-orange-100 text-orange-800',
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export default function MedList({ patientId, medications, onChanged }) {
  const updateStatus = async (medId, status) => {
    const given_at = status === 'given' ? new Date().toISOString().slice(0, 16) : null;
    await patchMedication(patientId, medId, { status, given_at });
    onChanged();
  };

  const handleDelete = async (medId) => {
    if (!confirm('Remove this medication?')) return;
    await deleteMedication(patientId, medId);
    onChanged();
  };

  if (medications.length === 0) {
    return <p className="text-slate-400 text-sm">No medications added yet.</p>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2 text-left">Medication</th>
            <th className="px-3 py-2 text-left">Dose / Route</th>
            <th className="px-3 py-2 text-left">Frequency</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Actions</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {medications.map((m) => (
            <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-slate-800">{m.name}</td>
              <td className="px-3 py-2 text-slate-600">{m.dose} {m.route}</td>
              <td className="px-3 py-2 text-slate-600">{m.frequency}</td>
              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{fmt(m.scheduled_at)}</td>
              <td className="px-3 py-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[m.status] || ''}`}>
                  {m.status}
                </span>
                {m.given_at && <span className="text-xs text-slate-400 ml-1">at {fmt(m.given_at)}</span>}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => updateStatus(m.id, 'given')} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-0.5 rounded">Give</button>
                  <button onClick={() => updateStatus(m.id, 'missed')} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded">Miss</button>
                  <button onClick={() => updateStatus(m.id, 'withheld')} className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-0.5 rounded">Withhold</button>
                  <button onClick={() => updateStatus(m.id, 'pending')} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Reset</button>
                </div>
              </td>
              <td className="px-3 py-2">
                <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
