import { useState } from 'react';
import { postInvestigation } from '../../api/client';

const defaultForm = { type: 'Blood', name: '', ordered_by: '', notes: '' };

export default function InvestigationForm({ patientId, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const inv = await postInvestigation(patientId, form);
      onSaved(inv);
      setForm(defaultForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <h3 className="font-semibold text-slate-700 mb-3">Add Investigation / Test</h3>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Type *</label>
          <select className="input" value={form.type} onChange={set('type')}>
            <option>Blood</option><option>Imaging</option><option>ECG</option><option>Urine</option><option>Other</option>
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Test Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. FBC, CXR, Troponin" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Ordered By</label>
          <input className="input" value={form.ordered_by} onChange={set('ordered_by')} placeholder="e.g. Dr Smith" />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <label className="block text-xs text-slate-500 mb-1">Notes</label>
          <input className="input" value={form.notes} onChange={set('notes')} placeholder="e.g. Urgent, repeat at 6h" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50">
        {saving ? 'Saving...' : 'Add Investigation'}
      </button>
    </form>
  );
}
