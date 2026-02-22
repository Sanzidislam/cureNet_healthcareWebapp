import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, useAuth } from '../context/AuthContext';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';
import DoctorCard from '../components/DoctorCard';

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
            const { data: r } = await api.get<{
              success: boolean;
              data: { summary: { averageRating: number; totalRatings: number } };
            }>(`/ratings/doctor/${d.id}`);
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
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {doctors.map((doc) => {
            const rating = ratingsMap?.[doc.id] ?? { averageRating: 0, totalRatings: 0 };
            const name = doc.user
              ? `Dr. ${doc.user.firstName} ${doc.user.lastName}`
              : 'Doctor';
            const imgSrc = doc.profileImage
              ? doc.profileImage.startsWith('http')
                ? doc.profileImage
                : `${API_BASE}${doc.profileImage}`
              : null;
            return (
              <DoctorCard
                key={doc.id}
                id={doc.id}
                name={name}
                department={doc.department}
                imgSrc={imgSrc}
                averageRating={rating.averageRating}
                totalRatings={rating.totalRatings}
                consultationFee={doc.consultationFee}
                isPatient={isPatient}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
