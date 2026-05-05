import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { deleteVital } from '../../api/client';

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export default function VitalsChart({ patientId, vitals, onDeleted }) {
  const data = vitals.map((v) => ({
    time: fmt(v.recorded_at),
    'BP Sys': v.bp_systolic,
    'BP Dia': v.bp_diastolic,
    'HR': v.heart_rate,
    'Temp×10': v.temperature != null ? Math.round(v.temperature * 10) : null,
    'SpO2': v.spo2,
    'RR': v.resp_rate,
    _id: v.id,
  }));

  const handleDelete = async (id) => {
    if (!confirm('Delete this vitals entry?')) return;
    await deleteVital(patientId, id);
    onDeleted();
  };

  if (vitals.length === 0) {
    return <p className="text-slate-400 text-sm mt-2">No vitals recorded yet. Use the form above to add some.</p>;
  }

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <p className="text-xs text-slate-400 mb-3">Temp×10 = temperature in °C multiplied by 10 (so 37.2°C shows as 372) to fit on the same scale.</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="BP Sys" stroke="#ef4444" dot={true} connectNulls />
            <Line type="monotone" dataKey="BP Dia" stroke="#f97316" dot={true} connectNulls />
            <Line type="monotone" dataKey="HR" stroke="#3b82f6" dot={true} connectNulls />
            <Line type="monotone" dataKey="Temp×10" stroke="#a855f7" dot={true} connectNulls />
            <Line type="monotone" dataKey="SpO2" stroke="#10b981" dot={true} connectNulls />
            <Line type="monotone" dataKey="RR" stroke="#6b7280" dot={true} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-center">BP</th>
              <th className="px-3 py-2 text-center">HR</th>
              <th className="px-3 py-2 text-center">Temp</th>
              <th className="px-3 py-2 text-center">SpO2</th>
              <th className="px-3 py-2 text-center">RR</th>
              <th className="px-3 py-2 text-left">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v) => (
              <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{fmt(v.recorded_at)}</td>
                <td className="px-3 py-2 text-center">{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '—'}</td>
                <td className="px-3 py-2 text-center">{v.heart_rate ?? '—'}</td>
                <td className="px-3 py-2 text-center">{v.temperature != null ? `${v.temperature}°C` : '—'}</td>
                <td className="px-3 py-2 text-center">{v.spo2 != null ? `${v.spo2}%` : '—'}</td>
                <td className="px-3 py-2 text-center">{v.resp_rate ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{v.notes || ''}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
