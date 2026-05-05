import { patchNote, deleteNote } from '../../api/client';

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NoteList({ patientId, notes, onChanged }) {
  const todos = notes.filter((n) => n.type === 'todo');
  const freeNotes = notes.filter((n) => n.type === 'note');

  const toggleDone = async (note) => {
    await patchNote(patientId, note.id, { is_done: !note.is_done });
    onChanged();
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    await deleteNote(patientId, noteId);
    onChanged();
  };

  return (
    <div className="space-y-4">
      {todos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">To-Dos</h4>
          <div className="space-y-2">
            {todos.map((n) => (
              <div key={n.id} className="bg-white rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!n.is_done}
                  onChange={() => toggleDone(n)}
                  className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer"
                />
                <div className="flex-1">
                  <p className={`text-sm ${n.is_done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{n.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(n.created_at)}</p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {freeNotes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Notes</h4>
          <div className="space-y-2">
            {freeNotes.map((n) => (
              <div key={n.id} className="bg-white rounded-lg border border-slate-200 p-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{n.content}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(n.created_at)}</p>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-red-400 hover:text-red-600 text-xs flex-shrink-0">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {todos.length === 0 && freeNotes.length === 0 && (
        <p className="text-slate-400 text-sm">No notes yet. Add a note or to-do above.</p>
      )}
    </div>
  );
}
