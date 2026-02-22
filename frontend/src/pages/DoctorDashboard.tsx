import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

interface StatCard {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  textColor: string;
}

const statCards: StatCard[] = [
  {
    key: 'todayAppointments',
    label: "Today's Appointments",
    icon: CalendarDaysIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-100',
    gradient: 'from-blue-50 to-white',
    textColor: 'text-blue-700',
  },
  {
    key: 'pendingAppointments',
    label: 'Pending Review',
    icon: ClockIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-100',
    gradient: 'from-amber-50 to-white',
    textColor: 'text-amber-700',
  },
  {
    key: 'inProgressAppointments',
    label: 'In Progress',
    icon: SparklesIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    border: 'border-indigo-100',
    gradient: 'from-indigo-50 to-white',
    textColor: 'text-indigo-700',
  },
  {
    key: 'completedAppointments',
    label: 'Completed Today',
    icon: CheckCircleIcon,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-100',
    gradient: 'from-emerald-50 to-white',
    textColor: 'text-emerald-700',
  },
  {
    key: 'totalPatients',
    label: 'Total Patients',
    icon: UserGroupIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-100',
    gradient: 'from-purple-50 to-white',
    textColor: 'text-purple-700',
  },
  {
    key: 'totalAppointments',
    label: 'All-time Appointments',
    icon: ChartBarIcon,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    border: 'border-rose-100',
    gradient: 'from-rose-50 to-white',
    textColor: 'text-rose-700',
  },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  'in-progress': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

function formatTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

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
  const appointments = (todayAppointments ?? []) as {
    id: number;
    appointmentTime?: string;
    status?: string;
    patientName?: string;
    window?: string;
  }[];

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ===== HERO HEADER ===== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 px-8 py-10 overflow-hidden shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mb-1">{todayStr}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow">
              Good day, Dr. {user?.lastName} 👋
            </h1>
            <p className="mt-2 text-indigo-100 text-base font-medium leading-relaxed max-w-lg">
              Here's an overview of your practice today. Stay on top of appointments and patient care.
            </p>
          </div>

          {/* Rating badge */}
          <div className="shrink-0">
            <div className="inline-flex flex-col items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl px-6 py-4 shadow-lg">
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-6 h-6 text-amber-300" />
                <span className="text-3xl font-extrabold text-white">
                  {summary.totalRatings > 0 ? summary.averageRating.toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                {summary.totalRatings > 0 ? `${summary.totalRatings} Reviews` : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PENDING ALERT ===== */}
      {pendingCount > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-amber-100 rounded-xl shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-800">
              {pendingCount} appointment request{pendingCount > 1 ? 's' : ''} awaiting your approval
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Review and accept or decline to keep your schedule up to date.
            </p>
          </div>
          <Link
            to="/app/doctor-appointments"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 transition-colors shadow-sm"
          >
            Review <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ===== STAT CARDS ===== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, color, bg, border, gradient, textColor }) => (
          <div
            key={key}
            className={`relative rounded-2xl bg-gradient-to-br ${gradient} border ${border} p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
          >
            {/* Subtle decorative circle */}
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${bg} opacity-60 group-hover:opacity-80 transition-opacity`} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
                <p className={`text-4xl font-extrabold ${textColor} tabular-nums`}>
                  {stats[key as keyof typeof stats] ?? 0}
                </p>
              </div>
              <div className={`p-3 ${bg} rounded-2xl shadow-inner`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== TODAY'S SCHEDULE ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner">
              <CalendarDaysIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Today's Schedule</h3>
              <p className="text-xs text-slate-500 font-medium">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled</p>
            </div>
          </div>
          <Link
            to="/app/doctor-appointments"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            View all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <CalendarDaysIcon className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-700 font-semibold">No appointments today</p>
            <p className="text-sm text-slate-400">Enjoy the free time or update your availability.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt, idx) => (
              <div
                key={apt.id}
                className={`px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors ${idx % 2 === 0 ? '' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {apt.patientName ?? `Appointment #${apt.id}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {formatTime(apt.appointmentTime)}
                      {apt.window && <span className="ml-1 capitalize">· {apt.window}</span>}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_STYLES[apt.status ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>
                  {apt.status ?? 'unknown'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/app/doctor-appointments"
          className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 px-5 py-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <CalendarDaysIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Manage Appointments</p>
            <p className="text-indigo-200 text-xs">Accept, reschedule, complete</p>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/app/patients"
          className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <UserGroupIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">My Patients</p>
            <p className="text-slate-500 text-xs">View patient records</p>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/app/doctor-profile"
          className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="p-2.5 bg-emerald-100 rounded-xl">
            <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">Update Profile</p>
            <p className="text-slate-500 text-xs">Credentials, schedule, bio</p>
          </div>
          <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
