import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database.js';
import { runMigrations } from './migrate.js';
import authRoutes from './routes/auth.js';
import patientsRoutes from './routes/patients.js';
import doctorsRoutes from './routes/doctors.js';
import adminRoutes from './routes/admin.js';
import ratingsRoutes from './routes/ratings.js';
import appointmentsRoutes from './routes/appointments.js';
import prescriptionsRoutes from './routes/prescriptions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const openApiPath = path.join(__dirname, 'docs', 'openapi.json');
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CureNet API' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'CureNET API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

async function start() {
  try {
    await sequelize.authenticate();
    await runMigrations();
    console.log('Database connected and migrations up to date.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
