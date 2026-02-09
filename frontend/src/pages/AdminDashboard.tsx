import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UserGroupIcon,
  UserCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { api } from '../context/AuthContext';

const statCards = [
  { key: 'totalUsers', label: 'Total users', icon: UserGroupIcon },
  { key: 'totalDoctors', label: 'Doctors', icon: UserCircleIcon },
  { key: 'totalPatients', label: 'Patients', icon: UserCircleIcon },
  { key: 'totalAppointments', label: 'Appointments', icon: CalendarDaysIcon },
];

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { stats: Record<string, number> } }>(
        '/admin/stats'
      );
      return data.data?.stats ?? {};
    },
  });

  const { data: verificationsData } = useQuery({
    queryKey: ['admin', 'doctor-verifications'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { doctors: unknown[] } }>(
        '/admin/doctor-verifications'
      );
      return data.data?.doctors ?? [];
    },
  });

  const stats = statsData ?? {};
  const doctors = (verificationsData ?? []) as { id: number; user?: { firstName: string; lastName: string }; department?: string }[];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin dashboard</h2>
        <p className="text-gray-600">System overview and analytics.</p>
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
          <h3 className="font-semibold text-gray-900">Doctors</h3>
          <Link to="/app/admin-doctors" className="text-sm text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-200 max-h-64 overflow-auto">
          {doctors.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500">No doctors yet.</p>
          ) : (
            doctors.slice(0, 5).map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-gray-700">
                  {d.user?.firstName} {d.user?.lastName}
                </span>
                <span className="text-sm text-gray-500">{d.department ?? '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/users"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Users
        </Link>
        <Link
          to="/app/admin-doctors"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Doctors
        </Link>
        <Link
          to="/app/admin-patients"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Patients
        </Link>
      </div>
    </div>
  );
}
