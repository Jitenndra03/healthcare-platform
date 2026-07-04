# Healthcare Appointment & Follow-up Manager

A production-grade, full-stack healthcare platform with **three role-based portals** (Patient, Doctor, Admin), **AI-powered clinical summaries**, **Google Calendar sync**, **email notifications**, and **bulletproof double-booking prevention** using PostgreSQL row-level locking.

> **Design doc →** [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) (architecture diagrams, concurrency strategy, failure handling)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · TailwindCSS · Zustand · React Query · React Hot Toast |
| Backend | Node.js · Express · TypeScript · Zod validation |
| Database | PostgreSQL 15+ (row-level locking via `SELECT … FOR UPDATE`) |
| Queue | BullMQ · Redis (ioredis) |
| AI / LLM | Groq API (`llama-3.3-70b-versatile`) |
| Email | Nodemailer (Gmail SMTP with App Passwords) |
| Calendar | Google Calendar API v3 (OAuth 2.0) |

---

## Project Structure

```
healthcare-platform/
├── backend/
│   ├── src/
│   │   ├── app.ts                          # Express entry point, middleware stack, route mounting
│   │   ├── config/
│   │   │   ├── db.ts                       # PostgreSQL connection pool (pg)
│   │   │   ├── redis.ts                    # ioredis client with retry strategy
│   │   │   └── google.ts                   # Google OAuth2 client setup
│   │   ├── middleware/
│   │   │   ├── auth.ts                     # JWT verification → attaches req.user
│   │   │   ├── role.ts                     # Role-based access guard (requireRole)
│   │   │   ├── validate.ts                 # Zod schema validation middleware
│   │   │   └── errorHandler.ts             # Global error handler (AppError → JSON)
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts          # POST /register, POST /login, GET /me
│   │   │   │   ├── auth.controller.ts      # Register, login, getMe, Google callback
│   │   │   │   ├── auth.service.ts         # bcrypt hashing, JWT signing, credential check
│   │   │   │   └── auth.schema.ts          # Zod schemas for register/login payloads
│   │   │   ├── admin/
│   │   │   │   ├── admin.routes.ts         # All routes require authenticate + admin role
│   │   │   │   └── admin.controller.ts     # CRUD doctors, mark leave (+ cascading cancel)
│   │   │   ├── doctors/
│   │   │   │   ├── doctor.routes.ts        # Search, profile, slots (patient-facing)
│   │   │   │   └── doctor.controller.ts    # Search with ILIKE, lazy slot generation
│   │   │   ├── appointments/
│   │   │   │   ├── appointment.routes.ts   # Hold, book, list, cancel, post-visit notes
│   │   │   │   └── appointment.controller.ts # Core booking logic with FOR UPDATE
│   │   │   └── patients/                   # Reserved for future patient-specific logic
│   │   ├── services/
│   │   │   ├── llm.service.ts              # Pre/post-visit summaries via Groq
│   │   │   ├── email.service.ts            # Nodemailer transporter + HTML email templates
│   │   │   └── calendar.service.ts         # Google Calendar event create/delete
│   │   ├── jobs/
│   │   │   ├── queue.ts                    # BullMQ queue definitions (email, calendar, reminder)
│   │   │   ├── scheduler.ts               # Cron: medication reminders every 15 min
│   │   │   └── workers/
│   │   │       ├── emailWorker.ts          # Processes booking/cancellation/post-visit/reminder emails
│   │   │       ├── calendarWorker.ts       # Creates/deletes Google Calendar events
│   │   │       └── reminderWorker.ts       # Sets up + dispatches medication reminders
│   │   ├── utils/
│   │   │   ├── AppError.ts                 # Custom error class with statusCode
│   │   │   ├── asyncHandler.ts             # Wraps async controllers → catches to next()
│   │   │   └── slotGenerator.ts            # Generates time slots for a doctor on a given date
│   │   ├── types/
│   │   │   └── index.ts                    # Role, JwtPayload, global Express.Request augmentation
│   │   └── db/
│   │       ├── migrate.ts                  # Reads + executes SQL migration files
│   │       └── migrations/
│   │           └── 001_init.sql            # Full schema: users, doctors, slots, appointments, etc.
│   ├── .env.example                        # Template for all required environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                        # React entry: BrowserRouter, QueryClient, Toaster
│   │   ├── App.tsx                         # Route definitions (public, patient, doctor, admin)
│   │   ├── index.css                       # Tailwind imports
│   │   ├── api/
│   │   │   ├── axios.ts                    # Axios instance (baseURL /api, JWT interceptor)
│   │   │   ├── auth.ts                     # register, login, me
│   │   │   ├── admin.ts                    # createDoctor, getDoctors, markLeave, etc.
│   │   │   ├── doctors.ts                  # search, getProfile, getSlots
│   │   │   └── appointments.ts             # holdSlot, book, myAppointments, submitNotes, cancel
│   │   ├── store/
│   │   │   └── authStore.ts                # Zustand store with persist (token + user)
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.tsx              # Role-aware navigation bar with active state
│   │   │       ├── ProtectedRoute.tsx      # Redirects unauthenticated/wrong-role users
│   │   │       ├── UrgencyBadge.tsx        # Colour-coded urgency indicator (Low/Med/High)
│   │   │       └── Spinner.tsx             # Loading spinner component
│   │   └── pages/
│   │       ├── Landing.tsx                 # Public landing page
│   │       ├── auth/
│   │       │   ├── Login.tsx               # Login form → JWT → role-based redirect
│   │       │   └── Register.tsx            # Registration → auto-login → redirect
│   │       ├── patient/
│   │       │   ├── SearchDoctors.tsx        # Search by specialisation/name
│   │       │   ├── BookAppointment.tsx      # Date picker → slot picker → symptom form → book
│   │       │   └── MyAppointments.tsx       # List appointments with status + AI summaries
│   │       ├── doctor/
│   │       │   └── DoctorAppointments.tsx   # View appointments, pre-visit summary, post-visit form
│   │       └── admin/
│   │           └── ManageDoctors.tsx        # Doctor CRUD + leave management panel
│   ├── vite.config.ts                      # Dev proxy: /api → localhost:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── SYSTEM_DESIGN.md                        # Architecture doc with mermaid diagrams (≤800 words)
└── README.md                               # ← You are here
```

