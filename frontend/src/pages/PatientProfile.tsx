import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface PatientData {
  bloodType?: string;
  allergies?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

interface PersonalForm {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export default function PatientProfile() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingMedical, setEditingMedical] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['patients', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { patient: PatientData & { user?: PersonalForm } };
      }>('/patients/profile');
      return data.data?.patient;
    },
  });

  const patient = profileData;
  const personal = patient?.user ?? user;

  const personalForm = useForm<PersonalForm>({
    defaultValues: {
      firstName: personal?.firstName ?? '',
      lastName: personal?.lastName ?? '',
      phone: personal?.phone ?? '',
      dateOfBirth: personal?.dateOfBirth ?? '',
      gender: personal?.gender ?? '',
      address: personal?.address ?? '',
    },
  });

  const medicalForm = useForm<PatientData>({
    defaultValues: {
      bloodType: patient?.bloodType ?? '',
      allergies: patient?.allergies ?? '',
      emergencyContact: patient?.emergencyContact ?? '',
      emergencyPhone: patient?.emergencyPhone ?? '',
      insuranceProvider: patient?.insuranceProvider ?? '',
      insuranceNumber: patient?.insuranceNumber ?? '',
    },
  });

  useEffect(() => {
    if (personal) {
      personalForm.reset({
        firstName: personal.firstName ?? '',
        lastName: personal.lastName ?? '',
        phone: personal.phone ?? '',
        dateOfBirth: personal.dateOfBirth ?? '',
        gender: personal.gender ?? '',
        address: personal.address ?? '',
      });
    }
  }, [personal]);

  useEffect(() => {
    if (patient) {
      medicalForm.reset({
        bloodType: patient.bloodType ?? '',
        allergies: patient.allergies ?? '',
        emergencyContact: patient.emergencyContact ?? '',
        emergencyPhone: patient.emergencyPhone ?? '',
        insuranceProvider: patient.insuranceProvider ?? '',
        insuranceNumber: patient.insuranceNumber ?? '',
      });
    }
  }, [patient]);

  const updatePersonalMutation = useMutation({
    mutationFn: async (payload: PersonalForm) => {
      const { data } = await api.put<{ success: boolean; data: { user: unknown } }>('/auth/profile', payload);
      return data.data?.user;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) updateProfile(updatedUser as Parameters<typeof updateProfile>[0]);
      queryClient.invalidateQueries({ queryKey: ['patients', 'profile'] });
      setEditingPersonal(false);
      toast.success('Profile updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Update failed');
    },
  });

  const updateMedicalMutation = useMutation({
    mutationFn: async (payload: PatientData) => {
      await api.put('/patients/profile', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'profile'] });
      setEditingMedical(false);
      toast.success('Medical info updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Update failed');
    },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">My profile</h2>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Personal information</h3>
          {!editingPersonal ? (
            <button
              type="button"
              onClick={() => setEditingPersonal(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingPersonal(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={personalForm.handleSubmit((d) => updatePersonalMutation.mutate(d))}
                disabled={updatePersonalMutation.isPending}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                {...personalForm.register('firstName', { required: true })}
                readOnly={!editingPersonal}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                {...personalForm.register('lastName', { required: true })}
                readOnly={!editingPersonal}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              {...personalForm.register('phone')}
              readOnly={!editingPersonal}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
              <input
                type="date"
                {...personalForm.register('dateOfBirth')}
                readOnly={!editingPersonal}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                {...personalForm.register('gender')}
                disabled={!editingPersonal}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 disabled:bg-gray-100"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              {...personalForm.register('address')}
              readOnly={!editingPersonal}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Medical information</h3>
          {!editingMedical ? (
            <button
              type="button"
              onClick={() => setEditingMedical(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingMedical(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={medicalForm.handleSubmit((d) => updateMedicalMutation.mutate(d))}
                disabled={updateMedicalMutation.isPending}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood type</label>
            <select
              {...medicalForm.register('bloodType')}
              disabled={!editingMedical}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 disabled:bg-gray-100"
            >
              <option value="">Select</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma-separated)</label>
            <input
              {...medicalForm.register('allergies')}
              readOnly={!editingMedical}
              placeholder="e.g. Penicillin, Pollen"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact name</label>
              <input
                {...medicalForm.register('emergencyContact')}
                readOnly={!editingMedical}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact phone</label>
              <input
                {...medicalForm.register('emergencyPhone')}
                readOnly={!editingMedical}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance provider</label>
              <input
                {...medicalForm.register('insuranceProvider')}
                readOnly={!editingMedical}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance number</label>
              <input
                {...medicalForm.register('insuranceNumber')}
                readOnly={!editingMedical}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 read-only:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
