import db from '../models/index.js';

const { User, Doctor, Patient } = db;

export async function getStats(req, res) {
  try {
    const [userCount, doctorCount, patientCount] = await Promise.all([
      User.count(),
      Doctor.count(),
      Patient.count(),
    ]);
    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers: userCount,
          totalDoctors: doctorCount,
          totalPatients: patientCount,
          totalAppointments: 0,
        },
      },
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getAppointmentAnalytics(req, res) {
  try {
    const period = parseInt(req.query.period, 10) || 7;
    return res.json({
      success: true,
      data: {
        analytics: {
          statusCounts: {},
          typeCounts: {},
          dailyCounts: [],
          period,
        },
      },
    });
  } catch (err) {
    console.error('Get appointment analytics error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function getDoctorVerifications(req, res) {
  try {
    const doctors = await Doctor.findAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: 20,
    });
    const list = doctors.map((d) => ({
      id: d.id,
      userId: d.userId,
      bmdcRegistrationNumber: d.bmdcRegistrationNumber,
      department: d.department,
      user: d.User ? d.User.toJSON() : null,
    }));
    return res.json({
      success: true,
      data: { doctors: list },
    });
  } catch (err) {
    console.error('Get doctor verifications error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
