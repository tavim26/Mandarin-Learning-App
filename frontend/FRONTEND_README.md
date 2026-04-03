# MandarinApp — Frontend Documentation

## Project Overview

MandarinApp is a full-stack web-based Mandarin Chinese language learning platform, developed as a Bachelor's Degree academic project. The frontend is a React + TypeScript single-page application (SPA) that communicates exclusively with a microservices backend through an API Gateway at `http://localhost:8080`.

The platform supports **three user roles** with completely distinct interfaces:
- **STUDENT** — learns Mandarin through lessons, exercises, flashcards, AI chat, and text analysis
- **TEACHER** — manages course content (units, lessons, exercises, materials) and monitors student progress
- **ADMIN** — manages platform users and views platform-wide statistics

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool and dev server |
| Tailwind CSS | **v3 (pinned)** | Utility-first styling |
| shadcn/ui | 4.x (Radix/Nova preset) | Component library |
| react-router-dom | 7.x | Client-side routing |
| axios | 1.x | HTTP client |
| zustand | 5.x | Global state management |
| react-hook-form | 7.x | Form management |
| zod | 3.x | Schema validation |
| @hookform/resolvers | 3.x | Zod integration |
| framer-motion | 12.x | Animations (installed, partial use) |
| recharts | latest | Charts and data visualization |

### Critical Version Notes
- **Tailwind is pinned to v3** — v4 is incompatible with the shadcn Nova preset
- **shadcn preset: Radix/Nova** — `form.tsx` is missing from Nova, replaced by native HTML forms + react-hook-form
- **Node.js >= 22.12.0** required — Vite 8 does not support older versions
- **shadcn `select` component** has z-index overlay issues — replaced with clickable card buttons for role selection

---

## Project Directory Structure

```
D:\Mandarin-Learning-App\
├── frontend\                   ← React app (this project)
├── api-gateway\                ← Spring Cloud Gateway MVC (port 8080)
├── user-service\               ← Spring Boot (port 8082)
├── content-service\            ← Spring Boot (port 8081)
├── progress-service\           ← Spring Boot (port 8083)
├── chatbot-service\            ← Spring Boot (port 8084)
├── text-analysis-service\      ← FastAPI / Python (port 8085)
├── flashcard-service\          ← Spring Boot (port 8086)
└── docker-compose.yml
```

Frontend runs on **http://localhost:5173** and communicates exclusively with the API Gateway at **http://localhost:8080**.

---

## Source Structure

```
src/
├── api/
│   ├── client.ts               ← Axios instance with JWT interceptor
│   ├── authApi.ts              ← login, register
│   ├── usersApi.ts             ← CRUD users, profiles, password management
│   ├── progressApi.ts          ← XP, leaderboard, lesson progress, unit progress
│   ├── contentApi.ts           ← Units, lessons, exercises, materials
│   ├── flashcardApi.ts         ← Flashcard sets, cards, SM-2 reviews
│   ├── chatbotApi.ts           ← Chat sessions, messages
│   └── analysisApi.ts          ← Text analysis, OCR, stats, preview
├── components/
│   ├── AppLayout.tsx           ← Layout wrapper: Navbar + main content + ChatbotWidget
│   ├── Navbar.tsx              ← Global navigation bar (role-aware, XP badge for students)
│   ├── ChatbotWidget.tsx       ← Floating chat button + sidebar overlay (STUDENT only)
│   ├── ChineseText.tsx         ← Click-to-tooltip pinyin lookup for Chinese characters
│   ├── SpeakButton.tsx         ← TTS play/stop button component
│   ├── modals/
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── UnitModal.tsx
│   │   ├── LessonModal.tsx
│   │   ├── ExerciseModal.tsx
│   │   ├── MaterialModal.tsx
│   │   ├── EditUserModal.tsx
│   │   ├── CreateUserModal.tsx
│   │   └── ResetPasswordModal.tsx
│   └── ui/                     ← shadcn components (button, card, input, label)
├── hooks/
│   └── useTTS.ts               ← Text-to-Speech hook using browser SpeechSynthesis API
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx       ← Role router (redirects to role-specific dashboard)
│   ├── ProfilePage.tsx         ← Role router
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   └── AdminUsers.tsx
│   ├── teacher/
│   │   ├── TeacherDashboard.tsx
│   │   ├── TeacherUnitPage.tsx
│   │   └── TeacherLessonPage.tsx
│   ├── student/
│   │   ├── StudentDashboard.tsx
│   │   ├── StudentUnitsPage.tsx
│   │   ├── StudentUnitLessonsPage.tsx
│   │   ├── StudentLessonPage.tsx
│   │   ├── FlashcardsPage.tsx
│   │   └── AnalysisPage.tsx
│   └── profile/
│       ├── AdminProfile.tsx
│       ├── TeacherProfile.tsx
│       └── StudentProfile.tsx
├── router/
│   └── index.tsx               ← All routes + ProtectedRoute component
├── store/
│   └── authStore.ts            ← Zustand store with localStorage persistence
├── types/
│   └── auth.ts                 ← TypeScript interfaces matching backend DTOs
└── utils/                      ← (reserved)
```

