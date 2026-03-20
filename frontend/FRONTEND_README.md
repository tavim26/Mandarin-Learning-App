# MandarinApp — Frontend Documentation

## Project Overview

MandarinApp is a web-based Mandarin Chinese language learning platform built as a Bachelor's Degree academic project. The frontend is a React + TypeScript single-page application that communicates exclusively with a microservices backend through an API Gateway.

The platform supports three user roles with distinct interfaces: **Student**, **Teacher**, and **Admin**.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool and dev server |
| Tailwind CSS | **v3** (pinned) | Utility-first styling |
| shadcn/ui | 4.x (Radix/Nova preset) | Component library |
| react-router-dom | 7.x | Client-side routing |
| axios | 1.x | HTTP client |
| zustand | 5.x | Global state management |
| react-hook-form | 7.x | Form management |
| zod | 3.x | Schema validation |
| @hookform/resolvers | 3.x | Zod integration for forms |
| framer-motion | 12.x | Animations (installed, partial use) |

### Critical Version Notes
- **Tailwind is pinned to v3** — v4 is incompatible with the shadcn Nova preset
- **shadcn preset: Radix/Nova** — not all shadcn components are available in Nova; `form.tsx` is missing, replaced by native HTML forms + react-hook-form
- **Node.js >= 22.12.0** required — Vite 8 does not support older versions
- **`select` component** from shadcn has z-index overlay issues in this setup — replaced with clickable card buttons for role selection

---

## Project Directory

```
D:\Mandarin-Learning-App\
├── frontend\               ← React app (this project)
├── api-gateway\            ← Spring Cloud Gateway MVC (port 8080)
├── user-service\           ← Spring Boot (port 8082)
├── content-service\        ← Spring Boot (port 8081)
├── progress-service\       ← Spring Boot (port 8083)
├── chatbot-service\        ← Spring Boot (port 8084)
├── text-analysis-service\  ← FastAPI / Python (port 8085)
├── flashcard-service\      ← Spring Boot (port 8086)
└── docker-compose.yml
```

The frontend runs on **http://localhost:5173** and communicates exclusively with the API Gateway at **http://localhost:8080**.

---

## Source Structure

```
src/
├── api/
│   ├── client.ts           ← Axios instance with JWT interceptor
│   ├── authApi.ts          ← login, register
│   ├── usersApi.ts         ← CRUD users, profiles, password management
│   └── progressApi.ts      ← XP leaderboard, student progress
├── components/
│   ├── AppLayout.tsx       ← Layout wrapper: Navbar + main content
│   ├── Navbar.tsx          ← Global navigation bar (role-aware)
│   └── ui/                 ← shadcn components (button, card, input, label)
├── hooks/                  ← (empty, reserved for custom hooks)
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx   ← Role router (redirects to role-specific dashboard)
│   ├── ProfilePage.tsx     ← Role router (redirects to role-specific profile)
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   └── AdminUsers.tsx
│   ├── student/
│   │   └── StudentDashboard.tsx   ← placeholder
│   ├── teacher/
│   │   └── TeacherDashboard.tsx   ← placeholder
│   └── profile/
│       ├── AdminProfile.tsx
│       ├── TeacherProfile.tsx
│       └── StudentProfile.tsx
├── router/
│   └── index.tsx           ← All routes + ProtectedRoute component
├── store/
│   └── authStore.ts        ← Zustand store with localStorage persistence
├── types/
│   └── auth.ts             ← TypeScript interfaces matching backend DTOs
└── utils/                  ← (empty, reserved)
```

---

## Authentication & Authorization

### Flow
1. User logs in via `POST /api/auth/login` → receives JWT token
2. Token stored in `authStore` (Zustand) → persisted in `localStorage` under key `auth-storage`
3. Axios interceptor in `client.ts` automatically attaches `Authorization: Bearer <token>` to every request
4. API Gateway validates JWT, injects `X-User-Id` and `X-User-Role` headers downstream

### Auth Store (`authStore.ts`)
Persists the following fields in localStorage:
```ts
{
  token: string | null
  userId: number | null
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | null
  fullName: string | null
  email: string | null
  isAuthenticated: boolean
}
```

