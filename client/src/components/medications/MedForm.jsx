import { useState } from 'react';
import { postMedication } from '../../api/client';

const defaultForm = { name: '', dose: '', route: 'PO', frequency: 'Daily', scheduled_at: '', notes: '' };

export default function MedForm({ patientId, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const med = await postMedication(patientId, form);
      onSaved(med);
      setForm(defaultForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <h3 className="font-semibold text-slate-700 mb-3">Add Medication</h3>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Medication Name *</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Paracetamol" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Dose *</label>
          <input className="input" value={form.dose} onChange={set('dose')} required placeholder="e.g. 1g" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Route *</label>
          <select className="input" value={form.route} onChange={set('route')}>
            <option>PO</option><option>IV</option><option>IM</option><option>SC</option><option>SL</option><option>Topical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Frequency *</label>
          <select className="input" value={form.frequency} onChange={set('frequency')}>
            <option>Daily</option><option>BD</option><option>TDS</option><option>QID</option><option>PRN</option><option>Stat</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Due Time *</label>
          <input type="datetime-local" className="input" value={form.scheduled_at} onChange={set('scheduled_at')} required />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="block text-xs text-slate-500 mb-1">Notes</label>
          <input className="input" value={form.notes} onChange={set('notes')} placeholder="e.g. Give with food" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50">
        {saving ? 'Saving...' : 'Add Medication'}
      </button>
    </form>
  );
}
