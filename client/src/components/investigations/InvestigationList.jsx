import { useState } from 'react';
import { patchInvestigation, deleteInvestigation } from '../../api/client';

const statusStyle = {
  ordered: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resulted: 'bg-purple-100 text-purple-800',
  actioned: 'bg-green-100 text-green-800',
};

const typeStyle = {
  Blood: 'bg-red-50 text-red-700',
  Imaging: 'bg-sky-50 text-sky-700',
  ECG: 'bg-pink-50 text-pink-700',
  Urine: 'bg-amber-50 text-amber-700',
  Other: 'bg-slate-50 text-slate-600',
};

export default function InvestigationList({ patientId, investigations, onChanged }) {
  const [editingResult, setEditingResult] = useState(null);
  const [resultText, setResultText] = useState('');

  const updateStatus = async (invId, status) => {
    await patchInvestigation(patientId, invId, { status });
    onChanged();
  };

  const saveResult = async (invId) => {
    await patchInvestigation(patientId, invId, { result: resultText, status: 'resulted' });
    setEditingResult(null);
    onChanged();
  };

  const handleDelete = async (invId) => {
    if (!confirm('Remove this investigation?')) return;
    await deleteInvestigation(patientId, invId);
    onChanged();
  };

  if (investigations.length === 0) {
    return <p className="text-slate-400 text-sm">No investigations added yet.</p>;
  }

  return (
    <div className="space-y-2">
      {investigations.map((inv) => (
        <div key={inv.id} className="bg-white rounded-lg border border-slate-200 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeStyle[inv.type] || typeStyle.Other}`}>{inv.type}</span>
                <span className="font-semibold text-slate-800 text-sm">{inv.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[inv.status] || ''}`}>{inv.status}</span>
              </div>
              {inv.ordered_by && <p className="text-xs text-slate-400">Ordered by {inv.ordered_by}</p>}
              {inv.result && (
                <p className="text-sm text-slate-700 mt-1 bg-slate-50 rounded p-2">{inv.result}</p>
              )}
              {editingResult === inv.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="Enter result..."
                    autoFocus
                  />
                  <button onClick={() => saveResult(inv.id)} className="bg-purple-600 text-white text-xs px-3 py-1 rounded">Save</button>
                  <button onClick={() => setEditingResult(null)} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded">Cancel</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => handleDelete(inv.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
            </div>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            <button onClick={() => updateStatus(inv.id, 'ordered')} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Ordered</button>
            <button onClick={() => updateStatus(inv.id, 'pending')} className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pending</button>
            <button
              onClick={() => { setEditingResult(inv.id); setResultText(inv.result || ''); }}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
            >
              {inv.result ? 'Edit Result' : 'Enter Result'}
            </button>
            <button onClick={() => updateStatus(inv.id, 'actioned')} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-0.5 rounded">Actioned</button>
          </div>
        </div>
      ))}
    </div>
  );
}
