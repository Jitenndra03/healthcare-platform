import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { doctorsApi } from '../../api/doctors';
import { appointmentsApi } from '../../api/appointments';
import Spinner from '../../components/common/Spinner';

type Step = 'pick-slot' | 'symptoms' | 'confirm';

export default function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();

  const [step, setStep]           = useState<Step>('pick-slot');
  const [date, setDate]           = useState('');
  const [selectedSlot, setSlot]   = useState<any>(null);
  const [symptoms, setSymptoms]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(600);

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn:  () => doctorsApi.getProfile(doctorId!).then((r) => r.data.data),
    enabled:  !!doctorId,
  });

  const { data: slots, isLoading: slotsLoading, refetch } = useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn:  () => doctorsApi.getSlots(doctorId!, date).then((r) => r.data.data),
    enabled:  !!date,
  });

  const handleHoldSlot = async (slot: any) => {
    try {
      await appointmentsApi.holdSlot(slot.id);
      setSlot(slot);
      setHoldSeconds(600);
      setStep('symptoms');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Slot no longer available');
      refetch();
    }
  };

  useEffect(() => {
    if (!selectedSlot) return;

    const timer = window.setInterval(() => {
      setHoldSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [selectedSlot]);

  const formatHoldTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  const steps = [
    { label: 'Pick slot', value: 'pick-slot' },
    { label: 'Symptoms', value: 'symptoms' },
    { label: 'Confirm', value: 'confirm' },
  ];

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    try {
      await appointmentsApi.book({ slot_id: selectedSlot.id, symptoms });
      toast.success('Appointment booked! Check your email for confirmation.');
      navigate('/patient/appointments');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed');
      setStep('pick-slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {steps.map((item, index) => {
            const completed = steps.findIndex((stepItem) => stepItem.value === step) > index;
            const active = step === item.value;

            return (
              <div key={item.value} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center text-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${completed || active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {completed ? '✓' : index + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${active ? 'text-blue-700' : 'text-gray-500'}`}>{item.label}</span>
                </div>
                {index < steps.length - 1 && <div className={`mx-3 hidden h-px flex-1 sm:block ${completed || active ? 'bg-blue-200' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {doctor && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
          <h1 className="text-xl font-semibold">Book with Dr. {doctor.name}</h1>
          <p className="text-sm text-blue-600">{doctor.specialisation}</p>
        </div>
      )}

      {/* Step 1: Pick slot */}
      {step === 'pick-slot' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-800">Select a date</h2>
          <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />

          {slotsLoading && <Spinner />}

          {slots && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {slots.map((slot: any) => (
                <button key={slot.id} onClick={() => handleHoldSlot(slot)}
                  className={`border rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${selectedSlot?.id === slot.id ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm'}`}>
                  <div className="text-base font-semibold">
                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Available slot</div>
                </button>
              ))}
              {slots.length === 0 && date && (
                <p className="col-span-2 sm:col-span-3 text-sm text-gray-500">No available slots for this date.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 'symptoms' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-1 text-gray-800">Describe your symptoms</h2>
          <p className="text-sm text-gray-500 mb-4">
            Our AI will generate a pre-visit summary for your doctor. You have 10 minutes.
          </p>
          <p className="mb-3 text-sm font-medium text-blue-700">Slot held for {formatHoldTime(holdSeconds)}</p>
          <div className="relative">
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              rows={5} placeholder="E.g. Persistent headache for 3 days, mild fever, fatigue..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 resize-none" />
            <div className="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-400">
              {symptoms.length} characters
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep('pick-slot')}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
              Back
            </button>
            <button onClick={() => setStep('confirm')}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedSlot && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">✓</div>
            <div>
              <h2 className="font-semibold text-gray-800">Confirm appointment</h2>
              <p className="text-sm text-gray-500">Review the details before booking.</p>
            </div>
          </div>
          <div className="space-y-3 text-sm mb-6 rounded-xl bg-gray-50 p-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Doctor</span>
              <span className="font-medium">Dr. {doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium">
                {new Date(selectedSlot.start_time).toLocaleString()}
              </span>
            </div>
            {symptoms && (
              <div>
                <span className="text-gray-500">Symptoms</span>
                <p className="text-gray-800 mt-1 text-xs bg-white rounded-lg p-3 border border-gray-200">{symptoms}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">
            You'll receive a confirmation email and a Google Calendar invite.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStep('symptoms')}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
              Back
            </button>
            <button onClick={handleBook} disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