---

## Authentication & Authorization

### Flow
1. User logs in via `POST /api/auth/login` → receives JWT token
2. Token stored in `authStore` (Zustand) → persisted in `localStorage` under key `auth-storage`
3. Axios interceptor in `client.ts` automatically attaches `Authorization: Bearer <token>` to every request
4. API Gateway validates JWT, injects `X-User-Id` and `X-User-Role` headers downstream

### Auth Store (`authStore.ts`)
```ts
{
  token: string | null
  userId: number | null
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | null
  fullName: string | null
  email: string | null        // NOTE: never populated from login response — known inconsistency
  isAuthenticated: boolean
}
```

### Route Protection
`ProtectedRoute` in `router/index.tsx`:
- Unauthenticated → redirect to `/login`
- Wrong role → redirect to `/dashboard`
- `DashboardPage` and `ProfilePage` are **role routers** — read role from store and redirect to the appropriate sub-page

---

## Routing Structure

### Public Routes
| Path | Component |
|---|---|
| `/login` | LoginPage |
| `/register` | RegisterPage |

### Authenticated Routes
| Path | Component | Roles |
|---|---|---|
| `/dashboard` | DashboardPage (router) | ALL |
| `/profile` | ProfilePage (router) | ALL |
| `/profile/student` | StudentProfile | STUDENT |
| `/profile/teacher` | TeacherProfile | TEACHER |
| `/profile/admin` | AdminProfile | ADMIN |

### Admin Routes
| Path | Component |
|---|---|
| `/admin/dashboard` | AdminDashboard |
| `/admin/users` | AdminUsers |

### Teacher Routes
| Path | Component |
|---|---|
| `/teacher/dashboard` | TeacherDashboard |
| `/teacher/units/:unitId` | TeacherUnitPage |
| `/teacher/lessons/:lessonId` | TeacherLessonPage |

### Student Routes
| Path | Component |
|---|---|
| `/student/dashboard` | StudentDashboard |
| `/lessons` | StudentUnitsPage |
| `/lessons/units/:unitId` | StudentUnitLessonsPage |
| `/lessons/:lessonId` | StudentLessonPage |
| `/flashcards` | FlashcardsPage |
| `/analysis` | AnalysisPage |

> **Note:** `/chatbot` is NOT a route — the chatbot is a floating widget accessible from all authenticated pages via a button in the bottom-right corner.

---

## Design System

