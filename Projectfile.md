# ExamNurture — Project Documentation
### Backend & Database Integration Reference

> **Purpose of this file:** Everything a backend engineer needs to build the Node.js API server and connect it to this Next.js frontend. All data models, API contracts, business rules, and integration points are defined here.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Current Data Layer (Static → Replace with DB)](#4-current-data-layer)
5. [Database Schema](#5-database-schema)
6. [API Contract — All Endpoints](#6-api-contract)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Business Logic & Rules](#8-business-logic--rules)
9. [Subscription & Payment](#9-subscription--payment)
10. [Environment Variables](#10-environment-variables)
11. [File Structure](#11-file-structure)
12. [Integration Checklist](#12-integration-checklist)

---

## 1. Project Overview

**ExamNurture** is an Indian government competitive exam preparation platform.

| Attribute | Value |
|---|---|
| Product | Online exam prep — mock tests, PYQs, guides |
| Target Users | Students preparing for JPSC, Banking (SBI PO/IBPS PO), SSC CGL, Railway NTPC, Police SI, Army, UET and similar exams |
| Subscription Model | 3 tiers based on **educational qualification** (not exam selection) — cumulative |
| Geography | India (INR pricing, Razorpay payments, Hindi + English content) |
| Scale Target | ~50,000 MAU at launch, ~5 lakh registered users by Year 1 |

---

## 2. Tech Stack

### Frontend (Existing — Do Not Change)
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animations | Framer Motion |
| Fonts | Inter, Sora (headings), JetBrains Mono (scores) |
| Theme | Light + Dark mode via `next-themes` (class strategy) |
| State | React `useState` / `useEffect` (no external state library) |

### Backend (To Build)
| Layer | Recommended Technology |
|---|---|
| Runtime | Node.js 20+ LTS |
| Framework | Express.js or Fastify |
| Language | TypeScript |
| Database | PostgreSQL (primary) + Redis (sessions/cache) |
| ORM | Prisma |
| Auth | JWT (access token 15 min) + Refresh token (7 days, httpOnly cookie) |
| File Storage | AWS S3 / Cloudflare R2 (for PDF papers, images) |
| Payments | Razorpay |
| Email | Resend or AWS SES |
| API Style | REST (JSON) — versioned at `/api/v1/` |

---

## 3. Frontend Architecture

### Route Map
```
app/
├── (auth)/
│   ├── login/          → POST /api/v1/auth/login
│   └── register/       → POST /api/v1/auth/register
│
├── (app)/              → All pages require authenticated session
│   ├── dashboard/      → GET /api/v1/user/dashboard
│   ├── tests/          → GET /api/v1/test-series
│   ├── pyq/            → GET /api/v1/pyq
│   ├── guides/         → GET /api/v1/guides
│   ├── plans/          → GET /api/v1/tiers
│   ├── analytics/      → GET /api/v1/user/analytics
│   ├── schedule/       → GET /api/v1/user/schedule
│   ├── library/        → GET /api/v1/library
│   └── profile/        → GET /api/v1/user/profile
│
├── exam/[id]/          → GET /api/v1/exams/:id/start
└── results/[id]/       → GET /api/v1/attempts/:id/result
```

### Existing Frontend API Routes (Stub → Replace)
```
/api/exams              → Currently reads from lib/data/examData.ts (static)
/api/tiers              → Currently reads from lib/data/examData.ts (static)
```
**Migration path:** Replace `lib/data/examData.ts` imports with `fetch()` calls to your backend. The TypeScript types in `examData.ts` are the DTO contract — keep them identical.

---

## 4. Current Data Layer

### `lib/data/examData.ts` — Source of Truth (Static, Replace with DB)

All TypeScript types below define the exact shape your API **must** return.

#### Type: `TierLevel`
```typescript
type TierLevel = 1 | 2 | 3;
```

#### Type: `Exam`
```typescript
type Exam = {
  id: string;             // "jpsc-prelims-2025"
  boardId: string;        // "state-psc"
  name: string;           // "JPSC Prelims 2025"
  shortName: string;      // "Prelims"
  tier: TierLevel;        // 1 | 2 | 3 — minimum tier required to access
  eligibility: string;    // "Graduation"
  pattern: string;        // "100 Qs · 2 hrs · Paper I"
  subjects: string[];     // ["General Knowledge", "Reasoning"]
  hasTests: boolean;
  hasPYQ: boolean;
  hasGuide: boolean;
  upcomingDate?: string;  // "Jun 2025"
  daysLeft?: number;      // computed from exam date
};
```

#### Type: `ExamBoard`
```typescript
type ExamBoard = {
  id: string;             // "state-psc"
  name: string;           // "State PSC (JPSC / BPSC / UPPSC)"
  shortName: string;      // "State PSC"
  tint: string;           // CSS color string e.g. "var(--violet)" or "#8B5CF6"
  colorSoft: string;      // CSS soft bg e.g. "var(--violet-soft)"
  description: string;    // one-liner
  minTier: TierLevel;     // lowest tier containing any exam in this board
  exams: Exam[];
};
```

#### Type: `Tier`
```typescript
type Tier = {
  id: TierLevel;          // 1 | 2 | 3
  name: string;           // "Tier 2"
  badge: string;          // "12th Pass"
  qualification: string;  // "Passed Class XII (Intermediate)"
  tagline: string;        // "Compete for the best 12th-pass posts"
  description: string;    // paragraph explaining the tier
  monthlyPrice: number;   // INR — e.g. 249
  yearlyPrice: number;    // INR total per year — e.g. 1699
  highlight: boolean;     // true = "Most Popular" badge (Tier 2 only)
  color: string;          // e.g. "#2563EB"
  colorSoft: string;      // e.g. "#EFF6FF"
  perks: string[];        // feature bullet list
  exclusiveBoardIds: string[];  // boards ONLY in this tier (not lower)
  allBoardIds: string[];        // all boards cumulative (this + lower tiers)
};
```

### Exam Boards in the System (11 total)

| Board ID | Short Name | Min Tier | Exams |
|---|---|---|---|
| `railway-group-d` | Railway Gr D | 1 | RRB Group D 2025 |
| `ssc-lower` | SSC MTS | 1 | SSC MTS 2025, SSC Hawaldar 2025 |
| `police-constable` | Constable | 1 | JH Constable, UP Constable |
| `defence` | Army/NDA | 1 | Army GD, RPF Constable |
| `ssc-upper` | SSC Upper | 2 | SSC CGL, SSC CHSL, SSC CPO |
| `railway-ntpc` | Railway NTPC | 2 | NTPC Graduate, NTPC 12th Pass |
| `banking-clerk` | Bank Clerk | 2 | IBPS Clerk, SBI Clerk |
| `police-si` | Police SI | 2 | UP SI, Bihar SI, JH SI |
| `state-psc` | State PSC | 3 | JPSC Prelims, JPSC Mains, BPSC Prelims |
| `banking-po` | Banking PO | 3 | IBPS PO, SBI PO, RBI Grade B |
| `uet` | UET | 3 | UET Jharkhand |

### Subscription Tiers

| Tier | Badge | Monthly | Yearly | Highlight | Boards Exclusive |
|---|---|---|---|---|---|
| 1 | 10th Pass | ₹149 | ₹999 | No | railway-group-d, ssc-lower, police-constable, defence |
| 2 | 12th Pass | ₹249 | ₹1,699 | **Yes (Most Popular)** | ssc-upper, railway-ntpc, banking-clerk, police-si |
| 3 | Graduation | ₹349 | ₹2,499 | No | state-psc, banking-po, uet |

> **Cumulative rule:** Tier 3 users get ALL boards (11 total). Tier 2 users get T1+T2 boards (8 total). Tier 1 users get only T1 boards (4 total).

---

## 5. Database Schema

### PostgreSQL — Prisma Schema

```prisma
// ─── Users & Auth ───────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  avatarUrl    String?
  role         Role     @default(STUDENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subscription  Subscription?
  attempts      Attempt[]
  streaks       Streak[]
  bookmarks     Bookmark[]
  scheduleItems  ScheduleItem[]
}

enum Role {
  STUDENT
  ADMIN
  MODERATOR
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ─── Subscriptions ──────────────────────────────────────

model Subscription {
  id            String           @id @default(cuid())
  userId        String           @unique
  user          User             @relation(fields: [userId], references: [id])
  tierId        Int              // 1 | 2 | 3
  billingCycle  BillingCycle     // MONTHLY | YEARLY
  status        SubscriptionStatus @default(ACTIVE)
  startedAt     DateTime
  expiresAt     DateTime
  razorpaySubId String?          // Razorpay subscription ID
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  payments Payment[]
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  TRIAL
}

model Payment {
  id              String      @id @default(cuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  razorpayOrderId String      @unique
  razorpayPayId   String?     @unique
  amount          Int         // paise (₹249 = 24900)
  currency        String      @default("INR")
  status          PaymentStatus
  paidAt          DateTime?
  createdAt       DateTime    @default(now())
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

// ─── Exam Content ────────────────────────────────────────

model Board {
  id          String   @id    // "state-psc"
  name        String
  shortName   String
  tint        String          // CSS color
  colorSoft   String
  description String
  minTier     Int             // 1 | 2 | 3
  exams       Exam[]
}

model Exam {
  id           String   @id   // "jpsc-prelims-2025"
  boardId      String
  board        Board    @relation(fields: [boardId], references: [id])
  name         String
  shortName    String
  tier         Int             // 1 | 2 | 3
  eligibility  String
  pattern      String
  subjects     String[]
  hasTests     Boolean  @default(false)
  hasPYQ       Boolean  @default(false)
  hasGuide     Boolean  @default(false)
  upcomingDate String?
  examDate     DateTime?       // for computing daysLeft
  isActive     Boolean  @default(true)

  testSeries   TestSeries[]
  pyqPapers    PYQPaper[]
  guideContent GuideContent?
}

// ─── Test Series ─────────────────────────────────────────

model TestSeries {
  id          String   @id @default(cuid())
  examId      String
  exam        Exam     @relation(fields: [examId], references: [id])
  title       String
  subtitle    String
  category    TestCategory
  totalTests  Int
  duration    String          // "2 hrs each"
  difficulty  Difficulty      @default(MEDIUM)
  isEnrolled  Boolean  @default(false)  // computed per user
  rating      Float    @default(4.5)
  studentsCount Int    @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  tests       Test[]
  enrollments TestEnrollment[]
}

enum TestCategory {
  FULL_MOCK
  CHAPTER_TEST
  SUBJECT_TEST
  PYQ_BASED
  TOPIC_DRILL
}

model Test {
  id           String   @id @default(cuid())
  seriesId     String
  series       TestSeries @relation(fields: [seriesId], references: [id])
  title        String
  orderIndex   Int
  totalQuestions Int
  duration     Int          // seconds
  difficulty   Difficulty
  isActive     Boolean  @default(true)

  questions    TestQuestion[]
  attempts     Attempt[]
}

model Question {
  id          String   @id @default(cuid())
  subject     String
  text        String
  options     String[]       // 4 options
  correctIndex Int           // 0-3
  explanation String
  difficulty  Difficulty
  tags        String[]
  examIds     String[]       // which exams this question belongs to
  createdAt   DateTime @default(now())

  testQuestions TestQuestion[]
  pyqQuestions  PYQQuestion[]
}

model TestQuestion {
  id         String   @id @default(cuid())
  testId     String
  test       Test     @relation(fields: [testId], references: [id])
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
  orderIndex Int

  @@unique([testId, questionId])
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

// ─── PYQ Papers ──────────────────────────────────────────

model PYQPaper {
  id          String   @id @default(cuid())
  examId      String
  exam        Exam     @relation(fields: [examId], references: [id])
  year        String          // "2023"
  paper       String          // "Paper I"
  date        String          // "Oct 15, 2023"
  totalQuestions Int
  duration    String          // "2 hrs"
  subjects    String[]
  difficulty  Difficulty
  pdfUrl      String?         // S3 URL for PDF download
  isActive    Boolean  @default(true)

  questions   PYQQuestion[]
  attempts    Attempt[]
}

model PYQQuestion {
  id         String   @id @default(cuid())
  paperId    String
  paper      PYQPaper @relation(fields: [paperId], references: [id])
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
  orderIndex Int
}

// ─── Attempts (Test + PYQ) ───────────────────────────────

model Attempt {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  testId        String?
  test          Test?    @relation(fields: [testId], references: [id])
  pyqPaperId    String?
  pyqPaper      PYQPaper? @relation(fields: [pyqPaperId], references: [id])
  score         Int             // raw score
  totalQuestions Int
  correctCount  Int
  wrongCount    Int
  skippedCount  Int
  timeTaken     Int             // seconds
  percentile    Float?          // computed after all users attempt
  stateRank     Int?
  allIndiaRank  Int?
  answers       Json            // { questionId: selectedIndex }
  status        AttemptStatus  @default(IN_PROGRESS)
  startedAt     DateTime @default(now())
  submittedAt   DateTime?

  @@index([userId])
  @@index([testId])
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  ABANDONED
}

// ─── Guides ──────────────────────────────────────────────

model GuideContent {
  id          String   @id @default(cuid())
  examId      String   @unique
  exam        Exam     @relation(fields: [examId], references: [id])
  totalTopics Int
  totalNotes  Int
  totalPYQs   Int
  levels      Json     // Level[] — see GuideLevel type below
  updatedAt   DateTime @updatedAt
}

// GuideLevel JSON shape:
// {
//   level: number,
//   label: string,
//   topics: {
//     name: string,
//     notes: number,
//     pyqs: number,
//     strength: number,   // computed per user (0-100)
//     status: "done" | "in-progress" | "available" | "locked"
//   }[]
// }[]

model UserTopicProgress {
  id          String   @id @default(cuid())
  userId      String
  examId      String
  topicName   String
  strength    Int      @default(0)  // 0-100
  status      TopicStatus @default(AVAILABLE)
  lastStudied DateTime?

  @@unique([userId, examId, topicName])
}

enum TopicStatus {
  DONE
  IN_PROGRESS
  AVAILABLE
  LOCKED
}


// ─── Live Events ─────────────────────────────────────────

model LiveEvent {
  id          String   @id @default(cuid())
  title       String
  host        String          // "Ananya Singh, JPSC 2023 Rank 14"
  examId      String?         // optional — null means "All Exams"
  scheduledAt DateTime
  meetLink    String
  attendees   Int      @default(0)
  isLive      Boolean  @default(false)
  isFree      Boolean  @default(true)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// ─── Streaks ─────────────────────────────────────────────

model Streak {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastActiveAt  DateTime?
  activeDates   DateTime[]   // all study dates for calendar
  weeklyMinutes Json          // { date: string, minutes: number }[]
}

// ─── Bookmarks & Schedule ────────────────────────────────

model Bookmark {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  type       BookmarkType
  refId      String          // testId | paperId | questionId | articleId
  createdAt  DateTime @default(now())

  @@unique([userId, type, refId])
}

enum BookmarkType {
  TEST
  PYQ
  QUESTION
  ARTICLE
}

model ScheduleItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  type        ScheduleType
  refId       String?         // testId | paperId | topicId
  scheduledAt DateTime
  duration    Int             // minutes
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
}

enum ScheduleType {
  MOCK_TEST
  PYQ
  TOPIC_STUDY
  REVISION
  LIVE_CLASS
}

// ─── Library (Study Notes / Articles) ───────────────────

model Article {
  id          String   @id @default(cuid())
  examId      String?
  subject     String
  topic       String
  title       String
  content     String   @db.Text  // markdown
  type        ArticleType
  difficulty  Difficulty
  tags        String[]
  readMinutes Int
  pdfUrl      String?
  isActive    Boolean  @default(true)
  publishedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ArticleType {
  CONCEPT
  FORMULA
  REVISION
  STRATEGY
}

// ─── Daily Practice ──────────────────────────────────────

model DailyPracticeSet {
  id         String   @id @default(cuid())
  userId     String
  date       String          // "2026-04-26"
  questions  Json            // Question[] — 5 questions from weak areas
  completed  Boolean  @default(false)
  score      Int?
  createdAt  DateTime @default(now())

  @@unique([userId, date])
}

// ─── Enrollment ──────────────────────────────────────────

model TestEnrollment {
  id           String   @id @default(cuid())
  userId       String
  seriesId     String
  series       TestSeries @relation(fields: [seriesId], references: [id])
  testsCompleted Int    @default(0)
  enrolledAt   DateTime @default(now())

  @@unique([userId, seriesId])
}
```

---

## 6. API Contract

### Base URL
- **Development:** `http://localhost:4000/api/v1`
- **Production:** `https://api.examnurture.com/api/v1`

### Authentication Headers
All protected routes require:
```
Authorization: Bearer <accessToken>
```

### 6.1 Auth Endpoints

#### `POST /auth/register`
```json
// Request
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+919876543210",
  "password": "SecurePass123!"
}

// Response 201
{
  "user": { "id": "...", "name": "Rahul Sharma", "email": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."  // also set as httpOnly cookie
}
```

#### `POST /auth/login`
```json
// Request
{ "email": "rahul@example.com", "password": "SecurePass123!" }

// Response 200
{
  "user": { "id": "...", "name": "...", "email": "...", "subscription": { "tierId": 2, "expiresAt": "..." } },
  "accessToken": "eyJ..."
}
```

#### `POST /auth/refresh`
```json
// Request — refreshToken from httpOnly cookie (no body needed)
// Response 200
{ "accessToken": "eyJ..." }
```

#### `POST /auth/logout`
```json
// Clears refresh token cookie, invalidates in DB
// Response 200 { "message": "Logged out" }
```

#### `GET /auth/me`
```json
// Response 200
{
  "id": "...",
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "+91...",
  "subscription": {
    "tierId": 2,
    "tierName": "Tier 2",
    "badge": "12th Pass",
    "status": "ACTIVE",
    "expiresAt": "2027-04-26T00:00:00.000Z",
    "billingCycle": "YEARLY"
  },
  "stats": { "testsCount": 26, "streak": 12, "certificates": 2 }
}
```

---

### 6.2 Exam Boards & Exams

#### `GET /exams/boards`
```
Query: ?tier=2&hasGuide=true&hasPYQ=true&hasTests=true
```
```json
// Response 200 — ExamBoard[]
[
  {
    "id": "state-psc",
    "name": "State PSC (JPSC / BPSC / UPPSC)",
    "shortName": "State PSC",
    "tint": "#8B5CF6",
    "colorSoft": "#F5F3FF",
    "description": "JPSC, BPSC, UPPSC Prelims & Mains · Graduation required",
    "minTier": 3,
    "exams": [
      {
        "id": "jpsc-prelims-2025",
        "boardId": "state-psc",
        "name": "JPSC Prelims 2025",
        "shortName": "Prelims",
        "tier": 3,
        "eligibility": "Graduation",
        "pattern": "100 Qs · 2 hrs · Paper I",
        "subjects": ["General Knowledge", "Reasoning", "Jharkhand GK"],
        "hasTests": true,
        "hasPYQ": true,
        "hasGuide": true,
        "upcomingDate": "Jun 2025",
        "daysLeft": 63
      }
    ]
  }
]
```

#### `GET /exams/:examId`
Returns a single exam with full detail.

---

### 6.3 Subscription Tiers

#### `GET /tiers`
```json
// Response 200 — Tier[]
[
  {
    "id": 1,
    "name": "Tier 1",
    "badge": "10th Pass",
    "qualification": "Passed Class X (Matriculation)",
    "tagline": "Start your govt. job journey",
    "description": "...",
    "monthlyPrice": 149,
    "yearlyPrice": 999,
    "highlight": false,
    "color": "#10B981",
    "colorSoft": "#ECFDF5",
    "perks": ["Railway Group D — full mock series + PYQs", "..."],
    "exclusiveBoardIds": ["railway-group-d", "ssc-lower", "police-constable", "defence"],
    "allBoardIds": ["railway-group-d", "ssc-lower", "police-constable", "defence"]
  }
]
```

---

### 6.4 Test Series

#### `GET /test-series`
```
Query: ?boardId=state-psc&examId=jpsc-prelims-2025&category=FULL_MOCK
```
```json
// Response 200
{
  "enrolled": [
    {
      "id": "jpsc-grand-2025",
      "examId": "jpsc-prelims-2025",
      "boardId": "state-psc",
      "title": "JPSC Prelims 2025 — Grand Series",
      "subtitle": "20 full mocks + 40 subject tests · Official pattern",
      "category": "FULL_MOCK",
      "tint": "#8B5CF6",
      "totalTests": 60,
      "duration": "2 hrs each",
      "studentsCount": 18000,
      "rating": 4.9,
      "progress": { "done": 4, "total": 20 },
      "nextTest": "Full Mock #05 — All State Rank",
      "isEnrolled": true
    }
  ],
  "available": [ /* same shape, isEnrolled: false */ ]
}
```

#### `POST /test-series/:seriesId/enroll`
Enrolls authenticated user in a test series (if tier permits).

---

### 6.5 PYQ Papers

#### `GET /pyq`
```
Query: ?boardId=state-psc&examId=jpsc-prelims-2025&year=2023&subject=General+Knowledge
```
```json
// Response 200 — PYQPaper[]
[
  {
    "id": "jpsc-pre-2023",
    "examId": "jpsc-prelims-2025",
    "boardId": "state-psc",
    "year": "2023",
    "paper": "Paper I",
    "date": "Oct 15, 2023",
    "totalQuestions": 100,
    "duration": "2 hrs",
    "subjects": ["General Knowledge", "Reasoning"],
    "difficulty": "MEDIUM",
    "pdfUrl": "https://cdn.examnurture.com/pyq/jpsc-pre-2023.pdf",
    "attempted": true,
    "score": "71/100"
  }
]
```

---

### 6.6 Exam Attempt (CBT Interface)

#### `POST /attempts/start`
```json
// Request
{ "type": "TEST", "refId": "test-id-here" }
// OR
{ "type": "PYQ", "refId": "pyq-paper-id-here" }

// Response 201
{
  "attemptId": "attempt-xyz",
  "questions": [
    {
      "id": "q-1",
      "subject": "General Knowledge",
      "text": "Which Article provides free education...",
      "options": ["Article 19", "Article 21A", "Article 29", "Article 45"]
      // correctIndex NOT returned — only after submission
    }
  ],
  "totalQuestions": 100,
  "durationSeconds": 7200,
  "startsAt": "2026-04-26T10:00:00.000Z"
}
```

#### `POST /attempts/:attemptId/submit`
```json
// Request
{
  "answers": { "q-1": 1, "q-2": 0, "q-3": 2 },  // questionId → selectedIndex
  "timeTaken": 5843  // seconds
}

// Response 200
{
  "attemptId": "attempt-xyz",
  "score": 71,
  "totalQuestions": 100,
  "correctCount": 71,
  "wrongCount": 22,
  "skippedCount": 7,
  "percentile": 81.4,
  "stateRank": 2140,
  "subjectWise": [
    { "subject": "General Knowledge", "correct": 38, "total": 50, "accuracy": 76 },
    { "subject": "Reasoning", "correct": 33, "total": 50, "accuracy": 66 }
  ]
}
```

#### `GET /attempts/:attemptId/result`
Full result with question-by-question analysis, correct answers, explanations.

---

### 6.7 Guides

#### `GET /guides`
Returns list of exams with available guides (enriched with user's topic progress).

#### `GET /guides/:examId`
```json
// Response 200
{
  "examId": "jpsc-prelims-2025",
  "examName": "JPSC Prelims 2025",
  "totalTopics": 18,
  "totalNotes": 120,
  "totalPYQs": 600,
  "overallProgress": 11,  // percent
  "levels": [
    {
      "level": 1,
      "label": "Foundation",
      "topics": [
        {
          "name": "Indian History & Freedom Struggle",
          "notes": 14,
          "pyqs": 80,
          "strength": 71,
          "status": "done"   // done | in-progress | available | locked
        }
      ]
    }
  ]
}
```

#### `PATCH /guides/:examId/topics/:topicName/progress`
```json
// Request
{ "status": "done", "strength": 80 }
```

---


---

### 6.9 User Dashboard

#### `GET /user/dashboard`
Single aggregated endpoint for the dashboard page.
```json
// Response 200
{
  "greeting": { "name": "Rahul" },
  "stats": { "testsCount": 26, "streak": 12, "certificates": 2, "weeklyHours": 14 },
  "weeklyStreak": { "current": 12, "days": [{ "date": "Mon", "minutes": 42, "active": true }] },
  "examReadiness": [
    { "subject": "GK", "accuracy": 71, "color": "#8B5CF6" },
    { "subject": "Reasoning", "accuracy": 64, "color": "#2563EB" }
  ],
  "weakAreas": [
    { "topic": "Data Interpretation", "accuracy": 44, "subject": "Quant" }
  ],
  "recentTests": [
    { "title": "JPSC Prelims Full Mock #04", "score": 64, "percentile": 81.4, "date": "..." }
  ],
  "recommendations": [
    { "type": "CHAPTER_TEST", "title": "Data Interpretation Drill", "examId": "..." }
  ],
  "liveEvents": [ /* LiveEvent[] */ ],
  "dailyPractice": {
    "date": "2026-04-26",
    "questions": [ /* 3-5 Question[] from weak areas */ ],
    "completed": false
  }
}
```

---

### 6.10 Analytics

#### `GET /user/analytics`
```json
// Response 200
{
  "overview": {
    "testsAttempted": 26,
    "avgScore": 67,
    "stateRank": "~2,140",
    "allIndiaPercentile": 78.3,
    "studyHoursThisWeek": 14
  },
  "subjectAccuracy": [
    { "subject": "General Knowledge", "accuracy": 71 },
    { "subject": "Reasoning", "accuracy": 64 },
    { "subject": "Quantitative Aptitude", "accuracy": 58 },
    { "subject": "English", "accuracy": 80 },
    { "subject": "Hindi", "accuracy": 74 }
  ],
  "scoreHistory": [
    { "testTitle": "Mock #01", "score": 55, "date": "2026-02-10" }
  ],
  "rankHistory": [
    { "testTitle": "Mock #01", "rank": 214, "total": 5280 }
  ]
}
```

---

### 6.11 Profile & Subscription

#### `GET /user/profile` → User (see /auth/me shape)
#### `PUT /user/profile` → Update name, phone, avatarUrl
#### `GET /user/schedule` → ScheduleItem[]
#### `POST /user/schedule` → Create ScheduleItem
#### `GET /subscription` → Full Subscription detail
#### `POST /subscription/checkout` → Create Razorpay order, return orderId
#### `POST /subscription/verify` → Verify Razorpay payment signature, activate subscription
#### `POST /subscription/cancel` → Cancel subscription

---

### 6.12 Daily Practice

#### `GET /daily-practice`
Returns today's practice set for the user (creates one if none exists, based on weak areas).
```json
// Response 200
{
  "date": "2026-04-26",
  "questions": [ /* 3-5 Question[] */ ],
  "completed": false,
  "streak": 12
}
```

#### `POST /daily-practice/submit`
```json
// Request
{ "answers": { "q-id": 1 } }
// Response 200 — { correct: 2, total: 3, updatedStreak: 13 }
```

---

## 7. Authentication & Authorization

### Flow
```
Register/Login → accessToken (15 min JWT) + refreshToken (7 days httpOnly cookie)
→ Frontend stores accessToken in memory (NOT localStorage)
→ Every request: Authorization: Bearer <accessToken>
→ On 401: call POST /auth/refresh → get new accessToken
→ On logout: DELETE cookie + blacklist refreshToken in DB
```

### Access Control (Tier-based)
The backend **must enforce** that users can only access content matching their subscription tier.

```typescript
// Middleware pseudocode
function checkTierAccess(requiredTier: 1 | 2 | 3) {
  return (req, res, next) => {
    const userTier = req.user.subscription?.tierId ?? 0;  // 0 = free
    if (userTier < requiredTier) {
      return res.status(403).json({
        error: "TIER_REQUIRED",
        requiredTier,
        userTier,
        upgradeUrl: "/plans"
      });
    }
    next();
  };
}

// Usage
router.get("/exams/boards", checkTierAccess(1), getBoardsHandler);
```

### JWT Payload
```typescript
interface JWTPayload {
  sub: string;         // userId
  email: string;
  tier: 0 | 1 | 2 | 3; // 0 = free (no subscription)
  role: "STUDENT" | "ADMIN";
  iat: number;
  exp: number;
}
```

---

## 8. Business Logic & Rules

### Tier Access Rules
- Tier is **cumulative**: Tier 2 includes all Tier 1 content, Tier 3 includes all.
- Free users (tier 0) can: browse boards, view results (not attempt), view limited PYQs (first 10 questions only).
- Access check runs **server-side** — never trust client-sent tier level.

### Scoring
- Each correct answer: +1 mark (adjust per exam if negative marking applies)
- Standard negative marking (SSC, Banking): -0.25 per wrong (configurable per test)
- Score = correct - (wrong × negativeMarkingFactor)

### Percentile & Rank Calculation
- Runs as a **background job** after each test ends
- Percentile = (students who scored less than you / total students) × 100
- State Rank = rank among users with same state in their profile
- Store pre-computed percentile in `Attempt.percentile` field

### Streak Logic
- Streak increments if user attempts ≥1 test/practice on a day
- Streak resets if user misses a day (check at midnight IST, cron job)
- Track `lastActiveAt` in `Streak` table


---

## 9. Subscription & Payment

### Razorpay Integration (India)

```
1. Client: POST /subscription/checkout { tierId, billingCycle }
2. Server: Create Razorpay Order → return { orderId, amount, currency, keyId }
3. Client: Open Razorpay checkout modal (razorpay.js)
4. User: Completes payment
5. Client: POST /subscription/verify { orderId, paymentId, signature }
6. Server: Verify HMAC signature → Activate subscription → Return success
```

### Price Table
| Tier | Monthly (INR) | Yearly (INR) | Yearly per month |
|---|---|---|---|
| 1 — 10th Pass | ₹149 | ₹999 | ₹83/mo |
| 2 — 12th Pass | ₹249 | ₹1,699 | ₹141/mo |
| 3 — Graduation | ₹349 | ₹2,499 | ₹208/mo |

### Subscription Lifecycle
- On expiry: tier drops to 0 (free). Content pages show upgrade prompt.
- Grace period: 3 days after expiry before access is revoked.
- Upgrade: Pro-rate the difference, extend to new tier immediately.

---

## 10. Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
```

### Backend (`.env`)
```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/examnurture
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-256-bit-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=another-256-bit-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx

# AWS S3 / Cloudflare R2
S3_BUCKET=examnurture-assets
S3_REGION=ap-south-1
S3_ACCESS_KEY=xxxx
S3_SECRET_KEY=xxxx
CDN_URL=https://cdn.examnurture.com

# Email
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@examnurture.com

# App
BCRYPT_ROUNDS=12
```

---

## 11. File Structure

### Frontend (Existing)
```
ExamNurture_Test_Website/
├── app/
│   ├── (app)/              # Protected pages (all require auth)
│   │   ├── dashboard/
│   │   ├── tests/
│   │   ├── pyq/
│   │   ├── guides/

│   │   ├── plans/
│   │   ├── analytics/
│   │   ├── schedule/
│   │   ├── library/
│   │   └── profile/
│   ├── (auth)/             # Public auth pages
│   │   ├── login/
│   │   └── register/
│   ├── exam/[id]/          # CBT exam interface
│   ├── results/[id]/       # Results page
│   └── api/                # Stub routes → replace with fetch() to backend
│       ├── exams/route.ts
│       └── tiers/route.ts
├── components/
│   ├── dashboard/          # 11 dashboard widgets
│   ├── exam/               # ExamInterface (CBT)
│   ├── layout/             # Topbar, MobileNav
│   ├── results/            # ResultsPage
│   └── ui/                 # button, card, skeleton, theme-toggle
├── lib/
│   ├── data/
│   │   └── examData.ts     # ← REPLACE with fetch() to backend
│   └── utils.ts
└── Projectfile.md          # This file
```

### Backend (To Build — Recommended Structure)
```
examnurture-backend/
├── src/
│   ├── config/
│   │   ├── db.ts           # Prisma client
│   │   ├── redis.ts
│   │   └── env.ts          # Zod-validated env vars
│   ├── middleware/
│   │   ├── auth.ts         # JWT verify, attach req.user
│   │   ├── tierAccess.ts   # Tier enforcement
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── modules/
│   │   ├── auth/           # register, login, refresh, logout
│   │   ├── exams/          # boards, exams CRUD
│   │   ├── tiers/          # tier definitions
│   │   ├── tests/          # test series, tests, questions
│   │   ├── pyq/            # PYQ papers
│   │   ├── attempts/       # start, submit, results
│   │   ├── guides/         # guide content, topic progress
│   │   ├── events/         # live events
│   │   ├── user/           # profile, dashboard, analytics
│   │   ├── subscription/   # plans, checkout, verify
│   │   ├── schedule/       # user schedule
│   │   ├── library/        # articles, notes
│   │   └── daily-practice/ # daily questions, submit
│   ├── jobs/               # Cron jobs
│   │   ├── rankCompute.ts     # Percentile calculation
│   │   └── streakReset.ts     # Midnight IST streak check
│   └── app.ts
├── prisma/
│   ├── schema.prisma       # Full schema (defined above)
│   ├── seed.ts             # Seed exam boards + tiers from examData.ts
│   └── migrations/
├── .env
├── package.json
└── tsconfig.json
```

---

## 12. Integration Checklist

When the backend is ready, update the frontend:

- [ ] **Remove** `lib/data/examData.ts` static imports from pages
- [ ] **Create** `lib/api.ts` — wrapper around `fetch()` with base URL + auth header
- [ ] **Replace** `/app/api/exams/route.ts` with `fetch()` call to backend
- [ ] **Replace** `/app/api/tiers/route.ts` with `fetch()` call to backend
- [ ] **Add** auth context / hook: `useUser()` — reads JWT, handles refresh
- [ ] **Add** `middleware.ts` in Next.js root — redirect to `/login` if no token
- [ ] **Wire** profile page `Subscribe →` button to `/subscription/checkout`
- [ ] **Wire** exam attempt `Attempt` button to `POST /attempts/start`
- [ ] **Wire** daily practice answers to `POST /daily-practice/submit`
- [ ] **Wire** guide topic `Done` / `Continue` buttons to `PATCH /guides/:examId/topics/:name/progress`
- [ ] **Replace** mock analytics data with `GET /user/analytics`

---

## 13. New-Chat Starter Prompt (Backend Project)

> **Usage:** Copy everything inside the code block below and paste it as your first message in a **new Claude conversation** to kick off the Node.js backend project from scratch.

````
You are a senior full-stack Node.js/TypeScript engineer. I need you to build the complete backend API server for **ExamNurture** — an Indian government competitive exam preparation platform.

## What ExamNurture does
- Students prepare for JPSC, IBPS PO, SBI PO, SSC CGL, Railway NTPC, Police SI, Army GD, etc.
- Subscription model: 3 tiers based on educational qualification (10th / 12th / Graduation). Tiers are cumulative — Tier 3 users get access to all 11 exam boards.
- Core features: Mock tests, Previous Year Questions (PYQ), Leveled study guides, Daily practice sets, Live events/webinars, Analytics/streak tracking.

## Tech stack to build
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL (primary) + Redis (JWT revocation / caching)
- **ORM:** Prisma
- **Auth:** JWT access token (15 min expiry) + httpOnly cookie refresh token (7 days expiry)
- **Payments:** Razorpay (Indian payment gateway — subscriptions + one-time)
- **File storage:** AWS S3 or Cloudflare R2 (PDF papers, images)
- **Email:** Resend (transactional email)
- **API style:** REST/JSON versioned under `/api/v1/`

## Database models (Prisma — build from this exact schema)

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  phone        String?  @unique
  passwordHash String
  avatarUrl    String?
  isVerified   Boolean  @default(false)
  role         Role     @default(STUDENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subscription  Subscription?
  refreshTokens RefreshToken[]
  attempts      Attempt[]
  bookmarks     Bookmark[]
  streak        Streak?
  topicProgress UserTopicProgress[]
  scheduleItems ScheduleItem[]
  payments      Payment[]
}

enum Role { STUDENT ADMIN }

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  tierLevel       Int      // 1 | 2 | 3
  billingCycle    BillingCycle
  status          SubStatus @default(ACTIVE)
  currentPeriodEnd DateTime
  razorpaySubId   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  payments        Payment[]
}

enum BillingCycle { MONTHLY YEARLY }
enum SubStatus    { ACTIVE EXPIRED CANCELLED PAUSED }

model Payment {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  subscriptionId  String?
  subscription    Subscription? @relation(fields: [subscriptionId], references: [id])
  razorpayOrderId String   @unique
  razorpayPaymentId String? @unique
  amountPaise     Int
  currency        String   @default("INR")
  status          PaymentStatus @default(PENDING)
  createdAt       DateTime @default(now())
}

enum PaymentStatus { PENDING SUCCESS FAILED REFUNDED }

model Board {
  id          String @id  // e.g. "state-psc"
  name        String
  shortName   String
  description String
  tint        String      // hex color
  colorSoft   String
  minTier     Int         // 1 | 2 | 3
  exams       Exam[]
}

model Exam {
  id           String  @id   // e.g. "jpsc-prelims-2025"
  boardId      String
  board        Board   @relation(fields: [boardId], references: [id])
  name         String
  shortName    String
  tier         Int           // min tier to access
  eligibility  String
  pattern      String
  subjects     String[]
  hasTests     Boolean @default(false)
  hasPYQ       Boolean @default(false)
  hasGuide     Boolean @default(false)
  upcomingDate String?
  daysLeft     Int?
  testSeries   TestSeries[]
  pyqPapers    PYQPaper[]
}

model TestSeries {
  id          String  @id @default(cuid())
  examId      String
  exam        Exam    @relation(fields: [examId], references: [id])
  title       String
  description String?
  totalTests  Int
  isPaid      Boolean @default(false)
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  tests       Test[]
}

model Test {
  id           String  @id @default(cuid())
  seriesId     String
  series       TestSeries @relation(fields: [seriesId], references: [id])
  title        String
  durationSec  Int
  totalMarks   Int
  negMarks     Float  @default(0.25)
  isLocked     Boolean @default(false)
  scheduledAt  DateTime?
  questions    TestQuestion[]
  attempts     Attempt[]
}

model Question {
  id           String   @id @default(cuid())
  examId       String?
  text         String
  options      Json     // string[]
  correctIndex Int
  explanation  String?
  subject      String?
  topic        String?
  difficulty   Difficulty @default(MEDIUM)
  language     Lang    @default(EN)
  source       String?
  year         Int?
  createdAt    DateTime @default(now())
  testQuestions TestQuestion[]
  pyqQuestions  PYQQuestion[]
}

enum Difficulty { EASY MEDIUM HARD }
enum Lang       { EN HI BOTH }

model TestQuestion {
  testId     String
  questionId String
  order      Int
  test       Test     @relation(fields: [testId], references: [id])
  question   Question @relation(fields: [questionId], references: [id])
  @@id([testId, questionId])
}

model Attempt {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  testId      String
  test        Test     @relation(fields: [testId], references: [id])
  answers     Json     // { questionId: selectedIndex }
  score       Float
  totalMarks  Int
  timeTakenSec Int
  completedAt  DateTime @default(now())
}

model PYQPaper {
  id         String   @id @default(cuid())
  examId     String
  exam       Exam     @relation(fields: [examId], references: [id])
  title      String
  year       Int
  shift      String?
  totalQs    Int
  pdfUrl     String?
  isActive   Boolean  @default(true)
  questions  PYQQuestion[]
}

model PYQQuestion {
  paperId    String
  questionId String
  order      Int
  paper      PYQPaper  @relation(fields: [paperId], references: [id])
  question   Question  @relation(fields: [questionId], references: [id])
  @@id([paperId, questionId])
}

model UserTopicProgress {
  id          String   @id @default(cuid())
  userId      String
  examId      String
  topicName   String
  strength    Int      @default(0)  // 0-100
  status      TopicStatus @default(AVAILABLE)
  lastStudied DateTime?
  @@unique([userId, examId, topicName])
}

enum TopicStatus { DONE IN_PROGRESS AVAILABLE LOCKED }

model LiveEvent {
  id              String   @id @default(cuid())
  title           String
  host            String
  hostRole        String
  scheduledAt     DateTime
  durationMin     Int
  isLive          Boolean  @default(false)
  registeredCount Int      @default(0)
  meetUrl         String?
  isActive        Boolean  @default(true)
}

model Streak {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  current    Int      @default(0)
  longest    Int      @default(0)
  lastDate   DateTime?
}

model Bookmark {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  createdAt  DateTime @default(now())
  @@unique([userId, questionId])
}

model ScheduleItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  examId    String
  subject   String
  topic     String
  date      DateTime
  doneAt    DateTime?
}
```

## Complete API contract (all endpoints your backend must implement)

### Auth
```
POST /api/v1/auth/register     body: { name, email, phone?, password }
POST /api/v1/auth/login        body: { email, password }   → { accessToken } + Set-Cookie: refreshToken
POST /api/v1/auth/refresh      cookie: refreshToken         → { accessToken }
POST /api/v1/auth/logout       clears cookie
POST /api/v1/auth/verify-email body: { token }
POST /api/v1/auth/forgot-password  body: { email }
POST /api/v1/auth/reset-password   body: { token, newPassword }
```

### User
```
GET    /api/v1/user/profile      → { id, name, email, phone, avatarUrl, subscription, stats }
PATCH  /api/v1/user/profile      body: { name?, phone?, avatarUrl? }
GET    /api/v1/user/dashboard    → { streak, dailyPractice, upcomingTests, recentAttempts, liveEvents }
GET    /api/v1/user/analytics    → { weakTopics, attemptHistory, scoreProgress, examBreakdown }
```

### Exams & Boards
```
GET /api/v1/boards               ?tier=&minTier=
GET /api/v1/boards/:id
GET /api/v1/exams                ?board=&tier=&hasTests=&hasPYQ=&hasGuide=
GET /api/v1/exams/:id
```

### Tiers & Subscriptions
```
GET  /api/v1/tiers               → Tier[]  (public — for plans page)
GET  /api/v1/tiers/:id           ?withBoards=true
POST /api/v1/subscription/checkout    body: { tierLevel, billingCycle } → { razorpayOrderId, amount }
POST /api/v1/subscription/verify      body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
GET  /api/v1/subscription/status
POST /api/v1/subscription/cancel
```

### Tests
```
GET  /api/v1/test-series          ?examId=&page=&limit=
GET  /api/v1/test-series/:id
GET  /api/v1/tests/:id
POST /api/v1/attempts/start       body: { testId }
POST /api/v1/attempts/:id/submit  body: { answers: { questionId: number }[] }
GET  /api/v1/attempts/:id/result  → { score, totalMarks, analysis[] }
GET  /api/v1/attempts             ?userId=  (own history)
```

### PYQ
```
GET /api/v1/pyq          ?examId=&year=&page=&limit=
GET /api/v1/pyq/:paperId
GET /api/v1/pyq/:paperId/questions
```

### Guides
```
GET   /api/v1/guides              ?examId=
GET   /api/v1/guides/:examId      → { levels: [{ level, topics: [{ name, notes, pyqs, strength, status }] }] }
PATCH /api/v1/guides/:examId/topics/:topicName/progress   body: { status }
```

### Daily Practice
```
GET  /api/v1/daily-practice       → { date, questions: Question[] }
POST /api/v1/daily-practice/submit body: { answers: { questionId: number }[] }
```

### Library
```
GET  /api/v1/library    ?type=article|video&subject=&page=
GET  /api/v1/bookmarks
POST /api/v1/bookmarks  body: { questionId }
DELETE /api/v1/bookmarks/:questionId
```

### Schedule
```
GET    /api/v1/schedule              ?date=
POST   /api/v1/schedule              body: { examId, subject, topic, date }
PATCH  /api/v1/schedule/:id          body: { doneAt }
DELETE /api/v1/schedule/:id
```

### Live Events
```
GET  /api/v1/events    ?upcoming=true
POST /api/v1/events/:id/register
```

## Backend file structure to create
```
examnurture-api/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── exams.ts
│   │   ├── tiers.ts
│   │   ├── subscription.ts
│   │   ├── tests.ts
│   │   ├── attempts.ts
│   │   ├── pyq.ts
│   │   ├── guides.ts
│   │   ├── dailyPractice.ts
│   │   ├── library.ts
│   │   ├── schedule.ts
│   │   └── events.ts
│   ├── middleware/
│   │   ├── auth.ts          # verifyToken middleware
│   │   ├── requireTier.ts   # check user subscription tier
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── subscriptionService.ts
│   │   ├── razorpayService.ts
│   │   ├── emailService.ts
│   │   ├── scoringService.ts
│   │   └── streakService.ts
│   ├── lib/
│   │   ├── prisma.ts        # PrismaClient singleton
│   │   ├── redis.ts         # ioredis client
│   │   ├── jwt.ts           # sign / verify helpers
│   │   └── seed.ts          # seed boards, exams, tiers from static data
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── package.json
└── tsconfig.json
```

## Required environment variables
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/examnurture"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="<random-256-bit>"
JWT_REFRESH_SECRET="<random-256-bit>"
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
RESEND_API_KEY=""
FROM_EMAIL="noreply@examnurture.in"
CLIENT_URL="http://localhost:3000"
PORT=4000
```

## Business rules (must enforce in backend)
1. **Tier access:** A user can only access boards/exams whose `minTier` ≤ their active subscription `tierLevel`. Tiers are cumulative (T3 ⊃ T2 ⊃ T1).
2. **Subscription check on every protected route:** `requireTier(n)` middleware must verify `subscription.status === ACTIVE` and `subscription.tierLevel >= n` before serving test, PYQ, or guide content.
3. **Attempt scoring:** `score = correct × 1 − wrong × 0.25` (configurable per test). Return rank among all users who attempted same test.
4. **Streak logic:** Increment `streak.current` if last activity was yesterday. Reset to 1 if more than 1 day gap. Run a cron at midnight IST to detect resets.
5. **Daily practice:** Generate 5 questions/day from the user's weakest topics (lowest `UserTopicProgress.strength`). Cache per user per day in Redis.
6. **Razorpay webhook:** Verify signature. On `payment.captured` → activate/extend subscription. On `subscription.cancelled` → set status to CANCELLED.
7. **Refresh token rotation:** Issue a new refresh token on every `/auth/refresh`. Revoke old token. Store tokens in DB with expiry.

## Task for you
Build this backend step by step:
1. Set up the Express + TypeScript + Prisma project skeleton
2. Implement the Prisma schema (copy from above exactly)
3. Write seed data for boards, exams, and tiers (use the 11-board / 3-tier data defined above)
4. Implement Auth routes first (register, login, refresh, logout) with JWT + httpOnly cookie
5. Implement User routes
6. Implement Exams + Boards + Tiers routes (these are mostly read-only)
7. Implement Subscription + Razorpay checkout + webhook
8. Implement Tests + Attempts with scoring
9. Implement remaining routes (PYQ, Guides, Daily Practice, etc.)

Start with step 1. Ask me before moving to each new step so I can review.
````

---

*Last updated: April 2026 · ExamNurture v1.0*
