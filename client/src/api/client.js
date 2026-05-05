async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Patients
export const getPatients = () => request('/api/patients');
export const getPatient = (id) => request(`/api/patients/${id}`);
export const createPatient = (data) => request('/api/patients', { method: 'POST', body: JSON.stringify(data) });
export const updatePatient = (id, data) => request(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePatient = (id) => request(`/api/patients/${id}`, { method: 'DELETE' });

// Vitals
export const getVitals = (patientId) => request(`/api/patients/${patientId}/vitals`);
export const postVital = (patientId, data) => request(`/api/patients/${patientId}/vitals`, { method: 'POST', body: JSON.stringify(data) });
export const deleteVital = (patientId, vId) => request(`/api/patients/${patientId}/vitals/${vId}`, { method: 'DELETE' });

// Medications
export const getMedications = (patientId) => request(`/api/patients/${patientId}/medications`);
export const postMedication = (patientId, data) => request(`/api/patients/${patientId}/medications`, { method: 'POST', body: JSON.stringify(data) });
export const patchMedication = (patientId, mId, data) => request(`/api/patients/${patientId}/medications/${mId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteMedication = (patientId, mId) => request(`/api/patients/${patientId}/medications/${mId}`, { method: 'DELETE' });

// Investigations
export const getInvestigations = (patientId) => request(`/api/patients/${patientId}/investigations`);
export const postInvestigation = (patientId, data) => request(`/api/patients/${patientId}/investigations`, { method: 'POST', body: JSON.stringify(data) });
export const patchInvestigation = (patientId, iId, data) => request(`/api/patients/${patientId}/investigations/${iId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteInvestigation = (patientId, iId) => request(`/api/patients/${patientId}/investigations/${iId}`, { method: 'DELETE' });

// Notes
export const getNotes = (patientId) => request(`/api/patients/${patientId}/notes`);
export const postNote = (patientId, data) => request(`/api/patients/${patientId}/notes`, { method: 'POST', body: JSON.stringify(data) });
export const patchNote = (patientId, nId, data) => request(`/api/patients/${patientId}/notes/${nId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteNote = (patientId, nId) => request(`/api/patients/${patientId}/notes/${nId}`, { method: 'DELETE' });
