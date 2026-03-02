# Asset Management System

Full-stack asset management with JWT auth, role-based access, ticket workflow, and email notifications.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Nodemailer
- **Frontend:** Vite, React, React Router, Axios, Context API

## Roles

- **USER:** Raise new/repair/return requests, confirm receipt
- **MANAGER:** Approve/reject pending tickets
- **ITTEAM:** View approved tickets, mark as delivered 
- **SUPERADMIN:** Assign roles (promote to MANAGER/ITTEAM) only

## Setup

### Backend

```bash
cd server
npm install
# Set MONGO_URI (MongoDB Atlas connection string), JWT_SECRET in .env (see .env.example)
# For email: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
npm run dev
```

Create first SuperAdmin:
```bash
npm run seed
# Login: admin@example.com / admin123
```

Seed users and assets (10 users, 50 assets):
```bash
npm run seed:data
# Users: admin@example.com (admin123), alice@example.com (password123), etc.
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend proxies `/api` to `http://localhost:5000`.

**Login page image:** Place `LoginPageImg.png` in `client/public/assets/` for it to appear on the login page.

## API Overview

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (auth required)
- `GET /api/users` - List users (MANAGER/ITTEAM/SUPERADMIN)
- `PATCH /api/users/:id/role` - Update role (SUPERADMIN only)
- `GET/POST /api/assets` - List/create assets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket (USER)
- `POST /api/tickets/:id/approve` - Approve (MANAGER)
- `POST /api/tickets/:id/reject` - Reject (MANAGER)
- `POST /api/tickets/:id/deliver` - Mark delivered (ITTEAM)
- `POST /api/tickets/:id/confirm` - Confirm receipt (USER)
