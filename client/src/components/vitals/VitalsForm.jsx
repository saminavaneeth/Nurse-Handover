import { useState } from 'react';
import { postVital } from '../../api/client';

const defaultForm = { bp_systolic: '', bp_diastolic: '', heart_rate: '', temperature: '', spo2: '', resp_rate: '', notes: '', recorded_at: '' };

export default function VitalsForm({ patientId, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const vital = await postVital(patientId, {
        ...form,
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        spo2: form.spo2 ? Number(form.spo2) : null,
        resp_rate: form.resp_rate ? Number(form.resp_rate) : null,
      });
      onSaved(vital);
      setForm(defaultForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-700 mb-3">Record Vitals</h3>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">BP Systolic (mmHg)</label>
          <input type="number" className="input" placeholder="120" value={form.bp_systolic} onChange={set('bp_systolic')} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">BP Diastolic (mmHg)</label>
          <input type="number" className="input" placeholder="80" value={form.bp_diastolic} onChange={set('bp_diastolic')} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Heart Rate (bpm)</label>
          <input type="number" className="input" placeholder="72" value={form.heart_rate} onChange={set('heart_rate')} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Temperature (°C)</label>
          <input type="number" step="0.1" className="input" placeholder="37.0" value={form.temperature} onChange={set('temperature')} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">SpO2 (%)</label>
          <input type="number" className="input" placeholder="98" value={form.spo2} onChange={set('spo2')} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Resp Rate (/min)</label>
          <input type="number" className="input" placeholder="16" value={form.resp_rate} onChange={set('resp_rate')} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Time (leave blank for now)</label>
          <input type="datetime-local" className="input" value={form.recorded_at} onChange={set('recorded_at')} />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="block text-xs text-slate-500 mb-1">Notes</label>
          <input className="input" placeholder="e.g. Post-exercise, pain 6/10" value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Vitals'}
      </button>
    </form>
  );
}
