# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KardexChio is a warehouse inventory management system (Kardex) for tracking resources (supplies), equipment, entries, and exits. The codebase is in Spanish. It uses Docker Compose to orchestrate three services: PostgreSQL 16, a NestJS backend, and a Next.js frontend.

## Commands

### Full stack (Docker)
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose up -d --build  # Rebuild and start
```

### Backend (NestJS) — runs in `backend/`
```bash
npm run start:dev          # Dev server with watch (port 3001)
npm run build              # Compile to dist/
npm run lint               # ESLint with auto-fix
npm run format             # Prettier
npm run test               # Jest unit tests
npm run test:watch         # Jest in watch mode
npm run test:e2e           # E2E tests (jest-e2e.json config)
```

### Frontend (Next.js) — runs in `frontend/`
```bash
npm run dev                # Dev server (port 3000, exposed as 3010 via Docker)
npm run build              # Production build
npm run lint               # ESLint
```

### Database
The database initializes automatically from `database/init.sql` via Docker entrypoint. `database/migrate.py` is a Python script for data migration from the Excel source file.

## Architecture

### Backend (`backend/src/`)
NestJS 11 with TypeORM (PostgreSQL). `synchronize: false` — schema is managed by `database/init.sql`, not TypeORM auto-sync.

**Modules** (each follows NestJS convention: `module`, `controller`, `service`, `entity`, `dto/`):
- **auth** — JWT authentication via Passport. Login by `documento` (ID number). First-login flow forces profile completion.
- **usuarios** — User management. Roles: `ADMIN`, `ALMACENERO`, `SUPERVISOR` (enum `UserRole`). Role-based access via `@Roles()` decorator + `RolesGuard`.
- **categorias** — Resource categories (Ferreteria, Pintura, Electrico, etc.)
- **recursos** — Inventory items (supplies) with code, unit, min stock
- **entradas** — Incoming stock entries
- **salidas** — Outgoing stock exits
- **equipos** — Equipment tracking with state (`EN_ALMACEN`, `SALIDA`, `INGRESO`)
- **salida-equipos** — Equipment checkout records
- **movimientos** — Audit trail for all entries/exits
- **dashboard** — Summary statistics
- **reportes** — PDF/Excel report generation (pdfkit, exceljs)

Global API prefix: `/api`. CORS enabled for `localhost:3000` and `localhost:3010`. ValidationPipe with `whitelist` and `transform` enabled globally.

### Frontend (`frontend/src/`)
Next.js 16 (App Router) with React 19, Tailwind CSS 3, TypeScript.

- **`app/`** — Pages use App Router. Main layout at `app/dashboard/layout.tsx` with Sidebar + Header.
  - `/login` — Login page
  - `/primer-inicio` — First-login profile completion
  - `/dashboard/*` — Protected pages (inventario, entradas, salidas, equipos, salida-equipos, movimientos, reportes, usuarios)
- **`components/`** — Shared UI: `DataTable`, `Modal`, `Pagination`, `Sidebar`, `Header`, `StatusBadge`
- **`contexts/AuthContext.tsx`** — Auth state (JWT token + user in localStorage)
- **`lib/api.ts`** — Axios instance with auth interceptor (auto-attaches Bearer token, redirects to `/login` on 401)
- **`lib/swal.ts`** — SweetAlert2 config
- **`middleware.ts`** — Next.js middleware matching `/dashboard/*` routes (currently pass-through)

### Database
PostgreSQL 16. Key tables: `usuarios`, `categorias`, `recursos`, `entradas`, `salidas`, `equipos`, `salida_equipos`, `movimientos`. Uses `vista_inventario` view to compute current stock (entries - exits) and alert levels.

Default admin: documento `00000000`, password `00000000`.

## Ports
| Service    | Container port | Host port |
|------------|---------------|-----------|
| PostgreSQL | 5432          | 5433      |
| Backend    | 3001          | 3011      |
| Frontend   | 3000          | 3010      |

## Key Conventions
- All domain names, DTOs, and database columns use Spanish
- Form validation: backend uses `class-validator` DTOs, frontend uses `zod` + `react-hook-form`
- UUIDs for user IDs, serial integers for other entities
