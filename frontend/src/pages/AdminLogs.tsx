import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../context/AuthContext';

interface LogRow {
  id: number;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  createdAt: string;
  user?: { id: number; email: string; name: string };
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    user_login: 'User Login',
    user_created: 'User Created',
    user_updated: 'User Updated',
    doctor_verified: 'Doctor Verified',
    doctor_unverified: 'Doctor Unverified',
    appointment_created: 'Appointment Created',
    appointment_status_updated: 'Appointment Status Updated',
  };
  return map[action] || action;
}

function logCategory(action: string) {
  if (action.includes('login')) return 'authentication';
  if (action.includes('user') && !action.includes('appointment')) return 'user-management';
  if (action.includes('doctor')) return 'user-management';
  if (action.includes('appointment')) return 'appointment';
  return 'system';
}

export default function AdminLogs() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page, typeFilter, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '50' };
      if (typeFilter) params.type = typeFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const { data: res } = await api.get<{
        success: boolean;
        data: { logs: LogRow[]; total: number; page: number; limit: number };
      }>('/admin/logs', { params });
      return res.data;
    },
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 50;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">System audit logs</h2>
        <Link to="/app/admin-dashboard" className="text-sm text-[#3990D7] hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by action type..."
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-gray-500">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No logs found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User / Entity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{actionLabel(log.action)}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{log.user?.email ?? log.entityId ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{log.details ?? '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{log.ip ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {logCategory(log.action)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
