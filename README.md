# 9T-Angle Operations Workspace

A full-stack employee task, target, reporting, attendance, eBay operations and performance management platform built for **9T-Angle**. All dashboard figures and charts are calculated from MongoDB records through the REST API—there are no frontend-only statistics or fake API responses.

## What is included

- **Secure access:** HTTP-only JWT session cookie, bearer-token support, bcrypt password hashing, forgot/reset password, profile and password management, disabled-account handling, rate limiting, Helmet and role-based API authorization.
- **Admin/manager workspace:** live agency dashboard, employee administration, task assignment, daily/weekly/monthly targets, report review, attendance correction, weighted performance, analytics and exports.
- **Employee workspace:** private dashboard, assigned tasks, validated progress updates, targets, daily reports with evidence, check-in/out, performance, notifications and profile management.
- **Daily reporting:** drafts, submission, approval, rejection/correction, manager feedback, Cloudinary evidence upload and approved-report locking.
- **Performance engine:** live task completion, target achievement, on-time completion, attendance and report-submission metrics. Weights are stored in `Settings` and must total 100%.
- **eBay operations:** linked product research, listing and order records. Operations can link back to accountable tasks.
- **Automation:** overdue detection, deadline alerts, missed-target notices and missing-report reminders via the backend scheduler.
- **Reporting:** CSV, native XLSX and PDF exports for daily, weekly, monthly, employee, task, target, attendance and performance data.
- **Responsive SaaS UI:** role-aware collapsible sidebar, mobile navigation, dialogs, tables, cards, charts, skeletons, empty/error states, toasts and accessible status labels.

## Stack

| Layer | Technology |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn-style Radix components, React Hook Form, Zod, Recharts, Sonner |
| API | Node.js, Express 5, TypeScript, REST, JWT, bcrypt, Zod |
| Data | MongoDB, Mongoose |
| Optional integrations | Cloudinary uploads, Nodemailer SMTP |
| Exports | CSV, OOXML/XLSX, PDFKit |

## Repository structure

```text
frontend/
  src/app/                 Next.js App Router pages
  src/components/          UI, layout and feature forms
  src/lib/                 Typed API client, types and helpers
backend/
  src/config/              Environment, MongoDB and Cloudinary
  src/controllers/         HTTP controllers
  src/middlewares/         Authentication, RBAC, upload and errors
  src/models/              15 validated Mongoose models
  src/routes/              Version-ready REST route modules
  src/services/            Business logic, scoring, exports and jobs
  src/validators/          Zod request contracts
  src/scripts/seed.ts      Development-only realistic seed
```

The principal request path is:

```text
Next.js UI → /api proxy → Express route → validation/RBAC → controller
→ service/business rules → Mongoose/MongoDB → standardized response → UI
```

## Local setup

### Requirements

- Node.js 20.9+ (Node 22 recommended)
- npm 10+
- MongoDB 7+ locally, in Docker, or MongoDB Atlas

### 1. Install

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

At minimum, set a strong `JWT_SECRET` and a real `MONGODB_URI` in `backend/.env`.

### 2. Start MongoDB

Use an existing MongoDB server, or start only the included Docker service:

```bash
docker compose up -d mongo
```

The default local URI is `mongodb://127.0.0.1:27017/9t-angle`.

### 3. Seed development data

```bash
npm run seed
```

Development seed credentials:

| Account | Email | Password |
| --- | --- | --- |
| Administrator | `admin@9tangle.com` | `Angle@2026` |
| Employee | `ahmed@9tangle.com` | `Angle@2026` |

The seed script refuses to run when `NODE_ENV=production`. Change seeded passwords immediately in any shared environment.

### 4. Run the application

```bash
npm run dev
```

- Web: <http://localhost:3000>
- API: <http://localhost:5000>
- Health: <http://localhost:5000/health>

The browser uses relative `/api` requests. Next.js proxies those requests to `API_PROXY_TARGET`, so browser code never relies on `localhost` for a separate backend service in hosted previews.

## Environment

### Backend (`backend/.env`)

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/9t-angle
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=7d
JWT_COOKIE_DAYS=7
FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=9T-Angle <noreply@9tangle.com>
```

Without Cloudinary credentials, normal reports and task updates still work; evidence upload returns a clear `503` rather than storing files insecurely. Without SMTP, reset links are logged only in development and never exposed by the API.

### Frontend (`frontend/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=http://localhost:5000
```

## Core REST API

All protected endpoints enforce authorization on the API, not just in the sidebar.

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/change-password
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token

GET/POST          /api/employees
GET/PUT/DELETE    /api/employees/:id
PATCH             /api/employees/:id/status

GET/POST          /api/tasks
GET/PUT/DELETE    /api/tasks/:id
PATCH             /api/tasks/:id/progress

GET/POST          /api/targets
PUT/DELETE        /api/targets/:id

GET/POST          /api/reports/daily
GET/PUT/DELETE    /api/reports/daily/:id
PATCH             /api/reports/daily/:id/review
POST              /api/reports/upload
GET               /api/reports/export?type=tasks&format=xlsx

GET               /api/attendance
POST              /api/attendance/check-in
POST              /api/attendance/check-out
PUT               /api/attendance/record

GET               /api/performance
GET               /api/performance/:employeeId
POST              /api/performance/weekly/generate
GET               /api/analytics
GET               /api/dashboard

GET/POST/PUT/DELETE /api/operations/:type
GET/PATCH           /api/notifications
GET/PUT              /api/references/settings
```

Every JSON response uses `{ success, message, data, meta? }`; errors use `{ success: false, message, details? }` with appropriate HTTP status codes.

## Important business rules

- Employees can query only their own tasks, reports, targets, attendance and performance.
- Employees can update only tasks assigned to them.
- Negative progress is rejected. Progress above target requires an explicit administrator override.
- Approved daily reports are immutable for employees.
- Existing employee history prevents destructive deletion; disable the account instead.
- Due tasks are marked overdue from persisted dates, not frontend timers.
- Target completion is updated when linked task progress changes.
- Performance calculations read live task, target, attendance and report records and persist snapshots.
- `leave` counts as an authorized attendance day; late and half-day records contribute proportionally.

## Quality checks

```bash
npm run typecheck       # strict backend and frontend TypeScript
npm run build           # production API and Next.js builds
npm test                # deterministic unit and validation tests
npm run test:integration -w backend
npm audit --omit=dev
```

The integration suite uses `mongodb-memory-server` and exercises login, protected routes, RBAC ownership, progress limits, report locking and attendance. Its first run downloads a MongoDB test binary; in restricted/offline CI, provide `MONGOMS_SYSTEM_BINARY` or run it against a job with download access.

## Production deployment notes

1. Use MongoDB Atlas or a replicated MongoDB deployment with backups and TLS.
2. Set `NODE_ENV=production`, a unique 32+ character JWT secret and exact `FRONTEND_URL`.
3. Configure HTTPS at the load balancer; secure cookies are enabled in production.
4. Configure Cloudinary and SMTP if evidence and password-reset email are required.
5. Run `npm run build`, then `npm run start -w backend` and `npm run start -w frontend`.
6. Run scheduled jobs in one API instance only if horizontally scaling, or move `runScheduledJobs` to a dedicated worker/queue.
7. Add organization-specific retention, backup and employee privacy policies before processing live personal data.

## License

See [LICENSE](LICENSE).
