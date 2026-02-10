import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '../context/AuthContext';

interface PatientRow {
  id: number;
  patientId: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export default function AdminPatients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'patients', search, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const { data: res } = await api.get<{
        success: boolean;
        data: { patients: PatientRow[]; total: number; page: number; limit: number };
      }>('/admin/patients', { params });
      return res.data;
    },
  });

  const patients = data?.patients ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Patient overview</h2>
        <Link to="/app/admin-dashboard" className="text-sm text-[#3990D7] hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="relative max-w-xs">
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-full focus:ring-2 focus:ring-[#3990D7]"
        />
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-gray-500">Loading...</p>
        ) : patients.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No patients found.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold shrink-0">
                      {(p.firstName?.[0] || '') + (p.lastName?.[0] || '')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-sm text-gray-500">PT-{p.patientId}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    to={`/app/users`}
                    className="shrink-0 text-sm text-[#3990D7] hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
