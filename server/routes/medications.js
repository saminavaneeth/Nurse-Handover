const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/patients/:id/medications
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM medications WHERE patient_id = ? ORDER BY scheduled_at ASC'
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/patients/:id/medications
router.post('/', (req, res) => {
  const { name, dose, route, frequency, scheduled_at, notes } = req.body;
  if (!name || !dose || !route || !frequency || !scheduled_at) {
    return res.status(400).json({ error: 'name, dose, route, frequency, and scheduled_at are required' });
  }
  const result = db.prepare(`
    INSERT INTO medications (patient_id, name, dose, route, frequency, scheduled_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, name, dose, route, frequency, scheduled_at, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid));
});

// PATCH /api/patients/:id/medications/:mId — update status
router.patch('/:mId', (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ? AND patient_id = ?').get(req.params.mId, req.params.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const { status, given_at, given_by, notes } = req.body;
  db.prepare(`
    UPDATE medications SET status=?, given_at=?, given_by=?, notes=? WHERE id=?
  `).run(
    status ?? med.status,
    given_at ?? med.given_at,
    given_by ?? med.given_by,
    notes ?? med.notes,
    req.params.mId
  );
  res.json(db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.mId));
});

// DELETE /api/patients/:id/medications/:mId
router.delete('/:mId', (req, res) => {
  db.prepare('DELETE FROM medications WHERE id = ? AND patient_id = ?').run(req.params.mId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
