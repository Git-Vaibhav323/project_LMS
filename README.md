# Faculty LMS

A production-quality full-stack web app that lets faculty members register, log in, and
upload, organize, search, and manage their teaching content (lecture notes, assignments,
research papers, syllabi, and more) with optional file attachments.

**Stack**

| Layer     | Tech                                                             |
|-----------|-------------------------------------------------------------------|
| Frontend  | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui      |
| Backend   | Node.js, Express.js, TypeScript                                   |
| Database  | PostgreSQL + Prisma ORM                                           |
| Auth      | JWT (faculty-only role), bcrypt password hashing                  |
| Storage   | Local disk uploads via Multer                                     |

---

## 1. Project Structure

```
faculty-cms/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Faculty & Content models
│   │   └── seed.ts            # Sample faculty + content
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # Express routers
│   │   ├── middlewares/       # auth, upload, validation, errors
│   │   ├── services/          # Business logic (Prisma calls live here)
│   │   ├── validators/        # Zod schemas
│   │   ├── utils/             # jwt, prisma client, responses, AppError
│   │   ├── types/             # Shared TS types
│   │   ├── app.ts             # Express app config
│   │   └── server.ts          # Entry point
│   ├── uploads/                # Uploaded files land here
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── (auth)/login, register
│   │   └── (protected)/dashboard, content, content/new, content/[id], content/[id]/edit
│   ├── components/            # UI primitives + feature components
│   ├── context/                # AuthProvider
│   ├── hooks/                  # useContentList, useDebounce
│   ├── services/                # API client + auth/content services
│   ├── lib/                     # types, constants, utils
│   ├── middleware.ts            # Route protection
│   └── Dockerfile
└── docker-compose.yml
```

---

## 2. Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (or use the provided Docker Compose setup)
- Docker & Docker Compose (optional, for the containerized workflow)

---

## 3. Quick Start (Local, without Docker)

### 3.1 Database

Create a PostgreSQL database (or use an existing instance):

```sql
CREATE DATABASE faculty_cms;
```

### 3.2 Backend

```bash
cd backend
cp .env.example .env
# edit .env and set DATABASE_URL, JWT_SECRET, etc.

npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                          # optional: sample faculty + content
npm run dev                           # starts API on http://localhost:5000
```

Sample faculty account created by the seed script:

```
Email:    faculty@university.edu
Password: Password123!
```

### 3.3 Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL should point to your backend, e.g. http://localhost:5000

npm install
npm run dev                           # starts app on http://localhost:3000
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

---

## 4. Quick Start (Docker Compose)

From the project root:

```bash
docker compose up --build
```

This starts Postgres, the backend (port 5000), and the frontend (port 3000). On first run,
apply migrations and (optionally) seed data inside the backend container:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

Then open `http://localhost:3000`.

> **Note:** `docker-compose.yml` ships with a placeholder `JWT_SECRET`. Change it before
> deploying anywhere real.

---

## 5. Environment Variables

**backend/.env**

| Variable            | Description                                   | Example                                                      |
|---------------------|------------------------------------------------|---------------------------------------------------------------|
| `PORT`              | API port                                       | `5000`                                                        |
| `NODE_ENV`          | Environment                                    | `development`                                                 |
| `DATABASE_URL`      | Postgres connection string                     | `postgresql://postgres:postgres@localhost:5432/faculty_cms`   |
| `JWT_SECRET`        | Secret used to sign JWTs                       | a long random string                                          |
| `JWT_EXPIRES_IN`    | Token lifetime                                 | `7d`                                                           |
| `CLIENT_ORIGIN`     | Allowed CORS origin                            | `http://localhost:3000`                                       |
| `UPLOAD_DIR`        | Folder for uploaded files                      | `uploads`                                                      |


**frontend/.env.local**

| Variable              | Description         | Example                 |
|------------------------|----------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend base URL     | `http://localhost:5000` |

---

## 6. API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint                     | Auth | Description                              |
|--------|-------------------------------|------|-------------------------------------------|
| POST   | `/auth/register`              | No   | Create a faculty account                  |
| POST   | `/auth/login`                 | No   | Log in, returns JWT                       |
| POST   | `/auth/logout`                | Yes  | Stateless logout (client discards token)  |
| GET    | `/auth/me`                    | Yes  | Current faculty profile                   |
| GET    | `/content`                    | Yes  | List content (search/filter/sort/paginate)|
| POST   | `/content`                    | Yes  | Create content (multipart, field: `file`) |
| GET    | `/content/:id`                | Yes  | Get one content item                      |
| PUT    | `/content/:id`                | Yes  | Update content / replace file             |
| DELETE | `/content/:id`                | Yes  | Delete content + its file                 |
| GET    | `/content/dashboard/summary`  | Yes  | Total count + 5 most recent uploads       |

Query params for `GET /content`: `search`, `category`, `sort` (`newest`/`oldest`), `page`, `limit`.

Every response follows the same envelope:

```json
{ "success": true, "message": "...", "data": { ... }, "meta": { ... } }
{ "success": false, "message": "...", "errors": [ { "field": "email", "message": "..." } ] }
```

---

## 7. Design Notes

- **Auth:** JWT is stored in a (non-HttpOnly) cookie on the client so both `middleware.ts`
  (route protection) and the API client (Bearer header) can read it. For a production
  deployment behind HTTPS, consider moving to an HttpOnly cookie issued by the backend with
  a small server-side proxy, or a refresh-token rotation scheme.
- **File storage:** Files are stored on local disk under `backend/uploads` and served via
  `express.static`. Swap this for S3/Cloud Storage in production — the service layer
  (`content.service.ts`) is the only place that would need to change.
- **Validation:** All input is validated with Zod on the backend (source of truth) and
  mirrored on the frontend for immediate feedback.
- **Ownership:** Every content record is scoped to the faculty that created it; the service
  layer enforces this on every read/update/delete.

---

## 8. Scripts Reference

**backend/package.json**
- `npm run dev` – start API with hot reload
- `npm run build` / `npm start` – compile & run production build
- `npm run prisma:migrate` – create/apply a migration
- `npm run prisma:studio` – open Prisma Studio (DB GUI)
- `npm run seed` – seed sample faculty + content

**frontend/package.json**
- `npm run dev` – start Next.js dev server
- `npm run build` / `npm start` – production build & serve
- `npm run lint` – run ESLint

---

## 9. Troubleshooting

- **"JWT_SECRET is not defined"** — copy `.env.example` to `.env` in `backend/` and set a value.
- **CORS errors** — make sure `CLIENT_ORIGIN` in the backend `.env` matches the frontend URL.
- **Prisma client errors after cloning** — run `npx prisma generate` inside `backend/`
  (also runs automatically via the `postinstall` script on `npm install`).
- **Uploaded files 404** — confirm the backend is running and `NEXT_PUBLIC_API_URL` points to it;
  files are served from `<API_URL>/uploads/<filename>`.
