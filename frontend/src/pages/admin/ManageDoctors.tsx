import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import Spinner from '../../components/common/Spinner';

export default function ManageDoctors() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [leaveModal, setLeaveModal] = useState<string | null>(null);
  const [leaveDate, setLeaveDate]   = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [createAttempted, setCreateAttempted] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', specialisation: '',
    slot_duration: 30, work_start: '09:00', work_end: '17:00', bio: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn:  () => adminApi.getDoctors().then((r) => r.data.data),
  });

  const createDoctor = useMutation({
    mutationFn: () => adminApi.createDoctor(form),
    onSuccess:  () => {
      toast.success('Doctor created');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const markLeave = useMutation({
    mutationFn: () => adminApi.markLeave(leaveModal!, { leave_date: leaveDate, reason: leaveReason }),
    onSuccess:  () => {
      toast.success('Leave marked. Affected patients notified.');
      setLeaveModal(null); setLeaveDate(''); setLeaveReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const isRequiredTextInvalid = (value: string) => createAttempted && !value.trim();

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Manage Doctors</h1>
            <p className="text-sm text-gray-500">Create profiles, adjust schedules, and manage leave.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Total doctors: {data?.length ?? 0}
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => setShowCreate(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:scale-[1.01]">
            + Add Doctor
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {data?.map((doc: any) => (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm transition-shadow hover:shadow-md">
            <div>
              <h2 className="font-semibold text-gray-800">Dr. {doc.name}</h2>
              <p className="text-sm text-blue-600">{doc.specialisation}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-gray-500">
                <span className="rounded-full bg-gray-100 px-2.5 py-1">{doc.email}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">{doc.slot_duration} min slots</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1">{doc.work_start} - {doc.work_end}</span>
              </div>
            </div>
            <button onClick={() => setLeaveModal(doc.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100">
              <span>📅</span>
              Mark Leave
            </button>
          </div>
        ))}
      </div>

      {/* Create Doctor Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-md">
            <h2 className="font-semibold text-lg mb-2 text-gray-800">Add New Doctor</h2>
            <p className="text-sm text-gray-500 mb-5">Group the doctor profile into the core identity and scheduling details.</p>
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Basic Info</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Full Name',       key: 'name',           type: 'text' },
                    { label: 'Email',           key: 'email',          type: 'email' },
                    { label: 'Phone',           key: 'phone',          type: 'tel' },
                    { label: 'Specialisation',  key: 'specialisation', type: 'text' },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input type={type} value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isRequiredTextInvalid((form as any)[key]) ? 'border border-red-400 bg-red-50' : 'border border-gray-300'}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Schedule</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slot (min)</label>
                    <input type="number" value={form.slot_duration}
                      onChange={(e) => setForm({ ...form, slot_duration: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Start</label>
                    <input type="time" value={form.work_start}
                      onChange={(e) => setForm({ ...form, work_start: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work End</label>
                    <input type="time" value={form.work_end}
                      onChange={(e) => setForm({ ...form, work_end: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
                <textarea value={form.bio} rows={2}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => { setCreateAttempted(true); createDoctor.mutate(); }}
                disabled={createDoctor.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-700 hover:scale-[1.01] disabled:opacity-50">
                {createDoctor.isPending ? 'Creating...' : 'Create Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Leave Modal */}
      {leaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-md">
            <h2 className="font-semibold text-lg mb-4">Mark Doctor Leave</h2>
            <p className="text-sm text-gray-500 mb-4">
              All confirmed appointments on this date will be cancelled and patients notified automatically.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Date</label>
                <input type="date" value={leaveDate} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input type="text" value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Medical conference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setLeaveModal(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => markLeave.mutate()}
                disabled={markLeave.isPending || !leaveDate}
                className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-amber-600 hover:scale-[1.01] disabled:opacity-50">
                {markLeave.isPending ? 'Saving...' : 'Mark Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
