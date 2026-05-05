import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import PatientCard from '../components/patients/PatientCard';
import PatientForm from '../components/patients/PatientForm';
import HandoverSheet from '../components/print/HandoverSheet';
import { getVitals, getMedications, getInvestigations, getNotes } from '../api/client';

export default function DashboardPage({ patients, showAddForm, onCloseAdd, onPatientAdded }) {
  const [allPatientData, setAllPatientData] = useState([]);

  useEffect(() => {
    if (patients.length === 0) { setAllPatientData([]); return; }
    Promise.all(
      patients.map(async (p) => {
        const [vitals, medications, investigations, notes] = await Promise.all([
          getVitals(p.id),
          getMedications(p.id),
          getInvestigations(p.id),
          getNotes(p.id),
        ]);
        return { patient: p, vitals, medications, investigations, notes };
      })
    ).then(setAllPatientData);
  }, [patients]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Ward Dashboard" onPrint={() => window.print()} />
      <main className="flex-1 overflow-y-auto p-6">
        {patients.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-slate-500 text-lg">No patients added yet.</p>
            <p className="text-slate-400 text-sm mt-1">Click &quot;+ Add Patient&quot; in the sidebar to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        )}
      </main>
      {showAddForm && (
        <PatientForm onSaved={onPatientAdded} onCancel={onCloseAdd} />
      )}
      <HandoverSheet allPatientData={allPatientData} />
    </div>
  );
}
