import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

import Landing  from './pages/Landing';
// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient
import SearchDoctors   from './pages/patient/SearchDoctors';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments  from './pages/patient/MyAppointments';

// Doctor
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Admin
import ManageDoctors from './pages/admin/ManageDoctors';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/calendar-connected" element={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-green-600">Google Calendar Connected!</h1>
              <p className="text-gray-500 mt-2">You can close this window.</p>
            </div>
          </div>
        } />

        {/* Patient */}
        <Route path="/patient/search" element={
          <ProtectedRoute role="patient"><SearchDoctors /></ProtectedRoute>
        } />
        <Route path="/patient/book/:doctorId" element={
          <ProtectedRoute role="patient"><BookAppointment /></ProtectedRoute>
        } />
        <Route path="/patient/appointments" element={
          <ProtectedRoute role="patient"><MyAppointments /></ProtectedRoute>
        } />

        {/* Doctor */}
        <Route path="/doctor/appointments" element={
          <ProtectedRoute role="doctor"><DoctorAppointments /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/doctors" element={
          <ProtectedRoute role="admin"><ManageDoctors /></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}     