### Color Palette
| Token | Value | Usage |
|---|---|---|
| Primary orange | `#e85d04` | Buttons, active states, accents, STUDENT role |
| Dark brown | `#0f0800` | Auth page left panel background |
| Panel gradient | `#1a0a00 → #3d1a00` | Chatbot sidebar background |
| Page background | `#f8f7f5` | All authenticated pages |
| Card background | `#ffffff` | Cards and modals |
| Error red | `#c1121f` | Destructive actions |
| Teacher blue | `#0369a1` | Teacher-specific accents |
| Student green | `#15803d` | Student-specific accents, completed states |

### HSK Level Colors (used in ChineseText and AnalysisPage)
| HSK | Color |
|---|---|
| 1 | `#15803d` |
| 2 | `#0369a1` |
| 3 | `#7c3aed` |
| 4 | `#c2410c` |
| 5 | `#b45309` |
| 6 | `#be123c` |

### Typography
- **Display font:** `Outfit` (weights: 300, 400, 500, 600, 700) — headings, titles, logo, numbers
- **Body font:** `DM Sans` (weights: 300, 400, 500) — all other text
- Loaded via Google Fonts in `index.html`

### Visual Style
- Card border-radius: `rounded-2xl` (16px)
- Card shadow: `0 4px 6px -1px rgba(0,0,0,0.07)`
- Modal shadow: `0 20px 60px rgba(0,0,0,0.15)`
- Page background: `#f8f7f5`
- Input fields: `h-11`, `rounded-xl`, `bg-gray-50`, orange focus ring
- Buttons: `rounded-xl`, orange background, `hover:opacity-90`

---

## Feature Implementation Details

### Admin Features

**AdminDashboard** (`/admin/dashboard`)
- Stats cards: Total Users, Students, Teachers, Admins
- XP Leaderboard (top students by XP) — Recharts BarChart
- Recent Users list
- Quick access to User Management

**AdminUsers** (`/admin/users`)
- Separate tables for Students and Teachers
- Search/filter by name or email
- CRUD operations via extracted modals:
  - `EditUserModal` — edit name, email, teacher title
  - `CreateUserModal` — create STUDENT or TEACHER with role selector cards
  - `ResetPasswordModal` — reset password without knowing current
  - `DeleteConfirmModal` — confirm deletion

---

### Teacher Features

**TeacherDashboard** (`/teacher/dashboard`)
- XP Leaderboard chart (Recharts BarChart) — top 10 students by XP
- Course Overview — quick list of units with navigation
- Full course units list with CRUD (via `UnitModal`, `DeleteConfirmModal`)
- Click on unit → navigates to `TeacherUnitPage`

**TeacherUnitPage** (`/teacher/units/:unitId`)
- Breadcrumb navigation
- Lessons list with CRUD (via `LessonModal`, `DeleteConfirmModal`)
- Each lesson shows XP reward badge
- Click on lesson → navigates to `TeacherLessonPage`

**TeacherLessonPage** (`/teacher/lessons/:lessonId`)
- Breadcrumb navigation
- **Student Progress section** — Recharts BarChart showing `completionPct` per student (lesson leaderboard)
- **Exercises section** — list with type badge, prompt, difficulty; CRUD via `ExerciseModal`
- **Materials section** — list with type badge, clickable URL; add/delete via `MaterialModal`

**ExerciseModal** (in `src/components/modals/ExerciseModal.tsx`)
Full type-aware form with separate UI per exercise type:
- `MULTIPLE_CHOICE` — dynamic options list with radio selector for correct answer (up to 6 options)
- `TRANSLATION` — dynamic list of accepted answer variants
- `FILL_BLANK` — dynamic list of correct answers; note: `contentData` key is `correctAnswers` (not `answers`)
- `MATCHING` — two-column key/value pair editor; `contentData` format: `{ pairs: [{ left, right }] }`

> **Critical:** `contentData` format must match exactly what `EvaluationService.java` in `progress-service` expects. FILL_BLANK uses `correctAnswers` key. MATCHING uses `pairs` array with `{ left, right }` objects.

---

### Student Features

