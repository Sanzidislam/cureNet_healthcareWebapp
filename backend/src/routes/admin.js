import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getStats);
router.get('/analytics/appointments', adminController.getAppointmentAnalytics);
router.get('/doctor-verifications', adminController.getDoctorVerifications);

export default router;
