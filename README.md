# MedNxt Hospitals Replica — Full-Stack Application

Phase 0: Foundation, Database, Backend Architecture & Seed Data

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Axios, Lucide React
- **Backend**: Node.js, Express.js, TypeScript, JWT, bcryptjs, Zod
- **Database**: PostgreSQL, Prisma ORM (31 relational models)

---

## Local Development Setup

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mednxt?schema=public"
JWT_SECRET="mednxt_super_secret_jwt_key_2026_dev_only"
JWT_EXPIRES_IN="1d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 2. Local PostgreSQL Startup
Start local PostgreSQL service on port `5432` and ensure database `mednxt` exists:
```powershell
.\pgsql\bin\pg_ctl.exe -D .\pgsql\data start
```

### 3. Database Migration & Seed
Run Prisma migration and topological seeding:
```bash
npm run db:migrate
npm run db:seed
```

To reset and re-seed the database at any time:
```bash
npm run db:reset
```

### 4. Running Application
Start both server and client concurrently:
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend API runs on: `http://localhost:5000/api`

---

## Development Seed Credentials

All seed user accounts share the development password: `MedNxt@123`

| Role | Email |
| :--- | :--- |
| **DOCTOR** | `dr.rohan.sharma@mednxt.demo` |
| **LAB TECHNICIAN** | `anita.rao@mednxt.demo` |
| **PATHOLOGIST** | `kiran.das@mednxt.demo` |
| **PHARMACIST** | `arun.kumar@mednxt.demo` |
| **NURSE** | `priya.nair@mednxt.demo` |
| **ADMIN** | `admin@mednxt.demo` |

*Note: These credentials are strictly for local development and demonstration purposes.*
