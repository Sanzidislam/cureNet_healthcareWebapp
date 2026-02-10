import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';

interface DoctorRow {
  id: number;
  userId: number;
  bmdcRegistrationNumber?: string;
  department?: string;
  experience?: number;
  verified: boolean;
  user?: { id: number; firstName: string; lastName: string; email: string };
}

export default function AdminDoctors() {
  const [searchParams] = useSearchParams();
  const pendingOnly = searchParams.get('pending') === 'true';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(pendingOnly ? 'false' : '');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'doctor-verifications', search, departmentFilter, verifiedFilter],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      if (verifiedFilter) params.verified = verifiedFilter;
      const { data: res } = await api.get<{
        success: boolean;
        data: { doctors: DoctorRow[]; total: number };
      }>('/admin/doctor-verifications', { params });
      return res.data;
    },
  });

  const verifyDoctor = useMutation({
    mutationFn: (id: number) => api.put(`/admin/doctors/${id}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctor-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Doctor verified');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || 'Failed to verify');
    },
  });

  const unverifyDoctor = useMutation({
    mutationFn: (id: number) => api.put(`/admin/doctors/${id}/unverify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctor-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Doctor unverified');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || 'Failed to unverify');
    },
  });

  const doctors = data?.doctors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Doctor management</h2>
        <Link
          to="/app/admin-dashboard"
          className="text-sm text-[#3990D7] hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-56 focus:ring-2 focus:ring-[#3990D7]"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All departments</option>
          {MEDICAL_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-gray-500">Loading...</p>
        ) : doctors.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No doctors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        Dr. {d.user?.firstName} {d.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{d.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">DR-{d.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.department ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.bmdcRegistrationNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.experience ?? '—'} yrs</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.verified ? (
                          <button
                            type="button"
                            onClick={() => unverifyDoctor.mutate(d.id)}
                            disabled={unverifyDoctor.isPending}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            title="Unverify"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyDoctor.mutate(d.id)}
                            disabled={verifyDoctor.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Verify"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