---

## Frontend Routing Map

`frontend/src/App.tsx` is the route ownership file for the React application. It keeps navigation intentionally simple: a small set of public pages, three role-specific protected areas, and a single fallback that redirects unknown paths back to authentication.

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing page for first-time visitors |
| `/login` | Public | Sign-in form |
| `/register` | Public | Account creation form |
| `/calendar-connected` | Public | OAuth success confirmation after Google Calendar linking |
| `/patient/search` | Patient only | Search doctors by name or specialisation |
| `/patient/book/:doctorId` | Patient only | Hold a slot and complete booking |
| `/patient/appointments` | Patient only | View upcoming and past appointments |
| `/doctor/appointments` | Doctor only | Review appointments and clinical summaries |
| `/admin/doctors` | Admin only | Manage doctors and leave scheduling |
| `*` | Fallback | Redirects to `/login` |

The protected routes are wrapped by `ProtectedRoute`, which handles authentication and role checks before rendering the page. This keeps authorization logic outside the page components and makes the route policy easy to audit in one place.

---

## Setup

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7 (local or Upstash)
- **Gmail App Password** (for SMTP — [how to generate](https://support.google.com/accounts/answer/185833))
- **Groq API key** (for AI summaries)

### 1. Clone & Install

```bash
git clone <repo-url>
cd healthcare-platform

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
cp backend/.env.example backend/.env
```

Fill every value in `backend/.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Random 256-bit hex string for signing tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default: `7d`) |
| `GROQ_API_KEY` | Groq API key for LLM summaries |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password (16-character) |
| `EMAIL_FROM` | `HealthCare Platform <your@gmail.com>` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/auth/google/callback` |
| `FRONTEND_URL` | `http://localhost:5173` (used for CORS) |

### 3. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE healthcare_db;"
psql -U postgres -c "CREATE USER healthcare_user WITH PASSWORD 'healthcare_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE healthcare_db TO healthcare_user;"

# Run migrations
cd backend && npm run migrate
```

### 4. Google Calendar OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Go to **Credentials** → Create **OAuth 2.0 Client ID** → Application type: **Web application**
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy Client ID and Client Secret into `backend/.env`
6. To connect a user's calendar, navigate to: `GET /api/auth/google/connect?userId=<user-id>`

### 5. Run

```bash
# Terminal 1 — Backend (with hot reload)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite dev server)
cd frontend && npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000`.

---

## Seed Credentials

The following test accounts are pre-seeded in the database:

| Role | Email | Password | Redirect after login |
|------|-------|----------|---------------------|
| Admin | `admin@healthcare.com` | `Admin@1234` | `/admin/doctors` |
| Patient | `rahul@patient.com` | `Patient@1234` | `/patient/search` |
| Patient | `ananya@patient.com` | `Patient@1234` | `/patient/search` |
| Patient | `vikram@patient.com` | `Patient@1234` | `/patient/search` |
| Doctor | `priya.sharma@healthcare.com` | `Doctor@1234` | `/doctor/appointments` |
| Doctor | `arjun.mehta@healthcare.com` | `Doctor@1234` | `/doctor/appointments` |
| Doctor | `sneha.patel@healthcare.com` | `Doctor@1234` | `/doctor/appointments` |
| Doctor | `rahul.verma@healthcare.com` | `Doctor@1234` | `/doctor/appointments` |
| Doctor | `kavitha.nair@healthcare.com` | `Doctor@1234` | `/doctor/appointments` |

### Seeded Doctors

| Name | Specialisation | Slot Duration |
|------|---------------|--------------|
| Dr. Priya Sharma | Cardiology | 30 min |
| Dr. Arjun Mehta | Neurology | 45 min |
| Dr. Sneha Patel | Dermatology | 20 min |
| Dr. Rahul Verma | Orthopedics | 30 min |
| Dr. Kavitha Nair | Pediatrics | 20 min |

---

## API Reference

All endpoints return JSON in the format:
```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "..."
}
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login, returns JWT + user object |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user |
| `GET` | `/api/auth/google/callback` | Public | Google OAuth2 callback handler |

**`POST /api/auth/register`**
```json
{
  "name": "Rahul Kumar",
  "email": "rahul@patient.com",
  "password": "Patient@1234",
  "role": "patient",
  "phone": "+919876543210"
}
```

**`POST /api/auth/login`** → Returns:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": "uuid", "name": "Rahul Kumar", "email": "...", "role": "patient" }
  }
}
```

---

### Admin (requires `admin` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/doctors` | Create a new doctor (user + doctor profile in transaction) |
| `GET` | `/api/admin/doctors` | List all doctors with user details |
| `PUT` | `/api/admin/doctors/:id` | Update doctor profile (specialisation, schedule, bio) |
| `POST` | `/api/admin/doctors/:id/leave` | Mark leave date → **cascading cancel** of affected appointments |
| `GET` | `/api/admin/doctors/:id/leaves` | Get all leave dates for a doctor |
| `DELETE` | `/api/admin/leaves/:leaveId` | Remove a leave record |

