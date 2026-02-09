import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import * as patientsController from '../controllers/patientsController.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('patient'));

router.get('/profile', patientsController.getProfile);
router.put('/profile', patientsController.updateProfile);
router.get('/:id/dashboard/stats', patientsController.getDashboardStats);
router.get('/:id/appointments', patientsController.getAppointments);

export default router;
