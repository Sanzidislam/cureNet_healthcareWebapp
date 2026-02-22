import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../context/AuthContext';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';
import { WEEKDAYS } from '../utils/timeSlots';

const API_ORIGIN = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:5000';

interface ChamberWindowConfig {
  enabled: boolean;
  maxPatients?: number;
}

type ChamberWindows = Partial<Record<typeof WEEKDAYS[number], Partial<Record<'morning' | 'noon' | 'evening', ChamberWindowConfig>>>>;

interface DoctorForm {
  bmdcRegistrationNumber?: string;
  department?: string;
  experience?: number;
  education?: string;
  certifications?: string;
  hospital?: string;
  location?: string;
  consultationFee?: number;
  bio?: string;
  profileImage?: string;
  chamberWindows?: ChamberWindows;
  degrees?: string[];
  awards?: string[];
  languages?: string[];
  services?: string[];
}

const WINDOWS = [
  { key: 'morning' as const, label: 'Morning', timeRange: '09:00–13:00' },
  { key: 'noon' as const, label: 'Noon', timeRange: '13:00–17:00' },
  { key: 'evening' as const, label: 'Evening', timeRange: '17:00–18:00' },
] as const;

function emptyChamberWindows(): ChamberWindows {
  const out: ChamberWindows = {};
  for (const day of WEEKDAYS) {
    out[day] = {
      morning: { enabled: false, maxPatients: 0 },
      noon: { enabled: false, maxPatients: 0 },
      evening: { enabled: false, maxPatients: 0 },
    };
  }
  return out;
}

function normalizeChamberWindows(raw: ChamberWindows | null | undefined): ChamberWindows {
  const out = emptyChamberWindows();
  if (!raw || typeof raw !== 'object') return out;
  for (const day of WEEKDAYS) {
    const dayData = raw[day];
    if (dayData && typeof dayData === 'object') {
      for (const win of WINDOWS) {
        const winData = dayData[win.key];
        if (winData && typeof winData === 'object') {
          out[day] = out[day] || {};
          out[day]![win.key] = {
            enabled: winData.enabled === true,
            maxPatients: typeof winData.maxPatients === 'number' ? winData.maxPatients : 0,
          };
        }
      }
    }
  }
  return out;
}

