/**
 * AdminJS dashboard handler: returns stats, chart data, recent logs, and pending doctors.
 */

import { Op } from 'sequelize';
import db from './models/index.js';

const { User, Doctor, Patient, Appointment, AuditLog } = db;

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

export async function dashboardHandler() {
  const today = dateStr(new Date());
  const period = 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  const startStr = dateStr(startDate);

  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    totalAppointments,
    pendingDoctorCount,
    appointmentsInRange,
    recentLogs,
    pendingDoctors,
  ] = await Promise.all([
    User.count(),
    Doctor.count(),
    Patient.count(),
    Appointment.count(),
    Doctor.count({ where: { verified: false } }),
    Appointment.findAll({
      where: { appointmentDate: { [Op.gte]: startStr } },
      attributes: ['id', 'appointmentDate', 'status', 'type'],
      raw: true,
    }),
    AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: true,
    }),
    Doctor.findAll({
      where: { verified: false },
      include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: 10,
      order: [['id', 'ASC']],
    }),
  ]);

  const dailyCounts = {};
  const statusCounts = {};
  const typeCounts = {};
  for (const a of appointmentsInRange) {
    dailyCounts[a.appointmentDate] = (dailyCounts[a.appointmentDate] || 0) + 1;
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  }

  const appointmentTrend = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const appointmentByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const appointmentByType = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  return {
    stats: {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingDoctorCount,
    },
    appointmentTrend,
    appointmentByStatus,
    appointmentByType,
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      createdAt: l.createdAt,
    })),
    pendingDoctors: pendingDoctors.map((d) => ({
      id: d.id,
      department: d.department,
      user: d.User ? { id: d.User.id, firstName: d.User.firstName, lastName: d.User.lastName, email: d.User.email } : null,
    })),
  };
}
