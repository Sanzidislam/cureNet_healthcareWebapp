# CureNet

Full-stack healthcare web app (Phases 1–4: Auth, public flows, dashboards, profiles, appointments).

## Prerequisites

- Node.js 18+
- MySQL 8+ (running locally or remote)

## Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET (and optional DB_HOST, DB_PORT, CORS_ORIGIN)
npm install
npm run dev
```

- **API:** `http://localhost:5000` · Health: `GET /api/health` · **API docs (Swagger UI):** `http://localhost:5000/docs` · **Admin panel (AdminJS):** `http://localhost:5000/admin` — backend-only; log in with an admin user (create one via `npm run create-admin`). Optional `.env`: `ADMIN_SESSION_SECRET`. If you change custom AdminJS components (e.g. dashboard), remove `backend/.adminjs/` and restart the server so the bundle rebuilds.
- **Migrations:** Schema is applied automatically on startup. To run migrations only (e.g. in CI): `npm run migrate`.  
  Migrations are **one file per table** in `backend/src/migrations/`: `000001-users.mjs`, `000002-doctors.mjs`, … `000008-audit-logs.mjs`. Add new migrations with the next number and table/feature name; each file must export `up` and `down` (receiving `{ context: queryInterface }`).  
  **Generate from models:** From `backend`, run `npm run generate-migrations` to (over)write migration files from your Sequelize models. Review the diff before committing. Useful when you add or change a model and want matching migration code.  
  **Existing DB created with old migrations:** If your database was created with the previous timestamp-named migrations, either keep using that DB as-is, or reset and re-run: in MySQL run `DELETE FROM SequelizeMeta;` (or `DROP TABLE SequelizeMeta;`), then drop all app tables if you want a clean slate, then run `npm run migrate` from the `backend` folder.  
  **"Migrations up to date" but tables missing:** If the runner finds no files (e.g. path/glob on Windows), run migrations again from `backend`. If the app still thinks migrations ran, reset as above and re-run.

**Auth** (`/api/auth`): `POST /register`, `POST /login`, `GET`/`PUT /profile`, `POST /forgot-password`, `GET /verify-reset-token?token=...`, `POST /reset-password`.  
- **First admin:** Admins cannot self-register. Create one with `npm run create-admin` (uses `ADMIN_EMAIL`, `ADMIN_PASSWORD` from `.env`, or pass as args). Password is hashed via Sequelize. If you added an admin in MySQL with a plain password, run `node scripts/update-admin-password.mjs <email> <newPassword>` to fix it.

**Patients** (`/api/patients`): `GET`/`PUT /profile`, `GET /:id/dashboard/stats`, `GET /:id/appointments`.

**Doctors** (`/api/doctors`): `GET` (list, optional `?department=`), `GET`/`PUT /profile`, `POST /upload-image` (multer, 5MB, under `uploads/`), `GET /:id/dashboard/stats`, `GET /:id/appointments`, `GET /:id/available-slots?date=YYYY-MM-DD`. Profile image URL: `/uploads/...`.

**Appointments** (`/api/appointments`): `POST /` (patient create), `GET /` (patient list), `GET /:id`, `PUT /:id/cancel`, `PUT /:id/approve`, `PUT /:id/reject`, `PUT /:id/start`, `PUT /:id/complete`.

**Prescriptions** (`/api/prescriptions`): `GET /appointment/:id`, `POST /` (doctor).

**Ratings** (`/api/ratings`): `GET /doctor/:id`, `GET /my-ratings`, `POST /` (patient).

**Admin** (`/api/admin`): `GET /stats`, `GET /analytics/appointments`, `GET /doctor-verifications` (and verify/unverify as needed).

## Frontend

```bash
cd frontend
cp .env.example .env
# Optional: set VITE_API_URL if API is not at http://localhost:5000/api
npm install
npm run dev
```

App runs at `http://localhost:5173`.

- **Public:** `/` (landing), `/login`, `/register`, `/forgot-password`, `/reset-password?token=...`. Catch-all 404 with link to home/login.
- **Protected (role-based):** `/app` → role redirect; `/app/dashboard` (patient), `/app/doctor-dashboard` (doctor), `/app/admin-dashboard` (admin); `/app/profile` (patient), `/app/doctor-profile` (doctor); `/app/appointments` (patient), `/app/doctors` (patient), `/app/doctor-appointments` (doctor). Dashboards use real stats and appointments; profiles use GET/PUT profile and doctor image upload.

## Implemented phases

**Phase 1 – Auth & layout**  
Backend: Express, Sequelize (User, Doctor, Patient, PasswordResetToken), Umzug migrations, JWT auth, auth routes. Frontend: AuthContext, Login, Register, ProtectedRoute, Layout, RoleBasedRedirect, Landing.

**Phase 2 – Public flow**  
Forgot password (`/forgot-password` → `POST /auth/forgot-password`, success + link to sign in). Reset password (`/reset-password?token=...` → verify token, form → `POST /auth/reset-password`, redirect to login). NotFound (404) catch-all. Landing optional enhancements.

**Phase 3 – Dashboards & profiles**  
Backend: Patient GET/PUT profile, dashboard stats & appointments; Doctor GET/PUT profile, upload-image, stats, appointments, ratings; Admin stats, analytics/appointments, doctor-verifications. Static `/uploads` for images. Frontend: Patient dashboard (welcome, stat cards, recent appointments, quick actions); Doctor dashboard (welcome + rating, stat cards, pending-requests banner, today’s schedule, quick actions); Admin dashboard (stat cards, doctors list, links). Patient profile: personal + medical (GET/PUT auth + patients profile). Doctor profile: image upload, basic info, chamber times (explicit slots per day, 30-min 08:00–18:00). Shared: `utils/timeSlots` (CHAMBER_TIME_SLOTS, WEEKDAYS, emptyChamberTimes, normalizeChamberTimes).

**Phase 4 – Appointments & prescriptions**  
Backend: Appointment, Prescription, Rating models and migration; appointments CRUD and actions (create, list, approve, reject, start, complete, cancel); doctor available-slots; prescriptions (get by appointment, create); ratings (by doctor, my-ratings, create). Frontend: Doctors page (patient list with ratings, book appointment → `/app/appointments?book=:id`); Appointments page (patient list, book modal with date/slots/type/reason, cancel, view prescription, rate); DoctorAppointments page (doctor list with date/status filters, approve/reject/start/complete, add/view prescription). PrescriptionView and RatingModal components. 