**StudentDashboard** (`/student/dashboard`)
- Stats cards: Total XP, Level, Lessons Done, Cards Due
- XP progress bar toward next level (100 XP per level)
- "Continue Learning" section — in-progress lessons with progress bars
- "Flashcards Due Today" section — due counts per set
- Quick navigation shortcuts to all student features

**StudentUnitsPage** (`/lessons`)
- All course units with progress bars per unit
- Progress fetched in parallel via `Promise.allSettled` (individual failures don't break the page)
- Status badges: Completed / In Progress / (no badge if not started)

**StudentUnitLessonsPage** (`/lessons/units/:unitId`)
- Breadcrumb navigation
- Lessons list with status indicators:
  - Green background + ✓ icon = COMPLETED
  - Orange background + number = IN_PROGRESS
  - Gray background + number = NOT_STARTED
- Progress bars per lesson (only shown if started)
- XP reward badge per lesson

**StudentLessonPage** (`/lessons/:lessonId`)
- Breadcrumb navigation
- Lesson progress bar (updates after each exercise submission)
- Learning Materials section (clickable links)
- Exercise navigation: numbered pills (green=correct, red=attempted wrong, orange=current) + Previous/Next buttons
- Exercise UI per type (see below)
- Completion banner with XP reward when all exercises solved correctly
- Unlimited retry on wrong answers

**Exercise Types UI:**

| Type | UI |
|---|---|
| `MULTIPLE_CHOICE` | Lettered option buttons (A/B/C/D), click to select, Submit button |
| `TRANSLATION` | Text input field, Enter key submits |
| `FILL_BLANK` | Tile-based click-to-place UI (Duolingo-style) — tiles shown from `correctAnswers`, student clicks to place in blank |
| `MATCHING` | Two-column grid, click Chinese character then click translation to match; Reset button |

**`submittedAnswer` format sent to `POST /api/progress/attempts`:**
```json
MULTIPLE_CHOICE: { "selectedIndex": 2 }
TRANSLATION:     { "translation": "Eu sunt student." }
FILL_BLANK:      { "answers": ["是"] }
MATCHING:        { "matches": { "水": "apă", "火": "foc" } }
```

**ChineseText component** — used throughout StudentLessonPage:
- Detects Chinese characters via regex `[\u4e00-\u9fff\u3400-\u4dbf]+`
- Click on any Chinese segment → calls `POST /api/analysis/preview` (no DB persistence)
- Displays tooltip with: hanzi, pinyin, HSK level badge, TTS button
- In-memory cache per session — avoids duplicate API calls for same text

**SpeakButton component** — used alongside ChineseText:
- Uses browser native `SpeechSynthesis API` with `lang: 'zh-CN'`, `rate: 0.85`
- Play/Stop toggle
- Returns `null` if browser doesn't support TTS

**FlashcardsPage** (`/flashcards`)
- Single-page with 3 views managed by local state (`list` → `cards` → `review`)
- **List view:** grid of set cards with cardCount; create/delete sets
- **Cards view:** breadcrumb, stats bar (New/Learning/Mature/Due), cards list with add/delete; Review button (disabled if 0 due)
- **Review session:** SM-2 based review
  - Fetches due cards once at session start, iterates locally
  - FlipCard with CSS 3D transform animation (`perspective`, `rotateY`, `backfaceVisibility`)
  - Front face: Chinese character + TTS button + "Click to reveal" hint
  - Back face: pinyin/translation + TTS button (pronounces front text)
  - After flip: Again(0) / Hard(2) / Good(3) / Easy(5) quality buttons
  - Completion screen with summary (count per button type)

**AnalysisPage** (`/analysis`)
Three-tab layout:

*Tab: Analyze*
- Mode toggle: Text Input / Image OCR
- Language selector: RO / EN (affects translation)
- Text input: textarea
- OCR input: image upload with preview, drag-and-drop area
- Result display: `AnalysisResult` component with:
  - Ruby text (pinyin above characters, color-coded by HSK level)
  - "Play all" TTS button for full text
  - Click-to-tooltip per token (pinyin, translation, HSK badge, TTS, "Add to Flashcards" button)
  - "Add to Flashcards" opens `CreateFlashcardFromTokenModal` — auto-filled with hanzi + pinyin/translation; set selector from student's existing sets

*Tab: History*
- Paginated list (10 per page) of past analyses
- Filters: source type (MANUAL/OCR), HSK level, sort order (newest/oldest)
- Expandable rows — click to load and display full token analysis inline
- Delete with confirmation

*Tab: Statistics*
- Bar chart: token distribution by HSK level (color-coded per level)
- Donut chart: MANUAL vs OCR analyses split
- Progress bars: unique characters encountered per HSK level vs total in that level

**ChatbotWidget** (floating, not a route)
- Accessible on all authenticated pages for STUDENT role only
- Floating button: bottom-right corner, orange circle
- Click opens sidebar overlay (780px wide, dark brown left panel + white chat panel)
- Left panel: sessions list with title, last message preview, date; delete per session; new session button
- Right panel:
  - Empty state with "New Conversation" button
  - Chat view: chronological messages, student (orange bubbles right) vs AI (gray bubbles left)
  - Optimistic update: student message appears immediately before API responds
  - AI loading indicator: 3 animated bouncing dots
  - 503 error: error bar with Retry button
  - 409 (closed session): input disabled, "session closed" message
  - Sessions with `endedAt !== null` marked as "closed"

---

## API Layer

### `src/api/client.ts`
```ts
// Axios instance with baseURL: 'http://localhost:8080'
// Interceptor: reads token from useAuthStore.getState().token
// Attaches Authorization: Bearer <token> to every request
```

### API Files Summary

| File | Endpoints covered |
|---|---|
| `authApi.ts` | POST /api/auth/login, POST /api/auth/register |
| `usersApi.ts` | GET/POST/PUT/DELETE /api/users/*, /api/users/students/*, /api/users/teachers/* |
| `progressApi.ts` | GET /api/progress/students/*, /api/progress/lessons/*, /api/progress/units/*, POST /api/progress/attempts |
| `contentApi.ts` | GET/POST/PUT/DELETE /api/content/units/*, /api/content/lessons/*, /api/content/exercises/*, /api/content/materials/* |
| `flashcardApi.ts` | GET/POST/PUT/DELETE /api/flashcards/sets/*, /api/flashcards/cards/*, /api/flashcards/reviews/* |
| `chatbotApi.ts` | GET/POST/PATCH/DELETE /api/chatbot/sessions/*, /api/chatbot/sessions/:id/messages/* |
| `analysisApi.ts` | POST /api/analysis/text, POST /api/analysis/ocr, POST /api/analysis/preview, GET /api/analysis/student/:id, GET /api/analysis/:id, DELETE /api/analysis/:id, GET /api/analysis/student/:id/stats |

### `/api/analysis/preview` — Special Endpoint
- `POST /api/analysis/preview` with body `{ "text": "你好" }`
- Returns `{ tokens: [{ hanzi, pinyin, hsk_level, position_index }] }`
- **Does NOT persist to database** — used for inline dictionary lookups
- Accessible to STUDENT, TEACHER, ADMIN

---

## Custom Hooks

### `useTTS` (`src/hooks/useTTS.ts`)
```ts
const { speak, stop, isSpeaking, isSupported } = useTTS('zh-CN');
```
- Uses browser `SpeechSynthesis API`
- `rate: 0.85` for clearer Mandarin pronunciation
- Cancels previous utterance before starting new one
- `isSupported` — returns false on browsers without TTS
- Cleanup on unmount: `window.speechSynthesis.cancel()`

---

## Modal Architecture

All modals are extracted to `src/components/modals/` following Single Responsibility Principle.

| Modal | Used in | Purpose |
|---|---|---|
| `DeleteConfirmModal` | AdminUsers, TeacherDashboard, TeacherUnitPage, TeacherLessonPage, FlashcardsPage | Generic delete confirmation — reusable |
| `UnitModal` | TeacherDashboard | Create/edit course unit |
| `LessonModal` | TeacherUnitPage | Create/edit lesson |
| `ExerciseModal` | TeacherLessonPage | Create/edit exercise with type-aware UI |
| `MaterialModal` | TeacherLessonPage | Add lesson material |
| `EditUserModal` | AdminUsers | Edit user name, email, teacher title |
| `CreateUserModal` | AdminUsers | Create STUDENT or TEACHER |
| `ResetPasswordModal` | AdminUsers | Admin reset password |

---

## State Management

Only `authStore` uses Zustand (global auth state). All other state is local (`useState`) within components. There is no global state for content, progress, or other data — everything is fetched per component on mount.

### Known Inconsistency
`email` field in `authStore` is never populated from the login response (backend doesn't return it). It is only populated when a user updates their email from the profile page via `setAuth`.

---

## Code Conventions

- **Comments:** Romanian, without diacritics
- **Forms:** Native HTML `<form>` + react-hook-form + zod (shadcn `form.tsx` not available in Nova preset)
- **Role selection in forms:** Clickable card buttons (avoids shadcn `Select` z-index issues)
- **Sub-components:** Always defined outside parent component to prevent focus loss on re-render
- **Path alias:** `@/` maps to `src/` — configured in `tsconfig.app.json` and `vite.config.ts`
- **API calls:** Async/await throughout, try/catch in every component
- **Modals:** All extracted to `src/components/modals/`

---

## Architecture Gaps (Known, Intentional for Academic Scope)

1. **No custom hooks layer** — fetch logic is embedded directly in components; a `src/hooks/` layer (e.g., `useUnits`, `useLessons`) would improve separation of concerns
2. **No global HTTP error handling** — each component handles errors independently; a centralized Axios response interceptor (401 → auto-logout, 403 → redirect, 503 → global toast) would reduce duplication
3. **No global color constants** — color values like `#e85d04` are hardcoded inline throughout; should be extracted to `src/utils/constants.ts` or Tailwind config
4. **No loading skeleton screens** — loading states show "Loading..." text; skeleton screens would improve perceived performance
5. **Framer Motion installed but minimally used** — animations deferred until feature-complete

---

## Development Setup

```bash
cd D:\Mandarin-Learning-App\frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### Required Backend Services
| Service | Port | Required for |
|---|---|---|
| api-gateway | 8080 | All API calls |
| user-service | 8082 | Auth, user management |
| content-service | 8081 | Lessons, exercises, materials |
| progress-service | 8083 | XP, leaderboard, exercise attempts |
| chatbot-service | 8084 | AI chat widget |
| text-analysis-service | 8085 | Text analysis, OCR, pinyin preview |
| flashcard-service | 8086 | Flashcard sets, SM-2 reviews |

---

## Backend Authorization Notes for Frontend Developers

### Content Service CRUD Access
By default the `content-service` README shows CRUD endpoints as ADMIN-only. However, `AuthorizationFilter.java` in the API Gateway has been modified to allow TEACHER role full CRUD access to `/api/content/*`. The relevant ADMIN-only rules for content endpoints have been removed from `ADMIN_ONLY_ROUTES`.

### Chatbot Access
Chatbot endpoints are accessible to STUDENT and ADMIN only. TEACHER is explicitly blocked via `STUDENT_ONLY_PREFIXES` in `AuthorizationFilter.java` (which also blocks `/api/flashcards/` and `/api/analysis/`).

### Progress Service Leaderboard
`GET /api/progress/students/leaderboard` and `GET /api/progress/lessons/{lessonId}/leaderboard` are accessible to ALL roles including TEACHER — used in TeacherDashboard and TeacherLessonPage.