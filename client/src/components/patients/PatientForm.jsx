import { useState } from 'react';
import { createPatient } from '../../api/client';

const defaultForm = { name: '', dob: '', mrn: '', bed: '', diagnosis: '', allergies: '', code_status: 'Full' };

export default function PatientForm({ onSaved, onCancel }) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const patient = await createPatient(form);
      onSaved(patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Patient</h2>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
              <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth *</label>
              <input type="date" className="input" value={form.dob} onChange={set('dob')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">MRN *</label>
              <input className="input" value={form.mrn} onChange={set('mrn')} required placeholder="e.g. MRN-10045" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bed *</label>
              <input className="input" value={form.bed} onChange={set('bed')} required placeholder="e.g. 4C" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code Status</label>
              <select className="input" value={form.code_status} onChange={set('code_status')}>
                <option>Full</option>
                <option>DNR</option>
                <option>DNI</option>
                <option>Comfort</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Diagnosis</label>
              <input className="input" value={form.diagnosis} onChange={set('diagnosis')} placeholder="e.g. NSTEMI, Type 2 Diabetes" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Allergies</label>
              <input className="input" value={form.allergies} onChange={set('allergies')} placeholder="e.g. Penicillin, None known" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Patient'}
            </button>
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-md text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
