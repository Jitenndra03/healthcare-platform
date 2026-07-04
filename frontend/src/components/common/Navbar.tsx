import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links: Record<string, { label: string; href: string }[]> = {
    patient: [
      { label: 'Find Doctors', href: '/patient/search' },
      { label: 'My Appointments', href: '/patient/appointments' },
    ],
    doctor: [
      { label: 'My Schedule', href: '/doctor/appointments' },
    ],
    admin: [
      { label: 'Manage Doctors', href: '/admin/doctors' },
    ],
  };

  const roleBadgeClasses = {
    patient: 'bg-blue-50 text-blue-700 ring-blue-100',
    doctor: 'bg-green-50 text-green-700 ring-green-100',
    admin: 'bg-purple-50 text-purple-700 ring-purple-100',
  } as const;

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="text-lg font-semibold text-blue-600">
          HealthCare
        </Link>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {user && links[user.role]?.map((l) => (
          <Link key={l.href} to={l.href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${isActive(l.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'}`}>
            {l.label}
          </Link>
        ))}
        {user && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${roleBadgeClasses[user.role]}`}>
              {user.role}
            </span>
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <button onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-red-700">
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
    </nav>
  );
}
