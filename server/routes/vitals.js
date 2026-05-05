const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/patients/:id/vitals
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at ASC'
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/patients/:id/vitals
router.post('/', (req, res) => {
  const { bp_systolic, bp_diastolic, heart_rate, temperature, spo2, resp_rate, notes, recorded_at } = req.body;
  const result = db.prepare(`
    INSERT INTO vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature, spo2, resp_rate, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    recorded_at || new Date().toISOString().slice(0, 16),
    bp_systolic || null,
    bp_diastolic || null,
    heart_rate || null,
    temperature || null,
    spo2 || null,
    resp_rate || null,
    notes || null
  );
  res.status(201).json(db.prepare('SELECT * FROM vitals WHERE id = ?').get(result.lastInsertRowid));
});

// DELETE /api/patients/:id/vitals/:vId
router.delete('/:vId', (req, res) => {
  db.prepare('DELETE FROM vitals WHERE id = ? AND patient_id = ?').run(req.params.vId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
