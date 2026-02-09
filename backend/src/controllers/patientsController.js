import db from '../models/index.js';

const { User, Patient } = db;

export async function getProfile(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'patient' || !user.patientId) {
      return res.status(403).json({ success: false, message: 'Not a patient' });
    }
    const patient = await Patient.findByPk(user.patientId, {
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }
    const u = patient.User ? patient.User.toJSON() : {};
    const { password: _, ...userSafe } = u;
    return res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          userId: patient.userId,
          bloodType: patient.bloodType,
          allergies: patient.allergies,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          insuranceProvider: patient.insuranceProvider,
          insuranceNumber: patient.insuranceNumber,
          user: userSafe,
        },
      },
    });
  } catch (err) {
    console.error('Get patient profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to get profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'patient' || !user.patientId) {
      return res.status(403).json({ success: false, message: 'Not a patient' });
    }
    const { bloodType, allergies, emergencyContact, emergencyPhone, insuranceProvider, insuranceNumber } = req.body;
    const patient = await Patient.findByPk(user.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }
    await patient.update({
      ...(bloodType !== undefined && { bloodType }),
      ...(allergies !== undefined && { allergies }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
      ...(insuranceProvider !== undefined && { insuranceProvider }),
      ...(insuranceNumber !== undefined && { insuranceNumber }),
    });
    const updated = await Patient.findByPk(patient.id, {
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    const u = updated.User ? updated.User.toJSON() : {};
    const { password: __, ...userSafe } = u;
    return res.json({
      success: true,
      data: {
        patient: {
          id: updated.id,
          userId: updated.userId,
          bloodType: updated.bloodType,
          allergies: updated.allergies,
          emergencyContact: updated.emergencyContact,
          emergencyPhone: updated.emergencyPhone,
          insuranceProvider: updated.insuranceProvider,
          insuranceNumber: updated.insuranceNumber,
          user: userSafe,
        },
      },
    });
  } catch (err) {
    console.error('Update patient profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Update failed' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const patientId = req.params.id;
    const user = req.user;
    if (user.role !== 'patient' || user.patientId !== parseInt(patientId, 10)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    return res.json({
      success: true,
      data: {
        totalAppointments: 0,
        todayAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        requestedAppointments: 0,
        scheduledAppointments: 0,
      },
    });
  } catch (err) {
    console.error('Get patient dashboard stats error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getAppointments(req, res) {
  try {
    const patientId = req.params.id;
    const user = req.user;
    if (user.role !== 'patient' || user.patientId !== parseInt(patientId, 10)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { limit = 10, sortBy = 'appointmentDate', sortOrder = 'DESC' } = req.query;
    return res.json({
      success: true,
      data: { appointments: [] },
      pagination: { page: 1, limit: parseInt(limit, 10), total: 0 },
    });
  } catch (err) {
    console.error('Get patient appointments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