**`POST /api/admin/doctors/:id/leave`**
```json
{ "leave_date": "2026-07-15", "reason": "Personal leave" }
```
→ All confirmed appointments on that date are cancelled, patients are emailed, Google Calendar events are deleted.

---

### Doctors — Patient-facing (requires `patient` role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors/search?specialisation=&name=` | Search doctors (ILIKE fuzzy match) |
| `GET` | `/api/doctors/:id` | Get doctor profile |
| `GET` | `/api/doctors/:id/slots/:date` | Get available slots for a date (generates if missing) |

**Slot generation** is lazy: when a patient requests slots for a date, the system checks the doctor's work schedule (`work_start`, `work_end`, `slot_duration`, `work_days`) and bulk-inserts slots on demand using `ON CONFLICT DO NOTHING`.

---

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/appointments/slots/:slotId/hold` | Patient | Hold a slot for 10 minutes (uses `FOR UPDATE`) |
| `POST` | `/api/appointments` | Patient | Book appointment with symptoms → triggers LLM + email + calendar |
| `GET` | `/api/appointments/my` | Patient | List patient's appointments |
| `DELETE` | `/api/appointments/:id` | Patient | Cancel appointment → frees slot |
| `GET` | `/api/appointments/doctor` | Doctor | List doctor's appointments |
| `PUT` | `/api/appointments/:id/notes` | Doctor | Submit post-visit notes + prescription → triggers LLM + email + reminders |

**`POST /api/appointments`** (booking)
```json
{ "slot_id": "uuid", "symptoms": "Chest pain radiating to left arm for 2 days" }
```
→ Generates AI pre-visit summary → atomic booking with `FOR UPDATE` → queues email + calendar event.

**`PUT /api/appointments/:id/notes`** (post-visit)
```json
{
  "notes": "Patient presents with stable angina. ECG normal. Prescribed aspirin 75mg daily.",
  "prescription": [
    { "drug": "Aspirin", "dose": "75mg", "frequency": "Once daily" },
    { "drug": "Atorvastatin", "dose": "10mg", "frequency": "Once daily at bedtime" }
  ]
}
```
→ Generates patient-friendly summary via LLM → emails patient → sets up medication reminders.

---

## Database Schema

See [`backend/src/db/migrations/001_init.sql`](./backend/src/db/migrations/001_init.sql) for the full schema.

| Table | Purpose |
|-------|---------|
| `users` | All users (patient, doctor, admin) with bcrypt-hashed passwords |
| `doctors` | Doctor profiles linked to users (specialisation, schedule, bio) |
| `doctor_leaves` | Leave dates per doctor (unique constraint on doctor+date) |
| `slots` | Pre-generated time slots per doctor (status: available/held/booked/cancelled) |
| `appointments` | Bookings linking patients ↔ slots ↔ doctors, with AI summaries |
| `medication_reminders` | Per-drug reminders with `next_reminder` timestamp, driven by cron |
| `notification_log` | Audit trail for all email/calendar dispatches with retry status |

### Key Indexes
- `idx_slots_doctor_status` — fast slot lookup by doctor + status
- `idx_slots_start_time` — range queries on slot times
- `idx_appt_patient`, `idx_appt_doctor`, `idx_appt_status` — appointment lookups
- `idx_reminders_next` — partial index on active reminders due for dispatch

---

## Background Jobs (BullMQ)

Three named queues process asynchronous work:

| Queue | Job Names | Description |
|-------|-----------|-------------|
| `email` | `booking_confirmation`, `cancellation`, `post_visit_summary`, `medication_reminder` | All email dispatch (3 retries, exponential backoff) |
| `calendar` | `create_event`, `delete_event` | Google Calendar event management |
| `reminder` | `setup_reminders`, `send_due_reminders` | Medication reminder setup + 15-min cron dispatch |

All jobs are **decoupled** from the request lifecycle — a failed email never rolls back a valid booking.

---

## AI / LLM Integration

| Function | Trigger | Model | Fallback |
|----------|---------|-------|----------|
| Pre-visit summary | Patient submits symptoms at booking time | `llama-3.3-70b-versatile` | `{ urgency: "Medium", generated: false }` + generic questions |
| Post-visit summary | Doctor submits clinical notes | `llama-3.3-70b-versatile` | Raw notes shown to patient directly |

Both functions are wrapped in try/catch. **The system never breaks on LLM failure.** A `generated: false` flag lets the UI show a visible indicator when AI is unavailable.

---

## Security

| Mechanism | Implementation |
|-----------|---------------|
| Authentication | JWT (HS256) in `Authorization: Bearer <token>` header |
| Password hashing | bcrypt with 12 salt rounds |
| Role authorization | `requireRole()` middleware checks `req.user.role` before controller |
| Input validation | Zod schemas on all auth endpoints (extensible to all routes) |
| Rate limiting | 100 requests per 15 minutes per IP (`express-rate-limit`) |
| HTTP hardening | Helmet.js (CSP, HSTS, X-Content-Type-Options, etc.) |
| CORS | Restricted to `FRONTEND_URL` with credentials |
| Error handling | `AppError` for operational errors; unexpected errors don't leak stack traces in production |

---

## Middleware Pipeline

Every request passes through this chain:

```
Request → Helmet → CORS → Rate Limiter → JSON Parser
        → Route Matching
        → [authenticate] → JWT verify → attach req.user
        → [requireRole] → check user.role ∈ allowed roles
        → [validate] → Zod parse req.body
        → Controller
        → [errorHandler] → AppError → { status, message }
```

---

## NPM Scripts

### Backend (`backend/`)
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `ts-node-dev --respawn src/app.ts` | Development server with hot reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/app.js` | Production server |
| `migrate` | `ts-node src/db/migrate.ts` | Run SQL migrations |

### Frontend (`frontend/`)
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Dev server on port 5173 with HMR |
| `build` | `tsc && vite build` | Production build to `dist/` |

---

## Deployment

### Backend + Database + Redis → [Railway](https://railway.app)

1. Create a new Railway project
2. Add **PostgreSQL** and **Redis** services
3. Connect your GitHub repo → set root directory to `backend/`
4. Add all environment variables from `.env.example`
5. Set build command: `npm run build`
6. Set start command: `npm start`
7. Run migrations: `npm run migrate` (via Railway CLI or one-off command)

### Frontend → [Vercel](https://vercel.com)

1. Import the repo → set root directory to `frontend/`
2. Framework preset: **Vite**
3. Add environment variable: none needed (API calls use relative `/api` path)
4. Set up a rewrite rule in `vercel.json`:
```json
{
  "rewrites": [{ "source": "/api/:path*", "destination": "https://your-railway-backend.up.railway.app/api/:path*" }]
}
```

---

## License

MIT
