import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import * as doctorsController from '../controllers/doctorsController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `doctor-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpe?g|png|gif)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error('Only JPG, PNG, GIF allowed'));
  },
});

const router = Router();

// Literal routes first so /profile is not matched by /:id/...
router.get('/profile', authenticateToken, authorizeRoles('doctor'), doctorsController.getProfile);
router.put('/profile', authenticateToken, authorizeRoles('doctor'), doctorsController.updateProfile);
router.post('/upload-image', authenticateToken, authorizeRoles('doctor'), upload.single('profileImage'), doctorsController.uploadImage);

router.get('/', doctorsController.list);
router.get('/:id/available-slots', doctorsController.getAvailableSlots);
router.get('/:id/upcoming-slots', doctorsController.getUpcomingSlots);
router.get('/:id/ratings', doctorsController.getRatings);
router.get('/:id', doctorsController.getPublicProfile);

router.get('/:id/dashboard/stats', authenticateToken, authorizeRoles('doctor'), doctorsController.getDashboardStats);
router.get('/:id/appointments', authenticateToken, authorizeRoles('doctor'), doctorsController.getAppointments);

export default router;
