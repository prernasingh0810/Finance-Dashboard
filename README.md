# Finance Dashboard — MERN Stack

A full-stack finance dashboard system built as part of a backend internship assignment. Users can sign in, view income/expense summaries, and manage financial records based on their role.

**Built by:** Prerna Singh Baghel

---

## Live Demo

> Add your deployed links here after deployment

- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-api.render.com`
- Health Check: `https://your-api.render.com/health`



## Screenshots

### Login
![Login](./docs/login.png)

### Dashboard
![Dashboard](./docs/dashboard.png)

### Records
![Records](./docs/records.png)

### User Management
![Users](./docs/users.png)
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Recharts, Plain CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

---

## Features

- JWT based authentication with secure token verification
- Role based access control — Viewer, Analyst, Admin
- Financial records management with full CRUD
- Soft delete — records are hidden not permanently removed
- Dashboard with income/expense totals, category breakdown, and trends
- Bar chart visualization of income vs expenses
- Filters on records — by type, category, and date range
- Pagination on records list
- CSV export of financial records
- User management — create users, assign roles, change status
- Rate limiting on auth and API routes
- Input validation with meaningful error messages
- Seed script for sample data

---

## Project Structure
```

finance-dashboard/
├── client/                   → React frontend (Vite)
│   └── src/
│       ├── pages/            → Login, Dashboard, Records, Users
│       ├── api.js            → Axios wrapper with JWT
│       └── App.jsx           → Layout + routing
│
├── server/                   → Express backend
│   └── src/
│       ├── config/           → MongoDB connection
│       ├── controllers/      → Business logic
│       ├── middleware/        → Auth, RBAC, validation, error handler
│       ├── models/           → User, FinancialRecord schemas
│       ├── routes/           → API route definitions
│       ├── services/         → Dashboard aggregation service
│       ├── utils/            → JWT helper
│       ├── validators/       → Input validation rules
│       └── scripts/seed.js   → Sample data seeder
│
└── README.md
```

Architecture

![Architecture Diagram](./docs/architecture.png)


```

Client (React)
│
│  HTTP / REST
▼
Express Server
│
├── Rate Limiter
├── CORS + Helmet
├── JWT Auth Middleware
├── RBAC Guard (role check)
│
├── /api/auth      → Auth controller
├── /api/records   → Record controller
├── /api/dashboard → Dashboard service
└── /api/users     → User controller
│
▼
MongoDB Atlas
(users + records collections)

```
---

## Role Permissions

| Role | Dashboard | View Records | Create / Edit / Delete | Manage Users |
|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Analyst | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

Role checks are enforced on the **server side** — the browser cannot bypass them.

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### Step 1 — Clone the repo
```bash
git clone https://github.com/your-username/finance-dashboard.git
cd finance-dashboard
```

### Step 2 — Set up environment variables
Copy the example file and fill in your values:
```bash
cp server/.env.example server/.env
```
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_dashboard
JWT_SECRET=any_long_random_string_min_16_chars
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### Step 3 — Install dependencies
```bash
npm install
npm run install:all
```

### Step 4 — Load sample data
```bash
npm run seed
```

Default admin credentials after seeding:

| Field | Value |
|---|---|
| Email | admin@example.com |
| Password | AdminPass123! |

### Step 5 — Run the app
```bash
npm run dev
```

- Frontend → http://localhost:5173
- Backend → http://localhost:5000
- Health check → http://localhost:5000/health

---

## API Reference

**Base URL:** `http://localhost:5000`

**Headers:**
Content-Type: application/json
Authorization: Bearer <token>

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register first user |
| POST | `/api/auth/login` | Public | Login, returns token |
| GET | `/api/auth/me` | All roles | Get current user |

### Financial Records
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/records` | Analyst + Admin | List with filters + pagination |
| GET | `/api/records/export` | Analyst + Admin | Download as CSV |
| GET | `/api/records/:id` | Analyst + Admin | Get single record |
| POST | `/api/records` | Admin | Create record |
| PATCH | `/api/records/:id` | Admin | Update record |
| DELETE | `/api/records/:id` | Admin | Soft delete |

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All roles | Totals, categories, trends |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Admin | Get single user |
| POST | `/api/users` | Admin | Create user |
| PATCH | `/api/users/:id` | Admin | Update role or status |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## Testing
```bash
npm run test
```

Runs automated checks including health check and auth tests.

You can also test manually using Postman:

1. `POST /api/auth/login` with `{ "email": "admin@example.com", "password": "AdminPass123!" }`
2. Copy the token from response
3. Add header `Authorization: Bearer <token>` to all subsequent requests
4. Try `GET /api/dashboard/summary` — should return totals
5. Try `GET /api/records` — should return paginated records

---

## Design Decisions

### Why MongoDB?
MongoDB's flexible document schema works well for financial records where fields like `notes` and `category` are variable. It also makes aggregation pipelines straightforward for dashboard analytics.

### Why JWT?
JWT is stateless — the server doesn't need to store sessions. Each token contains the user's ID and role, so middleware can verify identity and permissions in a single step without a database lookup.

### Why RBAC middleware?
Centralizing role checks in a dedicated `rbac.js` middleware means access rules are defined in one place. Adding a new protected route is a single line — `requireAdmin` or `requireAnalystOrAdmin`.

### Why soft delete?
Hard deleting records would make it impossible to audit past data or recover from mistakes. Soft delete sets a `deletedAt` timestamp — the record stays in the database but is excluded from all queries and totals.

### Why rate limiting?
Rate limiting on `/api/auth` prevents brute force password attacks. The auth routes are limited to 100 requests per 15 minutes, while other API routes allow 500 requests per 15 minutes.

### Why priority field on records?
Added a `priority` field (low / medium / high) to financial records to support better filtering and analytical thinking — for example, flagging high priority expenses for immediate attention.

---

## Assumptions

- First user registration creates a viewer by default — admin must be created via seed script
- JWT is stored in localStorage for this demo — production apps should use httpOnly cookies
- Soft delete is used instead of hard delete for audit and recovery purposes
- MongoDB Atlas free tier (M0) is sufficient for this demo
- CSV export returns all records matching current filters without pagination

---

## Edge Cases Handled

- Deleting a non-existing or already deleted record returns 404
- Duplicate email registration returns 409 with field name
- Invalid JWT returns 401 with clear message
- Expired JWT returns 401 with "session expired" message
- Viewer accessing records returns 403 with role explanation
- Empty dashboard returns zeros not errors
- Admin cannot delete their own account

---

## What I Would Improve With More Time

- Move all DB logic into a dedicated service layer (recordService.js)
- Add httpOnly cookie based auth instead of localStorage
- Add Swagger UI for interactive API documentation
- Add more comprehensive test coverage
- Add email notifications for large transactions
- Add date range filter on dashboard summary

---

## Deployment

### Backend (Render)
1. Connect GitHub repo to Render
2. Set Root Directory to `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
6. Run `npm run seed` once against the same Atlas DB

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set Root Directory to `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_BASE_URL=https://your-api.render.com`

