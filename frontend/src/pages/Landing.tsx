import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const specialisations = [
  { icon: '🫀', name: 'Cardiology' },
  { icon: '🧠', name: 'Neurology' },
  { icon: '🦴', name: 'Orthopedics' },
  { icon: '🧒', name: 'Pediatrics' },
  { icon: '🌿', name: 'Dermatology' },
  { icon: '👁️', name: 'Ophthalmology' },
];

const steps = [
  { step: '01', title: 'Find a Doctor', desc: 'Search by specialisation or name. View profiles and available slots.' },
  { step: '02', title: 'Describe Symptoms', desc: 'Fill a quick symptom form. Our AI generates a pre-visit summary for your doctor.' },
  { step: '03', title: 'Book & Confirm', desc: 'Confirm your slot. Get an email confirmation and Google Calendar invite instantly.' },
  { step: '04', title: 'Post-Visit Summary', desc: 'After your visit, receive an AI-generated patient-friendly summary with your prescription.' },
];

const features = [
  { icon: '🤖', title: 'AI Pre-visit Summary', desc: 'Groq-powered AI analyses your symptoms and gives your doctor urgency level, chief complaint, and suggested questions before you even walk in.' },
  { icon: '📅', title: 'Google Calendar Sync', desc: 'Appointments are automatically added to both patient and doctor calendars. Updates and cancellations sync in real time.' },
  { icon: '💊', title: 'Medication Reminders', desc: 'Based on your prescription, the system sends timely email reminders so you never miss a dose.' },
  { icon: '🔒', title: 'No Double Booking', desc: 'Our slot locking system prevents two patients from booking the same slot simultaneously — even under heavy traffic.' },
  { icon: '📧', title: 'Instant Notifications', desc: 'Email confirmations, cancellation alerts, and post-visit summaries delivered automatically with retry on failure.' },
  { icon: '👨‍⚕️', title: 'Three Portals', desc: 'Separate, role-based dashboards for patients, doctors, and admins — each tailored to their workflow.' },
];

const featureTopBorders = [
  'border-t-blue-500',
  'border-t-emerald-500',
  'border-t-amber-500',
  'border-t-sky-500',
  'border-t-rose-500',
  'border-t-violet-500',
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    if (!user) { navigate('/register'); return; }
    const paths: Record<string, string> = {
      patient: '/patient/search',
      doctor:  '/doctor/appointments',
      admin:   '/admin/doctors',
    };
    navigate(paths[user.role]);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-32 text-center">
          <span className="inline-block bg-blue-500/40 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            AI-Powered Healthcare
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Book Smarter.<br />
            <span className="text-blue-200">Heal Faster.</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-12 leading-relaxed">
            A modern clinic platform where AI summarises your symptoms before your visit,
            keeps your doctor informed, and sends you a clear post-visit plan — all automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="relative overflow-hidden bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 text-sm">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/70 to-transparent opacity-70 animate-pulse" />
              <span className="relative">{user ? 'Go to Dashboard →' : 'Get Started Free →'}</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5 text-sm">
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 pt-10 border-t border-white/20">
            {[
              { val: '5+', label: 'Specialisations' },
              { val: 'AI', label: 'Visit Summaries' },
              { val: '0',  label: 'Double Bookings' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.val}</div>
                <div className="text-blue-200 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALISATIONS ──────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            Browse by Specialisation
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {specialisations.map((s) => (
              <button
                key={s.name}
                onClick={() => user?.role === 'patient'
                  ? navigate(`/patient/search?specialisation=${s.name}`)
                  : navigate('/register')}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md group">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-xs font-medium text-gray-600 group-hover:text-blue-600">
                  {s.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">How it works</h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            From search to post-visit summary in four steps
          </p>
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="absolute left-8 right-8 top-7 hidden lg:block h-px bg-blue-100" />
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="relative z-10 mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 shadow-sm">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">
            Everything your clinic needs
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            Built for patients, doctors, and admins — all in one platform
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, index) => (
              <div key={f.title}
                className={`bg-white border border-gray-200 border-t-4 ${featureTopBorders[index]} rounded-xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">
            Three portals, one platform
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                role: 'Patient',
                color: 'blue',
                icon: '🧑‍💼',
                points: ['Search doctors by specialisation', 'Book slots with symptom form', 'View AI pre-visit summary', 'Receive post-visit plan + reminders'],
              },
              {
                role: 'Doctor',
                color: 'green',
                icon: '👨‍⚕️',
                points: ['View today\'s appointments', 'See AI symptom summary before visit', 'Submit post-visit notes', 'Prescription auto-triggers reminders'],
              },
              {
                role: 'Admin',
                color: 'purple',
                icon: '🛡️',
                points: ['Create & manage doctor profiles', 'Set working hours & slot duration', 'Mark leave — patients auto-notified', 'Full appointment oversight'],
              },
            ].map((p) => (
              <div key={p.role}
                className={`border-2 rounded-xl p-6 ${
                  p.color === 'blue'   ? 'border-blue-200   bg-blue-50'   :
                  p.color === 'green'  ? 'border-green-200  bg-green-50'  :
                                         'border-purple-200 bg-purple-50'
                }`}>
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className={`font-bold text-lg mb-4 ${
                  p.color === 'blue'   ? 'text-blue-700'   :
                  p.color === 'green'  ? 'text-green-700'  :
                                         'text-purple-700'
                }`}>{p.role} Portal</h3>
                <ul className="space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-0.5 text-gray-400">✓</span> {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8 text-sm">
            Register as a patient to book your first appointment in under 2 minutes.
          </p>
          <button
            onClick={handleGetStarted}
            className="relative overflow-hidden bg-white text-blue-700 font-semibold px-10 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/70 to-transparent opacity-70 animate-pulse" />
            <span className="relative">{user ? 'Go to Dashboard →' : 'Create Free Account →'}</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-xs">
        © 2025 HealthCare Platform · Built with Node.js, React, PostgreSQL & AI
      </footer>

    </div>
  );
}

