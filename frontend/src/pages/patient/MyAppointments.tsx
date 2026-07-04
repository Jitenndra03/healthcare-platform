import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { appointmentsApi } from '../../api/appointments';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import Spinner from '../../components/common/Spinner';

const STATUS_COLOURS: Record<string, string> = {
  confirmed:   'bg-blue-100 text-blue-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
  rescheduled: 'bg-yellow-100 text-yellow-800',
};

export default function MyAppointments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn:  () => appointmentsApi.myAppointments().then((r) => r.data.data),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess:  () => { toast.success('Appointment cancelled'); qc.invalidateQueries({ queryKey: ['my-appointments'] }); },
    onError:    (err: any) => toast.error(err.response?.data?.message || 'Cancel failed'),
  });

  if (isLoading) return <Spinner size="lg" />;

  const filteredAppointments = (data || []).filter((appt: any) => statusFilter === 'all' || appt.status === statusFilter);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">My Appointments</h1>
          <p className="text-sm text-gray-500">Track confirmed visits, cancellations, and completed care.</p>
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {[
            { key: 'all', label: 'All' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${statusFilter === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filteredAppointments?.map((appt: any) => (
          <div key={appt.id} className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition-shadow ${appt.status === 'confirmed' ? 'border-l-4 border-l-blue-500' : appt.status === 'completed' ? 'border-l-4 border-l-green-500' : appt.status === 'cancelled' ? 'border-l-4 border-l-red-400' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold">Dr. {appt.doctor_name}</h2>
                <p className="text-xs font-medium text-blue-600">{appt.doctor_specialisation || appt.specialisation || 'General Practice'}</p>
                <p className="text-sm text-gray-500">
                  {new Date(appt.start_time).toLocaleString()}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOURS[appt.status]}`}>
                {appt.status}
              </span>
            </div>

            {/* Pre-visit AI summary */}
            {appt.pre_visit_summary && (
              <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">🧠</span>
                  <span className="text-sm font-semibold text-blue-800">AI Pre-visit Summary</span>
                  <UrgencyBadge urgency={appt.pre_visit_summary.urgency} />
                  {!appt.pre_visit_summary.generated && (
                    <span className="text-xs text-gray-400">(fallback)</span>
                  )}
                </div>
                <p className="text-sm text-blue-800">{appt.pre_visit_summary.chief_complaint}</p>
              </div>
            )}

            {/* Post-visit summary */}
            {appt.post_visit_summary && (
              <div className="bg-green-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-green-700 mb-1">Post-visit Summary</p>
                <p className="text-sm text-green-900 whitespace-pre-line">{appt.post_visit_summary}</p>
              </div>
            )}

            {appt.status === 'confirmed' && (
              <button onClick={() => cancel.mutate(appt.id)}
                className="text-sm text-red-500 hover:text-red-700 mt-1">
                Cancel appointment
              </button>
            )}
          </div>
        ))}
        {filteredAppointments.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center shadow-sm">
            <div className="text-4xl mb-3">{statusFilter === 'all' ? '📭' : '🗂️'}</div>
            <h2 className="text-lg font-semibold text-gray-800">
              {statusFilter === 'all' ? 'No appointments yet' : 'No appointments in this status'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter === 'all'
                ? 'Appointments will appear here once they are booked.'
                : 'Try a different filter to view your other visits.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
