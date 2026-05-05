const express = require('express');
const cors = require('cors');

require('./db'); // initialise database and seed data

const patientsRouter = require('./routes/patients');
const vitalsRouter = require('./routes/vitals');
const medicationsRouter = require('./routes/medications');
const investigationsRouter = require('./routes/investigations');
const notesRouter = require('./routes/notes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/patients', patientsRouter);
app.use('/api/patients/:id/vitals', vitalsRouter);
app.use('/api/patients/:id/medications', medicationsRouter);
app.use('/api/patients/:id/investigations', investigationsRouter);
app.use('/api/patients/:id/notes', notesRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Handover server running at http://localhost:${PORT}`);
});
