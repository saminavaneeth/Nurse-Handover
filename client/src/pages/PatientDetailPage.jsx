import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import VitalsForm from '../components/vitals/VitalsForm';
import VitalsChart from '../components/vitals/VitalsChart';
import MedForm from '../components/medications/MedForm';
import MedList from '../components/medications/MedList';
import InvestigationForm from '../components/investigations/InvestigationForm';
import InvestigationList from '../components/investigations/InvestigationList';
import NoteForm from '../components/notes/NoteForm';
import NoteList from '../components/notes/NoteList';
import {
  getPatient, getVitals, getMedications, getInvestigations, getNotes, deletePatient,
} from '../api/client';

const TABS = ['Vitals', 'Medications', 'Investigations', 'Notes & To-Dos'];

const codeColors = {
  Full: 'bg-green-100 text-green-800',
  DNR: 'bg-red-100 text-red-800',
  DNI: 'bg-red-100 text-red-800',
  Comfort: 'bg-orange-100 text-orange-800',
};

export default function PatientDetailPage({ onPatientDeleted }) {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('Vitals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, v, m, i, n] = await Promise.all([
        getPatient(id),
        getVitals(id),
        getMedications(id),
        getInvestigations(id),
        getNotes(id),
      ]);
      setPatient(p);
      setVitals(v);
      setMedications(m);
      setInvestigations(i);
      setNotes(n);
    } catch (err) {
      setError('Could not load patient data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async () => {
    if (!confirm(`Remove ${patient.name} from the ward list? This cannot be undone.`)) return;
    await deletePatient(id);
    onPatientDeleted();
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;
  if (!patient) return null;

  const age = patient.dob
    ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 3600 * 1000))
    : '?';

  return (
    <div className="flex flex-col h-full">
      <Header title={`${patient.name} — Bed ${patient.bed}`} onPrint={handlePrint} />

      {/* Patient banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className={`font-semibold text-xs px-2 py-0.5 rounded ${codeColors[patient.code_status] || codeColors.Full}`}>
            {patient.code_status}
          </span>
          <span className="text-slate-500">MRN: <span className="text-slate-800 font-medium">{patient.mrn}</span></span>
          <span className="text-slate-500">DOB: <span className="text-slate-800">{patient.dob}</span> ({age} yrs)</span>
          {patient.diagnosis && <span className="text-slate-600">{patient.diagnosis}</span>}
          {patient.allergies && (
            <span className="text-red-600 font-medium">Allergies: {patient.allergies}</span>
          )}
          <button onClick={handleDelete} className="ml-auto text-xs text-red-400 hover:text-red-600">
            Discharge / Remove
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {tab === 'Vitals' && vitals.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{vitals.length}</span>
              )}
              {tab === 'Medications' && medications.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{medications.length}</span>
              )}
              {tab === 'Investigations' && investigations.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{investigations.length}</span>
              )}
              {tab === 'Notes & To-Dos' && notes.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{notes.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Vitals' && (
          <div>
            <VitalsForm patientId={id} onSaved={() => getVitals(id).then(setVitals)} />
            <VitalsChart patientId={id} vitals={vitals} onDeleted={() => getVitals(id).then(setVitals)} />
          </div>
        )}
        {activeTab === 'Medications' && (
          <div>
            <MedForm patientId={id} onSaved={() => getMedications(id).then(setMedications)} />
            <MedList patientId={id} medications={medications} onChanged={() => getMedications(id).then(setMedications)} />
          </div>
        )}
        {activeTab === 'Investigations' && (
          <div>
            <InvestigationForm patientId={id} onSaved={() => getInvestigations(id).then(setInvestigations)} />
            <InvestigationList patientId={id} investigations={investigations} onChanged={() => getInvestigations(id).then(setInvestigations)} />
          </div>
        )}
        {activeTab === 'Notes & To-Dos' && (
          <div>
            <NoteForm patientId={id} onSaved={() => getNotes(id).then(setNotes)} />
            <NoteList patientId={id} notes={notes} onChanged={() => getNotes(id).then(setNotes)} />
          </div>
        )}
      </main>
    </div>
  );
}
