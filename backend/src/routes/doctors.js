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

router.get('/', doctorsController.list);
router.get('/:id/ratings', doctorsController.getRatings);

router.use(authenticateToken);

router.get('/profile', authorizeRoles('doctor'), doctorsController.getProfile);
router.put('/profile', authorizeRoles('doctor'), doctorsController.updateProfile);
router.post('/upload-image', authorizeRoles('doctor'), upload.single('profileImage'), doctorsController.uploadImage);
router.get('/:id/dashboard/stats', authorizeRoles('doctor'), doctorsController.getDashboardStats);
router.get('/:id/appointments', authorizeRoles('doctor'), doctorsController.getAppointments);

export default router;
