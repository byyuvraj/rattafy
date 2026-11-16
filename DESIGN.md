# Rattafy — System Design & Architecture Specification

## 1. Product Overview
**Rattafy** is a visual exam-preparation environment designed to liberate university and college students from scrolling through 100+ page Word documents and unformatted past papers. It parses past-paper / Mid Semester Test (MST) questions and answers, structures them unit-wise, and turns them into an interactive, high-retention, swipeable flashcard experience.

### Key Tenets
1. **Admin + Visitor Model**:
   - **Admin Portal (`/admin`)**: The administrator manages subjects, organizes units, and imports past papers via a deterministic parser.
   - **Visitor View (`/`)**: Any visiting student immediately sees all published subjects, units, and questions ready to study with zero setup.
2. **Private Study Retention**: Each visitor's learning progress (`known`, `learning`, `starred`, personal notes) is persisted locally in their browser so multiple students have private, independent revision tracking without needing individual user accounts.
3. **Apple-meets-Vercel Aesthetic**: Ultra-minimalist, near-black dark mode, high-contrast typography, restrained accent colors, smooth spring physics, and subtle micro-interactions.
4. **Deterministic Smart Text Import**: Instant text and `.txt` / `.md` file parser with live previews, draft auto-saving, and duplicate merging.
5. **Active Recall & Exam Readiness**: Spaced tracking (`new`, `learning`, `known`), priority starring, keyboard-driven navigation, and fast overview search.

---

## 2. Design System & Aesthetic Guidelines

### 2.1 Color Palette
- **Background**: `#000000` (canvas) with `#0a0a0a` secondary backgrounds.
- **Surfaces**:
  - Base cards: `#111111`
  - Elevated cards / active layers: `#171717`
  - Glass / Overlays: `rgba(18, 18, 18, 0.75)` with `backdrop-filter: blur(12px)`
- **Borders**:
  - Default: `rgba(255, 255, 255, 0.08)` (1px solid)
  - Interactive / Hover: `rgba(255, 255, 255, 0.18)`
  - Active / Focus: `rgba(255, 255, 255, 0.35)`
- **Text Hierarchy**:
  - Primary: `#ededed`
  - Secondary: `#a1a1a1`
  - Muted / Meta: `#737373`
- **Accent Color**:
  - Subtle electric / soft blue: `hsl(212, 100%, 65%)` (`#4da2ff`) used sparingly for highlights, links, and accents.
  - Success (Known): `hsl(142, 70%, 55%)` (`#22c55e`)
  - Warning (Revise / Learning): `hsl(38, 92%, 50%)` (`#f59e0b`)
  - Starred: `hsl(48, 96%, 53%)` (`#eab308`)
- **Gradients & Glow**:
  - Single subtle radial glow behind hero elements: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06), transparent 70%)`.

### 2.2 Typography
- **Primary Font**: Geist Sans (`font-sans`) for headings, body copy, and UI controls.
- **Monospace Font**: Geist Mono (`font-mono`) for marks, exam years, question IDs, and code blocks.
- **Font Sizes**:
  - Hero display: `text-3xl` / `text-4xl` / `text-5xl`
  - Card Question: `text-xl` to `text-2xl`
  - Answer Body: `text-base` / `text-sm` with generous line-height (`leading-relaxed`)

### 2.3 Geometry & Radii
- **Cards & Modals**: `12px` (`rounded-card`)
- **Buttons & Chips**: `8px` (`rounded-btn`)
- **Badges / Pill Tags**: `9999px` (`rounded-full`)

### 2.4 Buttons (Vercel Style)
- **Primary**: `bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all font-medium text-sm px-4 py-2 rounded-btn`
- **Secondary / Ghost**: `bg-white/[0.04] text-neutral-200 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] transition-all text-sm px-4 py-2 rounded-btn`
- **Destructive**: `bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm px-4 py-2 rounded-btn`

---

## 3. System Architecture

```text
┌────────────────────────────────────────────────────────────────┐
│                         Browser Client                         │
│                                                                │
│  Visitor View (/)        Study View (/subject/[id])            │
│  - Browse all subjects   - Swipeable flashcard deck            │
│  - Instant study access  - Local study progress cache          │
│                                                                │
│  Admin Portal (/admin)                                         │
│  - Protected by ADMIN_PASSWORD                                 │
│  - Subject & Unit manager                                      │
│  - Smart text & past-paper parser import modal                 │
└────────────────┬───────────────────────────────┬───────────────┘
                 │ HTTP (Fetch API)              │ LocalStorage
                 ▼                               ▼
┌────────────────────────────────┐    ┌──────────────────────────┐
│        Next.js App Router      │    │  Visitor Study Storage   │
│  Route Handlers (/api/...)     │    │  - Card status (known/   │
│  - /api/subjects               │    │    learning/new)         │
│  - /api/questions/import       │    │  - Starred questions     │
│  - /api/admin/auth             │    │  - Personal study notes  │
└────────────────┬───────────────┘    └──────────────────────────┘
                 │ Prisma ORM
                 ▼
┌────────────────────────────────┐
│  Server Database               │
│  - SQLite (dev.db)             │
│  - Or PostgreSQL (Neon/Supabase│
│    via DATABASE_URL)           │
└────────────────────────────────┘
```

---

## 4. Data Models (Prisma Schema)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Subject {
  id        String   @id @default(cuid())
  name      String
  syllabus  String?
  createdAt DateTime @default(now())

  units     Unit[]
  questions Question[]

  @@map("subjects")
}

model Unit {
  id        String   @id @default(cuid())
  subjectId String
  number    Int
  title     String

  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  questions Question[]

  @@unique([subjectId, number])
  @@map("units")
}

model Question {
  id          String   @id @default(cuid())
  subjectId   String
  unitId      String
  question    String
  answer      String
  marks       Int?
  years       String   @default("[]") // JSON stringified array of years
  exams       String   @default("[]") // JSON stringified array of exams
  repeatCount Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  unit        Unit     @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@index([subjectId])
  @@index([unitId])
  @@map("questions")
}
```

---

## 5. Security & Admin Authentication

1. **Authentication Mechanism**:
   - `ADMIN_PASSWORD` defined in `.env.local` or environment variables (default: `admin`).
   - `POST /api/admin/auth` sets an HTTP-only secure cookie `rattafy_admin_session=authenticated` with 7 days TTL.
   - Admin routes (`POST /api/subjects`, `POST /api/questions/import`, `DELETE`, etc.) check authentication before executing.
2. **Public Visitor Isolation**:
   - Public visitors only have read access to published subjects, units, and questions.
   - Visitor card actions (e.g. marking known, starring, taking notes) write solely to the client's local progress store (`rattafy_user_study_progress`), ensuring visitors cannot overwrite or corrupt server database records.
