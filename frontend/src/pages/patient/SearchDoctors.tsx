import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { doctorsApi } from '../../api/doctors';

const accentBySpecialisation = (specialisation?: string) => {
  const value = (specialisation || '').toLowerCase();
  if (value.includes('card')) return { border: 'border-l-blue-500', pill: 'bg-blue-50 text-blue-700' };
  if (value.includes('neuro')) return { border: 'border-l-violet-500', pill: 'bg-violet-50 text-violet-700' };
  if (value.includes('ortho')) return { border: 'border-l-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
  if (value.includes('pedia')) return { border: 'border-l-sky-500', pill: 'bg-sky-50 text-sky-700' };
  if (value.includes('derma')) return { border: 'border-l-rose-500', pill: 'bg-rose-50 text-rose-700' };
  return { border: 'border-l-amber-500', pill: 'bg-amber-50 text-amber-700' };
};

export default function SearchDoctors() {
  const [search, setSearch] = useState({ specialisation: '', name: '' });
  const [params, setParams]  = useState({});
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', params],
    queryFn:  () => doctorsApi.search(params).then((r) => r.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Find a Doctor</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔎</span>
          <input placeholder="Specialisation (e.g. Cardiology)" value={search.specialisation}
            onChange={(e) => setSearch({ ...search, specialisation: e.target.value })}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
        </div>
        <input placeholder="Doctor name" value={search.name}
          onChange={(e) => setSearch({ ...search, name: e.target.value })}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
        <button onClick={() => setParams(search)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:scale-[1.01]">
          Search
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-gray-200 border-l-4 border-l-gray-200 rounded-xl p-5 shadow-sm animate-pulse flex items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-44 rounded bg-gray-200" />
                <div className="h-3 w-28 rounded bg-gray-200" />
                <div className="h-3 w-full max-w-xl rounded bg-gray-100" />
                <div className="h-3 w-36 rounded bg-gray-100" />
              </div>
              <div className="h-9 w-20 rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {data?.map((doctor: any) => {
          const accent = accentBySpecialisation(doctor.specialisation);
          return (
          <div key={doctor.id}
            className={`bg-white border border-gray-200 ${accent.border} rounded-xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
            <div>
              <h2 className="font-semibold text-gray-900">Dr. {doctor.name}</h2>
              <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accent.pill}`}>
                {doctor.specialisation}
              </p>
              {doctor.bio && <p className="text-sm text-gray-500 mt-1">{doctor.bio}</p>}
              <p className="text-xs text-gray-400 mt-1">Slot duration: {doctor.slot_duration} min</p>
            </div>
            <button
              onClick={() => navigate(`/patient/book/${doctor.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:scale-[1.01]">
              Book
            </button>
          </div>
          );
        })}
        {!isLoading && data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center shadow-sm">
            <div className="text-4xl mb-3">🩺</div>
            <h2 className="text-lg font-semibold text-gray-800">No results found</h2>
            <p className="mt-2 text-sm text-gray-500">Try a different specialisation or doctor name to see available profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
}
