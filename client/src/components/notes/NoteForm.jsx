import { useState } from 'react';
import { postNote } from '../../api/client';

export default function NoteForm({ patientId, onSaved }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('note');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const note = await postNote(patientId, { type, content: content.trim() });
      onSaved(note);
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
      <div className="flex gap-3 mb-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" value="note" checked={type === 'note'} onChange={() => setType('note')} />
          <span className="text-sm text-slate-700">Note</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" value="todo" checked={type === 'todo'} onChange={() => setType('todo')} />
          <span className="text-sm text-slate-700">To-Do</span>
        </label>
      </div>
      <textarea
        className="input w-full resize-none"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={type === 'todo' ? 'e.g. Recheck BP in 1 hour' : 'e.g. Patient anxious, wife updated'}
      />
      <button type="submit" disabled={saving || !content.trim()} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-50">
        {saving ? 'Saving...' : type === 'todo' ? 'Add To-Do' : 'Add Note'}
      </button>
    </form>
  );
}
