import { Router } from 'express';
import * as doctorsController from '../controllers/doctorsController.js';

const router = Router();

router.get('/doctor/:id', doctorsController.getRatings);

export default router;
