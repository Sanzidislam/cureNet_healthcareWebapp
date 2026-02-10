import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';

interface UserRow {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  doctorId?: number | null;
  patientId?: number | null;
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const addMode = searchParams.get('add') === '1';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(addMode);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, activeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter;
      const { data: res } = await api.get<{
        success: boolean;
        data: { users: UserRow[]; total: number; page: number; limit: number };
      }>('/admin/users', { params });
      return res.data;
    },
  });

  const createUser = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/admin/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setShowAddModal(false);
      setSearchParams({});
      toast.success('User created');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || 'Failed to create user');
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      api.put(`/admin/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingId(null);
      toast.success('User updated');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || 'Failed to update user');
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.put(`/admin/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('User status updated');
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || 'Failed to update');
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 20;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#3990D7] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d7ab8]"
        >
          <PlusIcon className="h-5 w-5" />
          Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm w-56 focus:ring-2 focus:ring-[#3990D7]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No users found.</p>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                        disabled={toggleActive.isPending}
                        className="text-sm text-[#3990D7] hover:underline mr-3"
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(u.id)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showAddModal && (
        <AddUserModal
          onClose={() => { setShowAddModal(false); setSearchParams({}); }}
          onSubmit={(body) => createUser.mutate(body)}
          isSubmitting={createUser.isPending}
        />
      )}
      {editingId && (() => {
        const user = users.find((u) => u.id === editingId);
        return user ? (
          <EditUserModal
            user={user}
            onClose={() => setEditingId(null)}
            onSave={(body) => updateUser.mutate({ id: editingId, body })}
            isSubmitting={updateUser.isPending}
          />
        ) : null;
      })()}
    </div>
  );
}

function AddUserModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [role, setRole] = useState<'admin' | 'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [bmdcRegistrationNumber, setBmdcRegistrationNumber] = useState('');
  const [experience, setExperience] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      email,
      password,
      firstName,
      lastName,
      role,
    };
    if (role === 'doctor') {
      if (department) body.department = department;
      if (bmdcRegistrationNumber) body.bmdcRegistrationNumber = bmdcRegistrationNumber;
      if (experience) body.experience = parseInt(experience, 10);
    }
    onSubmit(body);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'patient' | 'doctor')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          {role === 'doctor' && (
            <>
              <input
                type="text"
                placeholder="BMDC registration number"
                value={bmdcRegistrationNumber}
                onChange={(e) => setBmdcRegistrationNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Department</option>
                {MEDICAL_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="Years of experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </>
          )}
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 rounded-lg bg-[#3990D7] text-white disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({
  user: initialUser,
  onClose,
  onSave,
  isSubmitting,
}: {
  user: UserRow;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
  isSubmitting: boolean;
}) {
  const [firstName, setFirstName] = useState(initialUser.firstName);
  const [lastName, setLastName] = useState(initialUser.lastName);
  const [email, setEmail] = useState(initialUser.email);
  const [role, setRole] = useState(initialUser.role);
  const [isActive, setIsActive] = useState(initialUser.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName, email, role, isActive });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm">Active (can log in)</span>
          </label>
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 rounded-lg bg-[#3990D7] text-white disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
