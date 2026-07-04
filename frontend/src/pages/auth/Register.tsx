import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'patient', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register(form);
      const loginRes = await authApi.login({ email: form.email, password: form.password });
      const { token, user } = loginRes.data.data;
      setAuth(token, user);
      toast.success('Account created!');
      navigate(user.role === 'patient' ? '/patient/search' : '/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:20px_20px] px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 border-l-4 border-l-blue-600 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">✚</div>
          <h1 className="text-2xl font-semibold text-gray-800">Create account</h1>
          <p className="mt-2 text-sm text-gray-500">Join the platform and book your first appointment.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text' },
            { label: 'Email',     key: 'email', type: 'email' },
            { label: 'Password',  key: 'password', type: 'password' },
            { label: 'Phone',     key: 'phone', type: 'tel' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key !== 'phone'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
