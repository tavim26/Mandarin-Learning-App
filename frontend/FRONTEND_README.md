# AI_CONTEXT.md - Mandarin Learning App (Frontend)

## 1. Project Overview & Mission
This is the frontend of a comprehensive Mandarin Chinese learning platform. It communicates with a backend architecture consisting of an API Gateway and 6 distinct microservices (User, Content, Progress, Flashcard, Analysis, Chatbot).

Your mission is to write, refactor, or debug React code for this project strictly adhering to the established architectural guardrails. DO NOT invent new patterns, DO NOT bypass the API Gateway, and ALWAYS rely on the existing global state and HTTP client configurations.

## 2. Tech Stack
* **Framework:** React 18+ with TypeScript (bootstrapped via Vite).
* **Routing:** React Router v6 (`react-router-dom`).
* **Styling:** Tailwind CSS (configured with CSS variables) + `shadcn/ui` for base components.
* **State Management:** Zustand (specifically `authStore` for JWT and session persistence).
* **Data Fetching:** Axios (configured with a custom instance and interceptors).
* **Forms & Validation:** React Hook Form + Zod.
* **Charts:** Recharts.

## 3. Elaborated Directory & File Structure
This project follows a strict feature-based separation of concerns.

```text
src/
├── api/                  # Axios client & API call definitions (grouped by domain)
│   ├── client.ts         # CORE: Axios instance with JWT auto-interceptor. ALL requests use this.
│   ├── authApi.ts        # POST /api/auth/login, POST /api/auth/register
│   ├── analysisApi.ts    # OCR, Text Analysis, preview tokens
│   ├── chatbotApi.ts     # Gemini AI tutor sessions and messages
│   ├── contentApi.ts     # Units, Lessons, Exercises, Materials
│   ├── flashcardApi.ts   # SM-2 sets, cards, reviews
│   ├── progressApi.ts    # XP, Leaderboards, Exercise attempts
│   └── usersApi.ts       # Admin/Profile mutations
│
├── components/           # Reusable UI Components
│   ├── modals/           # Pop-ups managed by local state in parent components
│   │   ├── CreateUserModal.tsx, EditUserModal.tsx
│   │   ├── ExerciseModal.tsx, LessonModal.tsx, MaterialModal.tsx, UnitModal.tsx
│   │   └── DeleteConfirmModal.tsx, ResetPasswordModal.tsx
│   ├── ui/               # Base UI elements (mostly shadcn/ui: Button, Input, Select)
│   ├── AppLayout.tsx     # Global wrapper (contains Navbar and ChatbotWidget)
│   ├── Navbar.tsx        # Role-based navigation and XP indicator
│   ├── ChatbotWidget.tsx # Floating AI tutor widget (uses useChatSession hook)
│   ├── ChineseText.tsx   # Hanzi rendering with hover tooltips/pinyin (uses previewCache)
│   └── SpeakButton.tsx   # Global Text-To-Speech button (uses useTTS hook)
│
├── config/               # Global constants
│   └── constants.ts      # API_BASE_URL (http://localhost:8080)
│
├── hooks/                # Custom React hooks (The "Brain" of the frontend)
│   ├── useAnalysis.ts    # OCR & NLP state, pagination, stats
│   ├── useChatSession.ts # Gemini chatbot logic with OPTIMISTIC UPDATES
│   ├── useContent.ts     # CRUD for units, lessons, exercises
│   ├── useFlashcards.ts  # SM-2 card management
│   ├── useReviewSession.ts # SM-2 active review loop (0-5 quality grading)
│   ├── useProgress.ts    # Leaderboards, XP, student tracking
│   ├── useUsers.ts       # Admin panel user management
│   └── useTTS.ts         # Browser Speech Synthesis API wrapper
│
├── pages/                # Route components, grouped by role access
│   ├── admin/            # AdminDashboard.tsx, AdminUsers.tsx
│   ├── profile/          # StudentProfile.tsx, TeacherProfile.tsx, AdminProfile.tsx
│   ├── student/          # StudentDashboard.tsx, StudentLessonPage.tsx, FlashcardsPage.tsx, AnalysisPage.tsx
│   ├── teacher/          # TeacherDashboard.tsx, TeacherUnitPage.tsx, TeacherLessonPage.tsx
│   └── LoginPage.tsx, RegisterPage.tsx, DashboardPage.tsx
│
├── router/               
│   └── index.tsx         # Route definitions and `<ProtectedRoute allowedRoles={[...]}>` logic
│
├── store/                
│   └── authStore.ts      # Zustand store (persisted). Holds JWT token, userId, role, fullName.
│
├── styles/               
│   ├── tokens.ts         # SSOT for colors (hskColors, sm2Colors, brand). Mapped in tailwind.config
│   └── index.css         # Global CSS variables and Tailwind imports
│
└── types/                # Global TypeScript definitions & DTOs (Mirroring backend models)
    ├── analysis.ts       # TextAnalysisDto, AnalysisTokenDto, SourceType
    ├── auth.ts           # Role ('STUDENT' | 'TEACHER' | 'ADMIN'), AuthUser
    ├── chatbot.ts        # ChatSessionDto, ChatMessageDto
    ├── content.ts        # CourseUnitDto, LessonDto, polymorphic ExerciseContentData
    ├── flashcard.ts      # FlashcardDto, FlashcardProgressDto, ReviewQuality
    └── user.ts           # UserDto, StudentProfileDto, TeacherProfileDto



4. Immutable Architectural Rules (Guardrails)
Rule 1: API Communication MUST go through the Gateway
All backend requests must be directed to http://localhost:8080 (the API Gateway).

Never attempt to connect directly to individual microservices (e.g., ports 8081-8086).

Implementation: ALWAYS import and use apiClient from @/api/client for requests. Do NOT use native fetch or a raw Axios instance. The apiClient already has an interceptor that automatically attaches the Authorization: Bearer <token> header from Zustand.

Rule 2: Role-Based Access Control (RBAC)
The system has three roles: STUDENT, TEACHER, ADMIN.

Routes must be protected using the <ProtectedRoute allowedRoles={['...']}> component in router/index.tsx.

The API Gateway enforces strict access. If an API call fails with 403 Forbidden, check the JWT role or the ownership rules (e.g., Teachers cannot access student progress, users can only access their own profile).

Rule 3: Visual Design & Styling
Do NOT use inline styles with hardcoded hex colors (e.g., style={{ background: '#e85d04' }}).

Use Tailwind utility classes extended in tailwind.config.js via src/styles/tokens.ts.

Key Custom Classes:

Primary/Brand: bg-brand, text-brand (Orange).

Role Accents: text-teacher (Blue), text-student (Green).

HSK Levels: text-hsk-1 to text-hsk-6, bg-hsk-1 to bg-hsk-6.

SM-2 Categories: bg-sm2-due, text-sm2-learning.

Maintain the UI aesthetic: heavy use of rounded corners (rounded-xl, rounded-2xl), subtle shadows (shadow-card, shadow-form), and clean typography (font-display for headings, font-sans for body).

Rule 4: Data Fetching Pattern (Hooks)
Do not write useEffect fetching logic directly inside .tsx UI components.

All data fetching, mutations, and loading/error state management must be encapsulated within custom hooks inside the src/hooks/ directory.

UI Components should strictly consume these hooks and handle only presentation logic.

5. Domain-Specific Complexities to Remember
Content Domain (Exercises)
The contentData field in ExerciseDto is polymorphic. Its shape depends strictly on ExerciseType:

MULTIPLE_CHOICE -> { options: string[], correctIndex: number }

TRANSLATION -> { acceptedAnswers: string[] }

FILL_BLANK -> { correctAnswers: string[] } (DO NOT USE answers)

MATCHING -> { pairs: { left: string, right: string }[] }

Forms editing this data must dynamically build and validate the correct structure using the types defined in types/content.ts.

Flashcard Domain (SM-2 Algorithm)
Never attempt to recalculate the Spaced Repetition (SM-2) dates on the frontend.

The review flow: Fetch due cards (getDueCards) -> User grades card (Quality 0-5) -> Send POST /api/flashcards/reviews via submitReview. The backend flashcard-service handles all interval/easiness calculations.

Chatbot Domain (AI Tutor)
Use Optimistic Updates for the chat UI.

When a user sends a message, immediately append it to the local state, then await the API response. If the API fails (e.g., 503 from Gemini, 409 Closed Session), rollback the state. Refer to useChatSession.ts for the correct implementation.

Text Analysis Domain
Chinese text tokens must be mapped correctly. Pay attention to PreviewTokenDto which contains hanzi, pinyin, translation, and hsk_level.

OCR requests (analyzeOcr) MUST use FormData with the 'multipart/form-data' header to send image files.