# RetailStock — Just-in-Time Inventory Financing Platform

**FAST University Islamabad | CS3010 Web Engineering | FinTech Semester 6**

> Full-stack MERN application providing Shariah-compliant Murabaha financing for Pakistan's 2 million Kirana stores.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Git

---

## ⚙️ Backend Setup

### 1. Navigate to backend
```bash
cd retailstock/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```

### 4. Edit `.env` — set your MongoDB URI and secrets
```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/retailstock
JWT_SECRET=change_this_to_a_long_random_secret_string_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_long_random_secret_string_for_refresh
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 5. Seed the database with demo data
```bash
npm run seed
```
This creates:
- **Admin**: `admin@retailstock.pk` / `Admin@123`
- **User 1**: `ahmed@kirana.pk` / `User@123`
- **User 2**: `fatima@store.pk` / `User@123`
- **User 3**: `zaid@mini.pk` / `User@123`
- Default categories

### 6. Start the backend
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

## 🎨 Frontend Setup

### 1. Open new terminal, navigate to frontend
```bash
cd retailstock/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
cp .env.example .env
```

`.env` content (default — works with local backend):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the frontend
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Demo Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@retailstock.pk     | Admin@123  |
| User  | ahmed@kirana.pk          | User@123   |
| User  | fatima@store.pk          | User@123   |

---

## 📁 Project Structure

```
retailstock/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── controllers/  # Business logic (auth, wallet, financing, etc.)
│   │   ├── middlewares/  # auth, role, validation, error, rate-limit
│   │   ├── models/       # Mongoose schemas (User, Wallet, Transaction, etc.)
│   │   ├── routes/       # Express route definitions
│   │   ├── utils/        # helpers, murabahaCalculator, suspiciousRules, seed
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Server entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/   # Reusable UI components
    │   │   └── layout/   # Sidebar, AppLayout, TopBar
    │   ├── context/      # AuthContext (JWT state)
    │   ├── pages/
    │   │   ├── auth/     # Login, Register
    │   │   ├── user/     # Dashboard, Wallet, Transactions, Expenses, Budgets, Reports, Notifications, Profile
    │   │   ├── financing/# FinancingList, FinancingApply, Repayment
    │   │   ├── admin/    # AdminDashboard, Users, Wallets, Transactions, Flagged, Financing, Categories, Audit
    │   │   ├── Landing.jsx
    │   │   └── NotFound.jsx
    │   ├── routes/       # ProtectedRoute, AdminRoute, GuestRoute
    │   ├── services/     # api.js (axios + interceptors), apiServices.js
    │   ├── styles/       # global.css (cool-toned dark theme)
    │   └── utils/        # helpers (formatters, badge utils)
    ├── public/index.html
    └── package.json
```

---

## 🌐 Deployment

### Backend — Render / Railway / Fly.io

1. Push backend to GitHub
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `node src/server.js`
5. Add environment variables from `.env.example`
6. Set `FRONTEND_URL` to your deployed frontend URL
7. Deploy — note your backend URL (e.g. `https://retailstock-api.onrender.com`)

### Frontend — Vercel / Netlify

1. Push frontend to GitHub
2. Import in Vercel/Netlify
3. Set environment variable: `REACT_APP_API_URL=https://your-backend-url/api`
4. Deploy

### MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Add database user
3. Whitelist `0.0.0.0/0` (allow all IPs) for deployment
4. Copy connection string to `MONGODB_URI`

---

## ✅ API Test Credentials (Postman)

**Base URL**: `http://localhost:5000/api`

**Login to get token:**
```
POST /api/auth/login
{ "email": "ahmed@kirana.pk", "password": "User@123" }
```

**Use token in headers:**
```
Authorization: Bearer <token>
```

---

## 🔒 Security Features
- bcrypt (cost 12) password hashing
- JWT access tokens (15min) + refresh tokens (7 days)
- Backend role-based authorization (admin routes protected)
- Owner-based resource checks (users can't access others' data)
- 7 suspicious transaction rules (backend-only)
- Rate limiting: 100 req/min general, 10 req/min auth
- Helmet.js security headers
- CORS restricted to frontend URL
- Secrets stored in environment variables only

## 💡 Key Architecture Decisions
- **All financial logic in backend** — wallet balance, Murabaha calculation, credit limit validation never happen on frontend
- **Murabaha markup calculated server-side** — frontend only displays, never computes
- **Suspicious rules run before every transaction response**
- **Atomic credit updates** on financing approval and repayment

---

## 📝 Group Members
- Sumyyah Saeed — 23I-5567
- Amnah Asrar — 23I-5550
- Huda Imran — 23I-5544
- Fatima Tu Zahra — 23I-5546

**Course Instructor**: Arsalan Khan  
**Course**: CS3010 Web Engineering | FAST University Islamabad | FinTech Semester 6
