import db from '../models/index.js';

const { Prescription, Appointment } = db;

export async function getByAppointment(req, res) {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const user = req.user;
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const isPatient = user.role === 'patient' && user.patientId === appointment.patientId;
    const isDoctor = user.role === 'doctor' && user.doctorId === appointment.doctorId;
    if (!isPatient && !isDoctor) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const prescription = await Prescription.findOne({
      where: { appointmentId },
    });
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'No prescription for this appointment' });
    }
    return res.json({
      success: true,
      data: { prescription: prescription.get({ plain: true }) },
    });
  } catch (err) {
    console.error('Get prescription error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function create(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const { appointmentId, diagnosis, medicines, notes } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId required' });
    }
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }
    if (!['in_progress', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Can only add prescription for in-progress or completed appointment' });
    }
    const existing = await Prescription.findOne({ where: { appointmentId } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Prescription already exists for this appointment' });
    }
    const prescription = await Prescription.create({
      appointmentId,
      diagnosis: diagnosis || null,
      medicines: Array.isArray(medicines) ? medicines : null,
      notes: notes || null,
    });
    return res.status(201).json({
      success: true,
      data: { prescription: prescription.get({ plain: true }) },
    });
  } catch (err) {
    console.error('Create prescription error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}

export async function editPrescription(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'doctor' || !user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not a doctor' });
    }
    const prescriptionId = parseInt(req.params.id, 10);
    const { diagnosis, medicines, notes } = req.body;
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [{ model: Appointment, as: 'Appointment' }],
    });
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    if (prescription.Appointment.doctorId !== user.doctorId) {
      return res.status(403).json({ success: false, message: 'Not your prescription' });
    }
    await prescription.update({ diagnosis, medicines, notes });
    return res.json({
      success: true,
      data: { prescription: prescription.get({ plain: true }) },
    });
  } catch (err) {
    console.error('Edit prescription error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
}
