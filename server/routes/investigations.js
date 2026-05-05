const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/patients/:id/investigations
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM investigations WHERE patient_id = ? ORDER BY ordered_at ASC'
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/patients/:id/investigations
router.post('/', (req, res) => {
  const { type, name, ordered_by, notes } = req.body;
  if (!type || !name) {
    return res.status(400).json({ error: 'type and name are required' });
  }
  const result = db.prepare(`
    INSERT INTO investigations (patient_id, type, name, ordered_by, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, type, name, ordered_by || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM investigations WHERE id = ?').get(result.lastInsertRowid));
});

// PATCH /api/patients/:id/investigations/:iId — update status/result
router.patch('/:iId', (req, res) => {
  const inv = db.prepare('SELECT * FROM investigations WHERE id = ? AND patient_id = ?').get(req.params.iId, req.params.id);
  if (!inv) return res.status(404).json({ error: 'Investigation not found' });

  const { status, result, actioned_by, actioned_at, notes } = req.body;
  db.prepare(`
    UPDATE investigations SET status=?, result=?, actioned_by=?, actioned_at=?, notes=? WHERE id=?
  `).run(
    status ?? inv.status,
    result ?? inv.result,
    actioned_by ?? inv.actioned_by,
    actioned_at ?? inv.actioned_at,
    notes ?? inv.notes,
    req.params.iId
  );
  res.json(db.prepare('SELECT * FROM investigations WHERE id = ?').get(req.params.iId));
});

// DELETE /api/patients/:id/investigations/:iId
router.delete('/:iId', (req, res) => {
  db.prepare('DELETE FROM investigations WHERE id = ? AND patient_id = ?').run(req.params.iId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
