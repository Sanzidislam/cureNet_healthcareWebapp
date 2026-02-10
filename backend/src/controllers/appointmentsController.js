import db from '../models/index.js';
import { Op } from 'sequelize';
import { logAudit } from '../lib/auditLog.js';

const { Appointment, Doctor, Patient, User } = db;

function getClientIp(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
}

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getWeekday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return WEEKDAY_NAMES[d.getDay()];
}

export async function create(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'patient' || !user.patientId) {
      return res.status(403).json({ success: false, message: 'Not a patient' });
    }
    const { doctorId, appointmentDate, timeBlock, type, reason, symptoms } = req.body;
    if (!doctorId || !appointmentDate || !timeBlock) {
      return res.status(400).json({ success: false, message: 'doctorId, appointmentDate, timeBlock required' });
    }
    const docId = parseInt(doctorId, 10);
    const doctor = await Doctor.findByPk(docId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const chamberTimes = doctor.chamberTimes || {};
    const weekday = getWeekday(appointmentDate);
    const daySlots = Array.isArray(chamberTimes[weekday]) ? chamberTimes[weekday] : [];
    if (!daySlots.includes(timeBlock)) {
      return res.status(400).json({ success: false, message: 'Time slot not available for this doctor on this day' });
    }
    const existing = await Appointment.findOne({
      where: {
        doctorId: docId,
        appointmentDate,
        timeBlock,
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Slot already booked' });
    }
    const appointment = await Appointment.create({
      patientId: user.patientId,
      doctorId: docId,
      appointmentDate,
      timeBlock,
      type: type || 'in_person',
      reason: reason || null,
      symptoms: symptoms || null,
      status: 'requested',
    });
    logAudit({
      action: 'appointment_created',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, doctorId: docId, appointmentDate, timeBlock, status: 'requested' },
      ip: getClientIp(req),
    }).catch(() => {});
    const withAssocs = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Doctor, as: 'Doctor', include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName'] }] },
        { model: Patient, as: 'Patient', include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName'] }] },
      ],
    });
    return res.status(201).json({ success: true, data: { appointment: formatAppointment(withAssocs) } });
  } catch (err) {
    console.error('Create appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

function formatAppointment(a) {
  const d = a.get ? a.get({ plain: true }) : a;
  const doctor = d.Doctor || {};
  const patient = d.Patient || {};
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
    updatedAt: d.updatedAt,
    doctor: doctor.User ? { id: doctor.id, user: doctor.User } : { id: doctor.id },
    patient: patient.User ? { id: patient.id, user: patient.User } : { id: patient.id },
  };
}

export async function listForPatient(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'patient' || !user.patientId) {
      return res.status(403).json({ success: false, message: 'Not a patient' });
    }
    const { status, limit = 20, page = 1, sortBy = 'appointmentDate', sortOrder = 'DESC' } = req.query;
    const where = { patientId: user.patientId };
    if (status) where.status = status;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limitNum;
    const order = [[sortBy, (sortOrder || 'DESC').toUpperCase()]];
    const { rows, count } = await Appointment.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order,
      include: [
        { model: Doctor, as: 'Doctor', include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }] },
      ],
    });
    const list = rows.map((a) => formatAppointment(a));
    return res.json({
      success: true,
      data: { appointments: list },
      pagination: { page: parseInt(page, 10), limit: limitNum, total: count },
    });
  } catch (err) {
    console.error('List patient appointments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function listForDoctor(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const doctorId = req.params.id;
    if (parseInt(doctorId, 10) !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { date, status, limit = 20, page = 1 } = req.query;
    const where = { doctorId: user.doctorId };
    if (date) where.appointmentDate = date;
    if (status) where.status = status;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limitNum;
    const { rows, count } = await Appointment.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['appointment_date', 'ASC'], ['time_block', 'ASC']],
      include: [
        { model: Patient, as: 'Patient', include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }] },
      ],
    });
    const list = rows.map((a) => formatAppointment(a));
    return res.json({
      success: true,
      data: { appointments: list },
      pagination: { page: parseInt(page, 10), limit: limitNum, total: count },
    });
  } catch (err) {
    console.error('List doctor appointments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getOne(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = req.user;
    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Doctor, as: 'Doctor', include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }] },
        { model: Patient, as: 'Patient', include: [{ model: User, as: 'User', attributes: { exclude: ['password'] } }] },
      ],
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const isPatient = user.role === 'patient' && user.patientId === appointment.patientId;
    const isDoctor = user.role === 'doctor' && user.doctorId === appointment.doctorId;
    const isAdmin = user.role === 'admin';
    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Get appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function approve(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const id = parseInt(req.params.id, 10);
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (appointment.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Only requested appointments can be approved' });
    }
    const oldStatus = appointment.status;
    await appointment.update({ status: 'approved' });
    logAudit({
      action: 'appointment_status_updated',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, oldStatus, newStatus: 'approved' },
      ip: getClientIp(req),
    }).catch(() => {});
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Approve appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function reject(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const id = parseInt(req.params.id, 10);
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (appointment.status !== 'requested') {
      return res.status(400).json({ success: false, message: 'Only requested appointments can be rejected' });
    }
    const oldStatus = appointment.status;
    await appointment.update({ status: 'rejected' });
    logAudit({
      action: 'appointment_status_updated',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, oldStatus, newStatus: 'rejected' },
      ip: getClientIp(req),
    }).catch(() => {});
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Reject appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function start(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const id = parseInt(req.params.id, 10);
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (appointment.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved appointments can be started' });
    }
    const oldStatus = appointment.status;
    await appointment.update({ status: 'in_progress' });
    logAudit({
      action: 'appointment_status_updated',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, oldStatus, newStatus: 'in_progress' },
      ip: getClientIp(req),
    }).catch(() => {});
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Start appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function complete(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const id = parseInt(req.params.id, 10);
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (appointment.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Only in-progress appointments can be completed' });
    }
    const oldStatus = appointment.status;
    await appointment.update({ status: 'completed' });
    logAudit({
      action: 'appointment_status_updated',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, oldStatus, newStatus: 'completed' },
      ip: getClientIp(req),
    }).catch(() => {});
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Complete appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function cancel(req, res) {
  try {
    const user = req.user;
    const id = parseInt(req.params.id, 10);
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const isPatient = user.role === 'patient' && user.patientId === appointment.patientId;
    const isDoctor = user.role === 'doctor' && user.doctorId === appointment.doctorId;
    if (!isPatient && !isDoctor) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel' });
    }
    if (['cancelled', 'rejected', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Appointment cannot be cancelled' });
    }
    const oldStatus = appointment.status;
    await appointment.update({ status: 'cancelled' });
    logAudit({
      action: 'appointment_status_updated',
      userId: user.id,
      entityType: 'appointment',
      entityId: String(appointment.id),
      details: { appointmentId: appointment.id, oldStatus, newStatus: 'cancelled' },
      ip: getClientIp(req),
    }).catch(() => {});
    return res.json({ success: true, data: { appointment: formatAppointment(appointment) } });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
