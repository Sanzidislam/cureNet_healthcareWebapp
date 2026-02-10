import db from '../models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { User, Doctor, Appointment, Rating } = db;

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function getWeekday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return WEEKDAY_NAMES[d.getDay()];
}

function formatDoctorResponse(doctor, user) {
  const u = user ? (user.toJSON ? user.toJSON() : user) : {};
  const { password: _, ...userSafe } = u;
  const d = doctor ? (doctor.toJSON ? doctor.toJSON() : doctor) : {};
  return { ...d, user: userSafe };
}

export async function list(req, res) {
  try {
    const { department, limit } = req.query;
    const where = { verified: true };
    if (department) where.department = department;
    const options = {
      where,
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    };
    const num = parseInt(limit, 10);
    if (Number.isFinite(num) && num > 0) options.limit = Math.min(num, 100);
    const doctors = await Doctor.findAll(options);
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
    const doctorId = parseInt(req.params.id, 10);
    const user = req.user;
    if (user.role !== 'doctor' || user.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const today = new Date().toISOString().slice(0, 10);
    const [totalAppointments, todayAppointments, completedAppointments, pendingAppointments, requestedAppointments, inProgressAppointments, totalPatients] = await Promise.all([
      Appointment.count({ where: { doctorId } }),
      Appointment.count({ where: { doctorId, appointmentDate: today, status: { [Op.notIn]: ['cancelled', 'rejected'] } } }),
      Appointment.count({ where: { doctorId, status: 'completed' } }),
      Appointment.count({ where: { doctorId, status: 'approved' } }),
      Appointment.count({ where: { doctorId, status: 'requested' } }),
      Appointment.count({ where: { doctorId, status: 'in_progress' } }),
      Appointment.count({ where: { doctorId }, distinct: true, col: 'patientId' }),
    ]);
    return res.json({
      success: true,
      data: {
        stats: {
          totalAppointments,
          todayAppointments,
          completedAppointments,
          pendingAppointments,
          requestedAppointments,
          inProgressAppointments,
          totalPatients,
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
    const doctorId = parseInt(req.params.id, 10);
    const user = req.user;
    if (user.role !== 'doctor' || user.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { date, status, limit = 20, page = 1 } = req.query;
    const where = { doctorId };
    if (date) where.appointmentDate = date;
    if (status) where.status = status;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limitNum;
    const { Patient } = db;
    const { rows, count } = await Appointment.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['appointment_date', 'ASC'], ['time_block', 'ASC']],
      include: [
        { model: Patient, as: 'Patient', include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }] },
      ],
    });
    const list = rows.map((a) => {
      const d = a.get({ plain: true });
      return {
        id: d.id,
        patientId: d.patientId,
        doctorId: d.doctorId,
        appointmentDate: d.appointmentDate,
        timeBlock: d.timeBlock,
        type: d.type,
        reason: d.reason,
        symptoms: d.symptoms,
        status: d.status,
        createdAt: d.createdAt,
        patient: d.Patient ? { id: d.Patient.id, user: d.Patient.User } : null,
      };
    });
    return res.json({
      success: true,
      data: { appointments: list },
      pagination: { page: parseInt(page, 10), limit: limitNum, total: count },
    });
  } catch (err) {
    console.error('Get doctor appointments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getAvailableSlots(req, res) {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) required' });
    }
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const chamberTimes = doctor.chamberTimes || {};
    const weekday = getWeekday(date);
    const daySlots = Array.isArray(chamberTimes[weekday]) ? chamberTimes[weekday] : [];
    const booked = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
      attributes: ['timeBlock'],
    });
    const bookedSet = new Set(booked.map((a) => a.timeBlock));
    const slots = daySlots.filter((t) => !bookedSet.has(t));
    return res.json({ success: true, data: { slots } });
  } catch (err) {
    console.error('Get available slots error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getPublicProfile(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' });
    }
    const doctor = await Doctor.findByPk(id, {
      include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }],
    });
    if (!doctor || !doctor.verified) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const patientCount = await Appointment.count({
      where: { doctorId: id },
      distinct: true,
      col: 'patientId',
    });
    const doctorJson = formatDoctorResponse(doctor, doctor.User);
    return res.json({
      success: true,
      data: {
        doctor: { ...doctorJson, patientCount },
      },
    });
  } catch (err) {
    console.error('Get public doctor profile error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getUpcomingSlots(req, res) {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const days = Math.min(30, Math.max(1, parseInt(req.query.days, 10) || 14));
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (!doctor.verified) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const chamberTimes = doctor.chamberTimes || {};
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slots = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const weekday = dayNames[d.getDay()];
      const timeBlocks = Array.isArray(chamberTimes[weekday]) ? chamberTimes[weekday] : [];
      if (timeBlocks.length === 0) continue;
      const booked = await Appointment.findAll({
        where: {
          doctorId,
          appointmentDate: dateStr,
          status: { [Op.notIn]: ['cancelled', 'rejected'] },
        },
        attributes: ['timeBlock'],
      });
      const bookedSet = new Set(booked.map((a) => a.timeBlock));
      const minTime = timeBlocks[0];
      const maxTime = timeBlocks[timeBlocks.length - 1];
      slots.push({
        date: dateStr,
        dayName: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        timeRange: `${minTime} - ${maxTime}`,
        timeBlocks,
        booked: timeBlocks.map((t) => ({ timeBlock: t, booked: bookedSet.has(t) })),
      });
    }
    return res.json({ success: true, data: { slots } });
  } catch (err) {
    console.error('Get upcoming slots error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getRatings(req, res) {
  try {
    const doctorId = req.params.id;
    const ratings = await Rating.findAll({
      where: { doctorId },
      attributes: ['id', 'rating', 'review', 'createdAt'],
    });
    const total = ratings.length;
    const sum = ratings.reduce((s, r) => s + r.rating, 0);
    const averageRating = total ? Math.round((sum / total) * 10) / 10 : 0;
    return res.json({
      success: true,
      data: {
        summary: { averageRating, totalRatings: total },
        ratings: ratings.map((r) => r.get({ plain: true })),
      },
    });
  } catch (err) {
    console.error('Get doctor ratings error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
