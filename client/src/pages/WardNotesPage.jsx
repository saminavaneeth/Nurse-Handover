import { useEffect, useState, useCallback } from 'react';
import Header from '../components/layout/Header';
import { getPatients, getNotes, postNote, patchNote, deleteNote } from '../api/client';

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function WardNotesPage() {
  const [patients, setPatients] = useState([]);
  const [allNotes, setAllNotes] = useState([]); // [{ patient, note }]
  const [loading, setLoading] = useState(true);

  // Add note form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [type, setType] = useState('note');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filter, setFilter] = useState('all'); // 'all' | 'note' | 'todo' | 'todo-pending'

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const pts = await getPatients();
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(String(pts[0].id));
      }
      const notesPerPatient = await Promise.all(
        pts.map((p) => getNotes(p.id).then((notes) => notes.map((n) => ({ patient: p, note: n }))))
      );
      const flat = notesPerPatient.flat().sort((a, b) =>
        new Date(b.note.created_at) - new Date(a.note.created_at)
      );
      setAllNotes(flat);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim() || !selectedPatientId) return;
    setSaving(true);
    try {
      await postNote(selectedPatientId, { type, content: content.trim() });
      setContent('');
      await loadAll();
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (patientId, note) => {
    await patchNote(patientId, note.id, { is_done: !note.is_done });
    await loadAll();
  };

  const handleDelete = async (patientId, noteId) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote(patientId, noteId);
    await loadAll();
  };

  const filtered = allNotes.filter(({ note }) => {
    if (filter === 'note') return note.type === 'note';
    if (filter === 'todo') return note.type === 'todo';
    if (filter === 'todo-pending') return note.type === 'todo' && !note.is_done;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Ward Notes & To-Dos" />
      <main className="flex-1 overflow-y-auto p-6">

        {/* Add note form */}
        <form onSubmit={handleAdd} className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">Add Note or To-Do</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Patient *</label>
              <select
                className="input"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>Bed {p.bed} — {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="note" checked={type === 'note'} onChange={() => setType('note')} />
                  <span className="text-sm text-slate-700">Note</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value="todo" checked={type === 'todo'} onChange={() => setType('todo')} />
                  <span className="text-sm text-slate-700">To-Do</span>
                </label>
              </div>
            </div>
          </div>
          <textarea
            className="input w-full resize-none mb-3"
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'todo' ? 'e.g. Recheck BP in 1 hour' : 'e.g. Family updated re: discharge plan'}
          />
          <button
            type="submit"
            disabled={saving || !content.trim() || !selectedPatientId}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : type === 'todo' ? 'Add To-Do' : 'Add Note'}
          </button>
        </form>

        {/* Filter bar */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'todo-pending', label: 'Pending To-Dos' },
            { key: 'todo', label: 'All To-Dos' },
            { key: 'note', label: 'Notes Only' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 self-center">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Notes list */}
        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm">No items to show.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(({ patient, note }) => (
              <div
                key={`${patient.id}-${note.id}`}
                className="bg-white rounded-lg border border-slate-200 p-3 flex items-start gap-3"
              >
                {note.type === 'todo' && (
                  <input
                    type="checkbox"
                    checked={!!note.is_done}
                    onChange={() => toggleDone(patient.id, note)}
                    className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer flex-shrink-0"
                  />
                )}
                {note.type === 'note' && (
                  <span className="mt-0.5 flex-shrink-0 text-slate-300 text-lg leading-none">•</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${note.type === 'todo' && note.is_done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {note.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Bed {patient.bed} — {patient.name}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${note.type === 'todo' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {note.type}
                    </span>
                    <span className="text-xs text-slate-400">{fmt(note.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(patient.id, note.id)}
                  className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
