import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

const statCards = [
  { key: 'todayAppointments', label: "Today's", icon: CalendarDaysIcon },
  { key: 'pendingAppointments', label: 'Pending', icon: ClockIcon },
  { key: 'inProgressAppointments', label: 'In progress', icon: ClockIcon },
  { key: 'completedAppointments', label: 'Completed today', icon: CheckCircleIcon },
  { key: 'totalPatients', label: 'Total patients', icon: UserGroupIcon },
  { key: 'totalAppointments', label: 'Total appointments', icon: CalendarDaysIcon },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctorId = user?.doctorId;

  const { data: statsData } = useQuery({
    queryKey: ['doctors', doctorId, 'dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { stats: Record<string, number> } }>(
        `/doctors/${doctorId}/dashboard/stats`
      );
      return data.data?.stats ?? {};
    },
    enabled: !!doctorId,
  });

  const { data: ratingsData } = useQuery({
    queryKey: ['ratings', doctorId],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { summary: { averageRating: number; totalRatings: number } };
      }>(`/ratings/doctor/${doctorId}`);
      return data.data?.summary ?? { averageRating: 0, totalRatings: 0 };
    },
    enabled: !!doctorId,
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ['doctors', doctorId, 'appointments', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await api.get<{ success: boolean; data: { appointments: unknown[] } }>(
        `/doctors/${doctorId}/appointments?date=${today}`
      );
      return data.data?.appointments ?? [];
    },
    enabled: !!doctorId,
  });

  const stats = statsData ?? {};
  const summary = ratingsData ?? { averageRating: 0, totalRatings: 0 };
  const pendingCount = stats.requestedAppointments ?? 0;
  const appointments = todayAppointments ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, Dr. {user?.lastName}
          </h2>
          <p className="text-gray-600">
            {summary.totalRatings > 0
              ? `Rating: ${summary.averageRating.toFixed(1)} (${summary.totalRatings} reviews)`
              : 'No ratings yet'}
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Pending requests</p>
            <p className="text-sm text-amber-700">
              You have {pendingCount} appointment request(s) waiting for approval.
            </p>
            <Link to="/app/doctor-appointments" className="text-sm font-medium text-amber-700 hover:text-amber-800 underline mt-1 inline-block">
              Manage appointments
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="rounded-lg bg-white p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-semibold text-gray-900">
                  {stats[key as keyof typeof stats] ?? 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Today’s schedule</h3>
          <Link to="/app/doctor-appointments" className="text-sm text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500">No appointments today.</p>
          ) : (
            (appointments as { id: number; appointmentTime?: string; status?: string }[]).map((apt) => (
              <div key={apt.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-gray-700">{apt.appointmentTime}</span>
                <span className="text-sm text-gray-500 capitalize">{apt.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/doctor-appointments"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Manage appointments
        </Link>
        <Link
          to="/app/patients"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          My patients
        </Link>
        <Link
          to="/app/doctor-profile"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Update profile
        </Link>
      </div>
    </div>
  );
}
