import db from '../models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { User, Doctor } = db;

function formatDoctorResponse(doctor, user) {
  const u = user ? (user.toJSON ? user.toJSON() : user) : {};
  const { password: _, ...userSafe } = u;
  const d = doctor ? (doctor.toJSON ? doctor.toJSON() : doctor) : {};
  return { ...d, user: userSafe };
}

export async function list(req, res) {
  try {
    const { department } = req.query;
    const where = {};
    if (department) where.department = department;
    const doctors = await Doctor.findAll({
      where,
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    const list = doctors.map((d) => formatDoctorResponse(d, d.User));
    return res.json({ success: true, data: { doctors: list } });
  } catch (err) {
    console.error('List doctors error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const doctor = await Doctor.findByPk(user.doctorId, {
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    return res.json({
      success: true,
      data: { doctor: formatDoctorResponse(doctor, doctor.User) },
    });
  } catch (err) {
    console.error('Get doctor profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const doctor = await Doctor.findByPk(user.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    const allowed = [
      'bmdcRegistrationNumber', 'department', 'experience', 'education', 'certifications',
      'hospital', 'location', 'consultationFee', 'bio', 'chamberTimes', 'degrees', 'awards',
      'languages', 'services',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    await doctor.update(updates);
    const updated = await Doctor.findByPk(doctor.id, {
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    return res.json({
      success: true,
      data: { doctor: formatDoctorResponse(updated, updated.User) },
    });
  } catch (err) {
    console.error('Update doctor profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Update failed' });
  }
}

export async function uploadImage(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const doctor = await Doctor.findByPk(user.doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    await doctor.update({ profileImage: imageUrl });
    return res.json({ success: true, data: { imageUrl } });
  } catch (err) {
    console.error('Upload doctor image error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const doctorId = req.params.id;
    const user = req.user;
    if (user.role !== 'doctor' || user.doctorId !== parseInt(doctorId, 10)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    return res.json({
      success: true,
      data: {
        stats: {
          totalAppointments: 0,
          todayAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          requestedAppointments: 0,
          inProgressAppointments: 0,
          totalPatients: 0,
        },
      },
    });
  } catch (err) {
    console.error('Get doctor dashboard stats error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getAppointments(req, res) {
  try {
    const doctorId = req.params.id;
    const user = req.user;
    if (user.role !== 'doctor' || user.doctorId !== parseInt(doctorId, 10)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { date } = req.query;
    return res.json({
      success: true,
      data: { appointments: [] },
      pagination: { page: 1, limit: 20, total: 0 },
    });
  } catch (err) {
    console.error('Get doctor appointments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getRatings(req, res) {
  try {
    const doctorId = req.params.id;
    return res.json({
      success: true,
      data: {
        summary: { averageRating: 0, totalRatings: 0 },
        ratings: [],
      },
    });
  } catch (err) {
    console.error('Get doctor ratings error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