### Route Protection
`ProtectedRoute` component in `router/index.tsx`:
- Unauthenticated users → redirect to `/login`
- Wrong role → redirect to `/dashboard`
- `DashboardPage` and `ProfilePage` act as **role routers** — they read the role from store and redirect to the appropriate sub-page

---

## Routing Structure

| Path | Component | Access |
|---|---|---|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage (router) | Authenticated |
| `/student/dashboard` | StudentDashboard | STUDENT only |
| `/teacher/dashboard` | TeacherDashboard | TEACHER only |
| `/admin/dashboard` | AdminDashboard | ADMIN only |
| `/admin/users` | AdminUsers | ADMIN only |
| `/profile` | ProfilePage (router) | Authenticated |
| `/profile/student` | StudentProfile | STUDENT only |
| `/profile/teacher` | TeacherProfile | TEACHER only |
| `/profile/admin` | AdminProfile | ADMIN only |

### Pages still to be implemented (placeholders exist)
- `/lessons` — content-service integration
- `/flashcards` — flashcard-service integration
- `/chatbot` — chatbot-service integration
- `/analysis` — text-analysis-service integration

---

## Design System

### Color Palette
| Token | Value | Usage |
|---|---|---|
| Primary orange | `#e85d04` | Buttons, active states, accents |
| Dark brown | `#0f0800` | Auth page left panel background |
| Panel gradient | `#1a0a00 → #3d1a00` | Decorative panels |
| Page background | `#f8f7f5` | All authenticated pages |
| Card background | `#ffffff` | Cards and modals |
| Error red | `#c1121f` | Destructive actions |
| Teacher blue | `#0369a1` | Teacher-specific accents |
| Student green | `#15803d` | Student-specific accents |

### Typography
- **Display font:** `Outfit` (weights: 300, 400, 500, 600, 700) — headings, titles, logo
- **Body font:** `DM Sans` (weights: 300, 400, 500) — all other text
- Loaded via Google Fonts in `index.html`

### Visual Style
- Card border-radius: `rounded-2xl` (16px)
- Card shadow: `0 4px 6px -1px rgba(0,0,0,0.07)`
- Modal shadow: `0 20px 60px rgba(0,0,0,0.15)`
- Form card shadow: `0 20px 60px rgba(0,0,0,0.08)`
- Auth pages: two-column layout — decorative dark left panel + white form right panel
- Input fields: `h-11`, `rounded-xl`, `bg-gray-50`, orange focus ring via `index.css`
- Buttons: `rounded-xl`, orange background, `hover:opacity-90`

### Auth Page Left Panel
Abstract geometric design — dark brown background with:
- Diagonal line texture (repeating-linear-gradient at 45deg, orange, 5% opacity)
- Radial gradient blobs (brown tones)
- Concentric ring outlines (orange, low opacity)
- Rotated square outline
- Small orange accent dots
- Staggered text: LEARN / PRACTICE / MASTER (very low opacity)
- No cultural references, no Chinese characters

---

## Key Patterns & Conventions

### Comments
All code comments are in **Romanian, without diacritics**.

### Forms
- shadcn `form.tsx` is **not available** in Nova preset
- Pattern: native HTML `<form>` + `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Role selection uses **clickable card buttons** instead of `<Select>` (avoids z-index glitches)

### API Calls
- All HTTP calls go through `src/api/client.ts` (Axios instance baseURL: `http://localhost:8080`)
- Each microservice has its own API file in `src/api/`
- Async/await pattern throughout

### State Management
- Only `authStore` uses Zustand (global auth state)
- All other state is local (`useState`) within components

### Component Architecture
- Never define sub-components inside parent components — causes focus loss on re-render
- Extract reusable sub-components above parent or into separate files
- Pass callbacks as props

### Path Aliases
`@/` maps to `src/` — configured in both `tsconfig.app.json` and `vite.config.ts`

---

## Completed Features

### Authentication
- [x] Login page with validation
- [x] Register page (STUDENT / TEACHER / ADMIN roles)
- [x] JWT persistence across sessions
- [x] Auto-logout on clearAuth
- [x] Protected routes per role

### Admin
- [x] Admin Dashboard (stats: total users, students, teachers, admins; XP leaderboard; recent users)
- [x] User Management (`/admin/users`) — separate tables for Students and Teachers
  - [x] Create user (STUDENT or TEACHER)
  - [x] Edit user (name, email, title for teachers)
  - [x] Delete user with confirmation modal
  - [x] Reset password (admin sets new password without knowing old one)
  - [x] Search/filter by name or email
