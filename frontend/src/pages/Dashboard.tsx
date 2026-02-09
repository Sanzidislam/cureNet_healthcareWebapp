import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

const statCards = [
  { key: 'totalAppointments', label: 'Total Appointments', icon: CalendarDaysIcon },
  { key: 'todayAppointments', label: "Today's", icon: ClockIcon },
  { key: 'completedAppointments', label: 'Completed', icon: CheckCircleIcon },
  { key: 'pendingAppointments', label: 'Pending', icon: ClockIcon },
];

export default function Dashboard() {
  const { user } = useAuth();
  const patientId = user?.patientId;

  const { data: statsData } = useQuery({
    queryKey: ['patients', patientId, 'dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Record<string, number> }>(
        `/patients/${patientId}/dashboard/stats`
      );
      return data.data;
    },
    enabled: !!patientId,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['patients', patientId, 'appointments'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { appointments: unknown[] } }>(
        `/patients/${patientId}/appointments?limit=5&sortBy=appointmentDate&sortOrder=DESC`
      );
      return data.data?.appointments ?? [];
    },
    enabled: !!patientId,
  });

  const stats = statsData ?? {};
  const appointments = appointmentsData ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-600">Here’s your health overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
          <Link to="/app/appointments" className="text-sm text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500">No appointments yet.</p>
          ) : (
            (appointments as { id: number; appointmentDate?: string; status?: string }[]).map((apt) => (
              <div key={apt.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-gray-700">{apt.appointmentDate}</span>
                <span className="text-sm text-gray-500 capitalize">{apt.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/appointments"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Book appointment
        </Link>
        <Link
          to="/app/doctors"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Find doctors
        </Link>
        <Link
          to="/app/profile"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          My profile
        </Link>
      </div>
    </div>
  );
}
