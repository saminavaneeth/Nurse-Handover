import { useNavigate } from 'react-router-dom';

const codeColors = {
  Full: 'bg-green-100 text-green-800',
  DNR: 'bg-red-100 text-red-800',
  DNI: 'bg-red-100 text-red-800',
  Comfort: 'bg-orange-100 text-orange-800',
};

export default function PatientCard({ patient }) {
  const navigate = useNavigate();
  const age = patient.dob
    ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 3600 * 1000))
    : '?';

  return (
    <div
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="bg-white rounded-lg border border-slate-200 p-4 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded mr-2">Bed {patient.bed}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${codeColors[patient.code_status] || codeColors.Full}`}>
            {patient.code_status}
          </span>
        </div>
        <span className="text-xs text-slate-400">MRN: {patient.mrn}</span>
      </div>
      <h3 className="font-semibold text-slate-800 text-base">{patient.name}</h3>
      <p className="text-sm text-slate-500">{age} yrs &bull; DOB: {patient.dob}</p>
      {patient.diagnosis && (
        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{patient.diagnosis}</p>
      )}
      {patient.allergies && (
        <p className="text-xs text-red-600 mt-1">Allergies: {patient.allergies}</p>
      )}
    </div>
  );
}
