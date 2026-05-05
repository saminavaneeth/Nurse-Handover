function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function LatestVitals({ vitals }) {
  if (!vitals || vitals.length === 0) return <p>No vitals recorded.</p>;
  const v = vitals[vitals.length - 1];
  return (
    <p>
      {v.bp_systolic && v.bp_diastolic ? `BP ${v.bp_systolic}/${v.bp_diastolic} | ` : ''}
      {v.heart_rate ? `HR ${v.heart_rate} | ` : ''}
      {v.temperature != null ? `Temp ${v.temperature}°C | ` : ''}
      {v.spo2 != null ? `SpO2 ${v.spo2}% | ` : ''}
      {v.resp_rate ? `RR ${v.resp_rate}` : ''}
      {' '}<em style={{ fontSize: '10pt', color: '#666' }}>at {fmt(v.recorded_at)}</em>
    </p>
  );
}

function PatientHandover({ patient, vitals, medications, investigations, notes }) {
  const todos = notes.filter((n) => n.type === 'todo');
  const freeNotes = notes.filter((n) => n.type === 'note');

  return (
    <div className="patient-handover-block" style={{ marginBottom: '24pt', paddingBottom: '16pt', borderBottom: '1px solid #ccc' }}>
      <h2 style={{ fontSize: '14pt', margin: '0 0 4pt' }}>{patient.name} — Bed {patient.bed}</h2>
      <p style={{ fontSize: '10pt', color: '#555', margin: '0 0 8pt' }}>
        MRN: {patient.mrn} | DOB: {patient.dob} | Code: {patient.code_status}
        {patient.diagnosis ? ` | Dx: ${patient.diagnosis}` : ''}
        {patient.allergies ? ` | Allergies: ${patient.allergies}` : ''}
      </p>

      <h3 style={{ fontSize: '11pt', margin: '8pt 0 4pt', borderBottom: '1px solid #eee' }}>Latest Vitals</h3>
      <LatestVitals vitals={vitals} />

      <h3 style={{ fontSize: '11pt', margin: '8pt 0 4pt', borderBottom: '1px solid #eee' }}>Medications</h3>
      {medications.length === 0 ? <p>None recorded.</p> : medications.map((m) => (
        <p key={m.id} style={{ margin: '2pt 0' }}>
          {m.status === 'given' ? '✓' : '○'} {m.name} {m.dose} {m.route} {m.frequency}
          {' — '}<strong>{m.status}</strong>
          {m.given_at ? ` at ${fmt(m.given_at)}` : ` (due ${fmt(m.scheduled_at)})`}
        </p>
      ))}

      <h3 style={{ fontSize: '11pt', margin: '8pt 0 4pt', borderBottom: '1px solid #eee' }}>Investigations</h3>
      {investigations.length === 0 ? <p>None recorded.</p> : investigations.map((inv) => (
        <p key={inv.id} style={{ margin: '2pt 0' }}>
          [{inv.type}] {inv.name} — <strong>{inv.status}</strong>
          {inv.result ? `: ${inv.result}` : ''}
        </p>
      ))}

      {freeNotes.length > 0 && (
        <>
          <h3 style={{ fontSize: '11pt', margin: '8pt 0 4pt', borderBottom: '1px solid #eee' }}>Notes</h3>
          {freeNotes.map((n) => <p key={n.id} style={{ margin: '2pt 0' }}>{n.content}</p>)}
        </>
      )}

      {todos.length > 0 && (
        <>
          <h3 style={{ fontSize: '11pt', margin: '8pt 0 4pt', borderBottom: '1px solid #eee' }}>To-Dos</h3>
          {todos.map((n) => (
            <p key={n.id} style={{ margin: '2pt 0' }}>
              {n.is_done ? '☑' : '☐'} {n.content}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

export default function HandoverSheet({ allPatientData }) {
  if (!allPatientData || allPatientData.length === 0) return null;

  return (
    <div className="handover-print-root hidden" style={{ padding: '16pt', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '16pt', borderBottom: '2px solid #333', paddingBottom: '8pt' }}>
        <h1 style={{ fontSize: '18pt', margin: 0 }}>Nursing Handover</h1>
        <p style={{ fontSize: '10pt', color: '#666', margin: '4pt 0 0' }}>
          Printed: {new Date().toLocaleString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {allPatientData.map(({ patient, vitals, medications, investigations, notes }) => (
        <PatientHandover
          key={patient.id}
          patient={patient}
          vitals={vitals}
          medications={medications}
          investigations={investigations}
          notes={notes}
        />
      ))}
    </div>
  );
}
