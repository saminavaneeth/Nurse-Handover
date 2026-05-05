const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/patients/:id/notes
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM notes WHERE patient_id = ? ORDER BY created_at ASC'
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/patients/:id/notes
router.post('/', (req, res) => {
  const { type, content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  const result = db.prepare(`
    INSERT INTO notes (patient_id, type, content) VALUES (?, ?, ?)
  `).run(req.params.id, type || 'note', content);
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid));
});

// PATCH /api/patients/:id/notes/:nId — edit content or toggle is_done
router.patch('/:nId', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND patient_id = ?').get(req.params.nId, req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const { content, is_done } = req.body;
  db.prepare(`
    UPDATE notes SET content=?, is_done=?, updated_at=datetime('now') WHERE id=?
  `).run(
    content ?? note.content,
    is_done !== undefined ? (is_done ? 1 : 0) : note.is_done,
    req.params.nId
  );
  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.nId));
});

// DELETE /api/patients/:id/notes/:nId
router.delete('/:nId', (req, res) => {
  db.prepare('DELETE FROM notes WHERE id = ? AND patient_id = ?').run(req.params.nId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