export default function DoctorProfile() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [chamberWindows, setChamberWindows] = useState<ChamberWindows>(emptyChamberWindows());
  const [uploading, setUploading] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['doctors', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { doctor: DoctorForm & { profileImage?: string } } }>(
        '/doctors/profile'
      );
      return data.data?.doctor;
    },
  });

  const doctor = profileData;

  const form = useForm<DoctorForm>({
    defaultValues: {
      department: '',
      experience: undefined,
      education: '',
      certifications: '',
      hospital: '',
      location: '',
      consultationFee: undefined,
      bio: '',
      degrees: [],
      awards: [],
      languages: [],
      services: [],
    },
  });

  useEffect(() => {
    if (doctor) {
      form.reset({
        department: doctor.department ?? '',
        experience: doctor.experience ?? undefined,
        education: doctor.education ?? '',
        certifications: doctor.certifications ?? '',
        hospital: doctor.hospital ?? '',
        location: doctor.location ?? '',
        consultationFee: doctor.consultationFee != null ? Number(doctor.consultationFee) : undefined,
        bio: doctor.bio ?? '',
        degrees: Array.isArray(doctor.degrees) ? doctor.degrees : [],
        awards: Array.isArray(doctor.awards) ? doctor.awards : [],
        languages: Array.isArray(doctor.languages) ? doctor.languages : [],
        services: Array.isArray(doctor.services) ? doctor.services : [],
      });
      setChamberWindows(normalizeChamberWindows(doctor.chamberWindows));
    }
  }, [doctor]);

  const updateMutation = useMutation({
    mutationFn: async (payload: DoctorForm) => {
      await api.put('/doctors/profile', { ...payload, chamberWindows });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors', 'profile'] });
      setEditing(false);
      toast.success('Profile updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Update failed');
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const { data } = await api.post<{ success: boolean; data: { imageUrl: string } }>(
        '/doctors/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (data.success) queryClient.invalidateQueries({ queryKey: ['doctors', 'profile'] });
      toast.success('Image updated');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
      toast.error(msg ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = doctor?.profileImage
    ? (doctor.profileImage.startsWith('http') ? doctor.profileImage : `${API_ORIGIN}${doctor.profileImage}`)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Doctor profile</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Edit profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={form.handleSubmit((d) => updateMutation.mutate({ ...d, chamberWindows }))}
              disabled={updateMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Profile image</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">?</div>
              )}
            </div>
            {editing && (
              <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
                {uploading ? 'Uploading...' : 'Upload image'}
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Basic information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BMDC registration number</label>
            <input
              type="text"
              value={doctor?.bmdcRegistrationNumber ?? ''}
              readOnly
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                {...form.register('department')}
                disabled={!editing}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 disabled:bg-gray-100"
              >
                <option value="">Select</option>
                {MEDICAL_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
              <input
                type="number"
                min={0}
                {...form.register('experience', { valueAsNumber: true })}
                readOnly={!editing}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <input
              {...form.register('education')}
              readOnly={!editing}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
            <input
              {...form.register('certifications')}
              readOnly={!editing}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / clinic</label>
              <input
                {...form.register('hospital')}
                readOnly={!editing}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation fee</label>
              <input
                type="number"
                min={0}
                step={0.01}
                {...form.register('consultationFee', { valueAsNumber: true })}
                readOnly={!editing}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...form.register('location')}
              readOnly={!editing}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              {...form.register('bio')}
              readOnly={!editing}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Chamber availability (by window)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose which parts of the day you see patients on each weekday. Set max patients per window (0 = unlimited).
          </p>
        </div>
        <div className="p-4 space-y-4">
          {WEEKDAYS.map((day) => {
            const dayWindows = chamberWindows[day] || {};
            return (
              <div key={day} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="capitalize text-sm font-medium text-gray-800 mb-3">{day}</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {WINDOWS.map((w) => {
                    const config = dayWindows[w.key] || { enabled: false, maxPatients: 0 };
                    const enabled = config.enabled === true;
                    const maxPatients = config.maxPatients || 0;
                    return (
                      <div key={w.key} className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={!editing}
                            onChange={(e) => {
                              if (!editing) return;
                              setChamberWindows((prev) => {
                                const next = { ...prev };
                                if (!next[day]) next[day] = {};
                                next[day] = { ...next[day], [w.key]: { enabled: e.target.checked, maxPatients } };
                                return next;
                              });
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700">{w.label}</span>
                          <span className="text-xs text-gray-500">({w.timeRange})</span>
                        </label>
                        {enabled && editing && (
                          <div className="flex items-center gap-2 ml-6">
                            <label className="text-xs text-gray-600">Max patients:</label>
                            <input
                              type="number"
                              min={0}
                              value={maxPatients}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                setChamberWindows((prev) => {
                                  const next = { ...prev };
                                  if (!next[day]) next[day] = {};
                                  next[day] = { ...next[day], [w.key]: { enabled: true, maxPatients: val } };
                                  return next;
                                });
                              }}
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                              placeholder="0"
                            />
                            {maxPatients === 0 && <span className="text-xs text-gray-500">(unlimited)</span>}
                          </div>
                        )}
                        {enabled && !editing && maxPatients > 0 && (
                          <div className="ml-6 text-xs text-gray-600">Max: {maxPatients}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Lists (degrees, awards, languages, services)</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add items as simple lists (press Enter to add each one). These are shown on your public profile.
          </p>
        </div>
        <div className="p-4 space-y-4">
          {(['degrees', 'awards', 'languages', 'services'] as const).map((fieldKey) => {
            const label =
              fieldKey === 'degrees'
                ? 'Degrees'
                : fieldKey === 'awards'
                  ? 'Awards'
                  : fieldKey === 'languages'
                    ? 'Languages'
                    : 'Services';
            const items = form.watch(fieldKey) ?? [];
            return (
              <div key={fieldKey}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {items.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No {label.toLowerCase()} added yet.</span>
                  )}
                  {items.map((val, idx) => (
                    <span
                      key={`${val}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-800"
                    >
                      {val}
                      {editing && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = items.filter((_, i) => i !== idx);
                            form.setValue(fieldKey, next, { shouldDirty: true });
                          }}
                          className="ml-1 text-gray-400 hover:text-red-500"
                          aria-label={`Remove ${label} item`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <input
                    type="text"
                    placeholder={`Add ${label.toLowerCase().slice(0, -1)} and press Enter`}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      const value = (e.currentTarget.value || '').trim();
                      if (!value) return;
                      if (!items.includes(value)) {
                        form.setValue(fieldKey, [...items, value], { shouldDirty: true });
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
