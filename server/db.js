const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'handover.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    dob         TEXT NOT NULL,
    mrn         TEXT NOT NULL UNIQUE,
    bed         TEXT NOT NULL,
    diagnosis   TEXT,
    allergies   TEXT,
    code_status TEXT DEFAULT 'Full',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vitals (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at  TEXT DEFAULT (datetime('now')),
    bp_systolic  INTEGER,
    bp_diastolic INTEGER,
    heart_rate   INTEGER,
    temperature  REAL,
    spo2         INTEGER,
    resp_rate    INTEGER,
    notes        TEXT
  );

  CREATE TABLE IF NOT EXISTS medications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    dose         TEXT NOT NULL,
    route        TEXT NOT NULL,
    frequency    TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    status       TEXT DEFAULT 'pending',
    given_at     TEXT,
    given_by     TEXT,
    notes        TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS investigations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    name         TEXT NOT NULL,
    ordered_at   TEXT DEFAULT (datetime('now')),
    ordered_by   TEXT,
    status       TEXT DEFAULT 'ordered',
    result       TEXT,
    actioned_by  TEXT,
    actioned_at  TEXT,
    notes        TEXT
  );

  CREATE TABLE IF NOT EXISTS notes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type         TEXT DEFAULT 'note',
    content      TEXT NOT NULL,
    is_done      INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
  );
`);

// Seed sample data on first run
const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
if (patientCount.count === 0) {
  const insertPatient = db.prepare(`
    INSERT INTO patients (name, dob, mrn, bed, diagnosis, allergies, code_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = insertPatient.run('Margaret Collins', '1948-03-12', 'MRN-10041', '4A', 'NSTEMI, Type 2 Diabetes', 'Penicillin', 'Full');
  const p2 = insertPatient.run('James Thornton', '1955-07-28', 'MRN-10042', '4B', 'Community-acquired pneumonia', 'None known', 'DNR');

  const insertVital = db.prepare(`
    INSERT INTO vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature, spo2, resp_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const timeAgo = (hours) => new Date(now - hours * 3600000).toISOString().slice(0, 16);

  insertVital.run(p1.lastInsertRowid, timeAgo(6), 148, 90, 88, 37.1, 96, 18);
  insertVital.run(p1.lastInsertRowid, timeAgo(4), 142, 86, 84, 37.2, 97, 17);
  insertVital.run(p1.lastInsertRowid, timeAgo(2), 138, 84, 80, 37.0, 98, 16);

  insertVital.run(p2.lastInsertRowid, timeAgo(6), 118, 74, 96, 38.4, 92, 22);
  insertVital.run(p2.lastInsertRowid, timeAgo(4), 120, 76, 92, 38.1, 93, 21);
  insertVital.run(p2.lastInsertRowid, timeAgo(2), 122, 78, 88, 37.8, 94, 20);

  db.prepare(`INSERT INTO medications (patient_id, name, dose, route, frequency, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(p1.lastInsertRowid, 'Aspirin', '100mg', 'PO', 'Daily', timeAgo(5), 'given');
  db.prepare(`INSERT INTO medications (patient_id, name, dose, route, frequency, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(p1.lastInsertRowid, 'Metoprolol', '25mg', 'PO', 'BD', timeAgo(1), 'pending');

  db.prepare(`INSERT INTO medications (patient_id, name, dose, route, frequency, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(p2.lastInsertRowid, 'Amoxicillin', '500mg', 'IV', 'TDS', timeAgo(4), 'given');
  db.prepare(`INSERT INTO medications (patient_id, name, dose, route, frequency, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(p2.lastInsertRowid, 'Paracetamol', '1g', 'PO', 'QID', timeAgo(1), 'pending');

  db.prepare(`INSERT INTO investigations (patient_id, type, name, ordered_by, status, result)
    VALUES (?, ?, ?, ?, ?, ?)`).run(p1.lastInsertRowid, 'Blood', 'Troponin', 'Dr Smith', 'resulted', 'Troponin T: 45 ng/L (elevated)');
  db.prepare(`INSERT INTO investigations (patient_id, type, name, ordered_by, status)
    VALUES (?, ?, ?, ?, ?)`).run(p1.lastInsertRowid, 'Imaging', 'Echo', 'Dr Smith', 'pending');

  db.prepare(`INSERT INTO investigations (patient_id, type, name, ordered_by, status, result)
    VALUES (?, ?, ?, ?, ?, ?)`).run(p2.lastInsertRowid, 'Blood', 'FBC + CRP', 'Dr Jones', 'resulted', 'WCC 14.2, CRP 87 — improving');
  db.prepare(`INSERT INTO investigations (patient_id, type, name, ordered_by, status)
    VALUES (?, ?, ?, ?, ?)`).run(p2.lastInsertRowid, 'Imaging', 'CXR', 'Dr Jones', 'actioned');

  db.prepare(`INSERT INTO notes (patient_id, type, content) VALUES (?, ?, ?)`).run(p1.lastInsertRowid, 'note', 'Patient anxious about cardiology review tomorrow. Wife contacted and updated.');
  db.prepare(`INSERT INTO notes (patient_id, type, content) VALUES (?, ?, ?)`).run(p1.lastInsertRowid, 'todo', 'Recheck BP in 1 hour and document');
  db.prepare(`INSERT INTO notes (patient_id, type, content) VALUES (?, ?, ?)`).run(p2.lastInsertRowid, 'note', 'O2 therapy via nasal prongs 2L/min. Tolerating well. Physiotherapy review booked for tomorrow.');
  db.prepare(`INSERT INTO notes (patient_id, type, content) VALUES (?, ?, ?)`).run(p2.lastInsertRowid, 'todo', 'Notify next shift re: repeat CXR result');

  console.log('Sample data seeded successfully.');
}

module.exports = db;
