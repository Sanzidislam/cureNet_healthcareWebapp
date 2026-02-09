import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../context/AuthContext';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';
import {
  CHAMBER_TIME_SLOTS,
  WEEKDAYS,
  emptyChamberTimes,
  normalizeChamberTimes,
  type ChamberTimes,
  type Weekday,
} from '../utils/timeSlots';

const API_ORIGIN = import.meta.env.VITE_API_URL
  ? new URL(import.meta.env.VITE_API_URL).origin
  : 'http://localhost:5000';

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
  chamberTimes?: ChamberTimes;
  degrees?: string[];
  awards?: string[];
  languages?: string[];
  services?: string[];
}

export default function DoctorProfile() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [chamberTimes, setChamberTimes] = useState<ChamberTimes>(emptyChamberTimes());
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
      setChamberTimes(normalizeChamberTimes(doctor.chamberTimes));
    }
  }, [doctor]);

  const updateMutation = useMutation({
    mutationFn: async (payload: DoctorForm) => {
      await api.put('/doctors/profile', { ...payload, chamberTimes });
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

  const handleSlotToggle = (day: Weekday, time: string) => {
    if (!editing) return;
    setChamberTimes((prev) => {
      const arr = prev[day] ?? [];
      const next = arr.includes(time) ? arr.filter((t) => t !== time) : [...arr, time].sort();
      return { ...prev, [day]: next };
    });
  };

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
              onClick={form.handleSubmit((d) => updateMutation.mutate({ ...d, chamberTimes }))}
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
          <h3 className="font-semibold text-gray-900">Chamber times (availability)</h3>
          <p className="text-sm text-gray-500 mt-1">Select the time slots when you are available each day (30-min slots).</p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Day</th>
                <th className="text-left py-2 font-medium text-gray-700">Time slots</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => (
                <tr key={day} className="border-b border-gray-100">
                  <td className="py-2 pr-4 capitalize text-gray-700">{day}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {CHAMBER_TIME_SLOTS.map((time) => {
                        const selected = (chamberTimes[day] ?? []).includes(time);
                        return (
                          <label
                            key={time}
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium cursor-pointer ${
                              editing
                                ? selected
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : selected
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'text-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => handleSlotToggle(day, time)}
                              disabled={!editing}
                              className="sr-only"
                            />
                            {time}
                          </label>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Lists (degrees, awards, languages, services)</h3>
          <p className="text-sm text-gray-500 mt-1">Edit in a future iteration or add simple text fields if needed.</p>
        </div>
        <div className="p-4 text-gray-500 text-sm">
          Degrees, awards, languages and services can be added as list fields in a follow-up. Profile save already supports them as arrays.
        </div>
      </div>
    </div>
  );
}
