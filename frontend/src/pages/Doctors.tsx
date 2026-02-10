import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { api, useAuth } from '../context/AuthContext';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

interface DoctorListItem {
  id: number;
  department?: string;
  consultationFee?: number;
  profileImage?: string;
  user?: { firstName: string; lastName: string; email?: string };
}

export default function Doctors() {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const [department, setDepartment] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', department],
    queryFn: async () => {
      const params = department ? { department } : {};
      const { data: res } = await api.get<{ success: boolean; data: { doctors: DoctorListItem[] } }>('/doctors', {
        params,
      });
      return res.data?.doctors ?? [];
    },
  });

  const { data: ratingsMap } = useQuery({
    queryKey: ['ratings', data?.map((d) => d.id) ?? []],
    queryFn: async () => {
      if (!data?.length) return {};
      const out: Record<number, { averageRating: number; totalRatings: number }> = {};
      await Promise.all(
        data.map(async (d) => {
          try {
            const { data: r } = await api.get<{ success: boolean; data: { summary: { averageRating: number; totalRatings: number } } }>(
              `/ratings/doctor/${d.id}`
            );
            out[d.id] = r.data?.summary ?? { averageRating: 0, totalRatings: 0 };
          } catch {
            out[d.id] = { averageRating: 0, totalRatings: 0 };
          }
        })
      );
      return out;
    },
    enabled: !!data?.length,
  });

  const doctors = data ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Find Doctors</h2>
          {!isPatient && (
            <p className="text-gray-600 mt-1 text-sm">Sign in to book an appointment.</p>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#3990D7] focus:border-[#3990D7]"
          >
            <option value="">All departments</option>
            {MEDICAL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200 text-center text-gray-500">
          No doctors found.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => {
            const rating = ratingsMap?.[doc.id] ?? { averageRating: 0, totalRatings: 0 };
            const name = doc.user ? `Dr. ${doc.user.firstName} ${doc.user.lastName}` : 'Doctor';
            const imgSrc = doc.profileImage
              ? (doc.profileImage.startsWith('http') ? doc.profileImage : `${API_BASE}${doc.profileImage}`)
              : null;
            return (
              <Link
                key={doc.id}
                to={`/doctors/${doc.id}`}
                className="rounded-3xl bg-white border-2 border-sky-200 overflow-hidden flex flex-col hover:border-[#3990D7]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3990D7] focus:ring-offset-2"
              >
                <div className="relative h-56 sm:h-60 bg-sky-50/80 flex items-center justify-center overflow-hidden rounded-t-[22px]">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <UserCircleIcon className="w-20 h-20 text-sky-300" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    Available
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 truncate">{name}</h3>
                  <p className="text-base text-gray-500 mt-0.5">
                    {doc.department || 'General physician'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 min-h-[20px]">
                    {rating.totalRatings > 0
                      ? `★ ${rating.averageRating.toFixed(1)} (${rating.totalRatings})`
                      : 'No ratings yet'}
                  </p>
                  <div className="mt-auto pt-4" onClick={(e) => e.preventDefault()}>
                    {isPatient ? (
                      <Link
                        to={`/app/appointments?book=${doc.id}`}
                        className="block w-full text-center rounded-full bg-[#3990D7] py-3 px-4 text-sm font-medium text-white hover:bg-[#2d7ab8] transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Book Now
                      </Link>
                    ) : (
                      <Link
                        to="/login?redirect=/doctors"
                        className="block w-full text-center rounded-full border-2 border-[#3990D7] py-3 px-4 text-sm font-medium text-[#3990D7] hover:bg-[#EAEFFF] transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sign in to book
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
