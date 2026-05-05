import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import PatientDetailPage from './pages/PatientDetailPage';
import WardNotesPage from './pages/WardNotesPage';
import { getPatients } from './api/client';

function AppShell() {
  const [patients, setPatients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  const loadPatients = () => {
    getPatients().then(setPatients).catch(console.error);
  };

  useEffect(() => { loadPatients(); }, []);

  const handlePatientAdded = (patient) => {
    loadPatients();
    setShowAddForm(false);
    navigate(`/patient/${patient.id}`);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar patients={patients} onAddPatient={() => setShowAddForm(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={
            <DashboardPage
              patients={patients}
              showAddForm={showAddForm}
              onCloseAdd={() => setShowAddForm(false)}
              onPatientAdded={handlePatientAdded}
              onPatientDeleted={loadPatients}
            />
          } />
          <Route path="/patient/:id" element={
            <PatientDetailPage onPatientDeleted={() => { loadPatients(); navigate('/'); }} />
          } />
          <Route path="/ward-notes" element={<WardNotesPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
