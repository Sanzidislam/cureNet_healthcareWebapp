import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Layout from './components/Layout';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDoctors from './pages/AdminDoctors';
import AdminPatients from './pages/AdminPatients';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminLogs from './pages/AdminLogs';
import PatientProfile from './pages/PatientProfile';
import DoctorProfile from './pages/DoctorProfile';
import Appointments from './pages/Appointments';
import DoctorAppointments from './pages/DoctorAppointments';
import Doctors from './pages/Doctors';
import AppPlaceholder from './pages/AppPlaceholder';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <main className="min-h-screen flex flex-col">
            <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="admin-dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>} />
              <Route path="doctor-profile" element={<ProtectedRoute requiredRole="doctor"><DoctorProfile /></ProtectedRoute>} />
              <Route path="appointments" element={<ProtectedRoute requiredRole="patient"><Appointments /></ProtectedRoute>} />
              <Route path="doctor-appointments" element={<ProtectedRoute requiredRole="doctor"><DoctorAppointments /></ProtectedRoute>} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="patients" element={<AppPlaceholder />} />
              <Route path="users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="admin-doctors" element={<ProtectedRoute requiredRole="admin"><AdminDoctors /></ProtectedRoute>} />
              <Route path="admin-patients" element={<ProtectedRoute requiredRole="admin"><AdminPatients /></ProtectedRoute>} />
              <Route path="admin-analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
              <Route path="admin-logs" element={<ProtectedRoute requiredRole="admin"><AdminLogs /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
            </div>
          <Footer />
          </main>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
