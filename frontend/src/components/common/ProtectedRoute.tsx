import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: React.ReactNode;
  role: 'patient' | 'doctor' | 'admin';
}

export default function ProtectedRoute({ children, role }: Props) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