- [x] Admin Profile — edit name, email, change password

### Teacher
- [x] Teacher Profile — edit name, email, title, change password

### Student
- [x] Student Profile — edit name, email, nickname, change password

### Navigation
- [x] Role-aware Navbar with active link highlighting
- [x] Avatar + name clickable → navigates to profile
- [x] AppLayout wrapper (Navbar + page content)

---

## Pending Features

| Feature | Routes | Services |
|---|---|---|
| Student Dashboard | `/student/dashboard` | progress-service |
| Teacher Dashboard | `/teacher/dashboard` | content-service |
| Lessons & Exercises | `/lessons`, `/lessons/:id` | content-service |
| Flashcards | `/flashcards` | flashcard-service |
| AI Chatbot | `/chatbot` | chatbot-service |
| Text Analysis | `/analysis` | text-analysis-service |

---

## Backend API Reference

All requests go through `http://localhost:8080` (API Gateway).

### Auth (public)
```
POST /api/auth/register   → { email, password, fullName, role }
POST /api/auth/login      → { email, password } → { token, userId, role, fullName }
```

### Users (ADMIN or own)
```
GET    /api/users                              → UserDto[]
GET    /api/users/students                     → StudentProfileDto[]
GET    /api/users/teachers                     → TeacherProfileDto[]
POST   /api/users                              → create user (ADMIN)
DELETE /api/users/{id}                         → 204
PUT    /api/users/{id}/name?newName=           → UserDto
PUT    /api/users/{id}/email?newEmail=         → UserDto
PUT    /api/users/{id}/password?oldPassword=&newPassword=  → 204
PUT    /api/users/{id}/password/reset?newPassword=         → 204 (ADMIN)
GET    /api/users/students/{userId}            → StudentProfileDto
PUT    /api/users/students/{userId}/nickname?newNickname=  → StudentDto
GET    /api/users/teachers/{userId}            → TeacherProfileDto
PUT    /api/users/teachers/{userId}/title?newTitle=        → TeacherDto
```

### Progress
```
GET /api/progress/students/admin/all     → StudentReplicaDto[] (ADMIN)
GET /api/progress/students/leaderboard   → StudentReplicaDto[] (all roles)
```

### DTOs
```ts
UserDto:            { id, fullName, role }
StudentProfileDto:  { userId, fullName, role, nickname, email }
TeacherProfileDto:  { userId, fullName, role, title, email }
StudentReplicaDto:  { studentId, xpTotal, level }
LoginResponse:      { token, userId, role, fullName }
RegisterResponse:   { userId, role, fullName }
```

---

## Known Issues & Workarounds

| Issue | Workaround Applied |
|---|---|
| Tailwind v4 incompatible with Nova preset | Pinned to Tailwind v3 |
| shadcn `form.tsx` missing in Nova | Native HTML form + react-hook-form directly |
| shadcn `Select` z-index overlay glitch | Card button alternatives |
| Defining sub-components inside parent causes input focus loss | Sub-components defined outside parent, callbacks passed as props |
| React StrictMode doubles useEffect calls in dev | Expected behavior, disappears in production build |
| Gateway routing prefix `spring.cloud.gateway.routes` | Must use `spring.cloud.gateway.server.webmvc.routes` for MVC blocking mode |
| JWT secret decoded differently in user-service vs gateway | Both now use `Decoders.BASE64.decode()` |

---

## Development Setup

```bash
# Navigate to frontend directory
cd D:\Mandarin-Learning-App\frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App runs at http://localhost:5173
```

### Required backend services to run
| Service | Port | Required for |
|---|---|---|
| api-gateway | 8080 | All API calls |
| user-service | 8082 | Auth, user management |
| content-service | 8081 | Lessons (+ required by progress-service) |
| progress-service | 8083 | XP, leaderboard |
| chatbot-service | 8084 | AI chat (not yet implemented in frontend) |
| text-analysis-service | 8085 | OCR/NLP (not yet implemented in frontend) |
| flashcard-service | 8086 | Flashcards (not yet implemented in frontend) |