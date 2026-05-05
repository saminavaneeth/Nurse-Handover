const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/patients — list all patients
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients ORDER BY bed ASC').all();
  res.json(rows);
});

// POST /api/patients — create a patient
router.post('/', (req, res) => {
  const { name, dob, mrn, bed, diagnosis, allergies, code_status } = req.body;
  if (!name || !dob || !mrn || !bed) {
    return res.status(400).json({ error: 'name, dob, mrn, and bed are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO patients (name, dob, mrn, bed, diagnosis, allergies, code_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, dob, mrn, bed, diagnosis || null, allergies || null, code_status || 'Full');
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(patient);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'A patient with that MRN already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id — get one patient
router.get('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

// PUT /api/patients/:id — update a patient
router.put('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const { name, dob, mrn, bed, diagnosis, allergies, code_status } = req.body;
  db.prepare(`
    UPDATE patients SET name=?, dob=?, mrn=?, bed=?, diagnosis=?, allergies=?, code_status=?
    WHERE id=?
  `).run(
    name ?? patient.name,
    dob ?? patient.dob,
    mrn ?? patient.mrn,
    bed ?? patient.bed,
    diagnosis ?? patient.diagnosis,
    allergies ?? patient.allergies,
    code_status ?? patient.code_status,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id));
});

// DELETE /api/patients/:id — remove a patient
router.delete('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
