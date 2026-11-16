# Rattafy — System Design & Architecture Specification

## 1. Product Overview
**Rattafy** is a visual exam-preparation environment designed to liberate university and college students from scrolling through 100+ page Word documents and unformatted past papers. It parses past-paper / Mid Semester Test (MST) questions and answers, structures them unit-wise, and turns them into an interactive, high-retention, swipeable flashcard experience.

### Key Tenets
1. **Zero-Backend Privacy**: 100% client-side. Dexie (IndexedDB) stores all subjects, units, questions, and notes. The user's Google Gemini API key resides solely in browser `localStorage` and communicates directly with Google's API endpoints.
2. **Apple-meets-Vercel Aesthetic**: Ultra-minimalist, near-black dark mode, high-contrast typography, restrained accent colors, smooth spring physics, and subtle micro-interactions.
3. **Frictionless Input**:
   - **Mode A (Smart Text Import)**: Deterministic, offline-first parser supporting past-paper text/markdown with questions, metadata tags, and code blocks.
   - **Mode B (Gemini Multimodal Scanner)**: Direct OCR, structured extraction, syllabus unit matching, and duplicate question detection from paper scans, photos, and PDFs.
4. **Active Recall & Exam Readiness**: Spaced tracking (`new`, `learning`, `known`), priority badges for repeated exam questions, keyboard-driven navigation, and fast overview search.

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
  - Subtle electric / soft blue: `hsl(212, 100%, 65%)` (`#4da2ff`) used sparingly for highlights, links, and repeated badges.
  - Success (Known): `hsl(142, 70%, 55%)` (`#22c55e`)
  - Warning (Revise / Learning): `hsl(38, 92%, 50%)` (`#f59e0b`)
  - Starred: `hsl(48, 96%, 53%)` (`#eab308`)
- **Gradients & Glow**:
  - Single subtle radial glow behind hero elements: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06), transparent 70%)`.

### 2.2 Typography
- **Primary Font**: Geist Sans (`font-sans`) for headings, body copy, and UI controls.
  - Headings: `font-semibold` / `font-bold` with tight letter spacing (`tracking-tight` / `tracking-tighter`).
- **Monospace Font**: Geist Mono (`font-mono`) for marks, exam years, repeated badges, question IDs, and code blocks.
- **Font Sizes**:
  - Hero display: `text-3xl` / `text-4xl` / `text-5xl`
  - Card Question: `text-xl` to `text-2xl`
  - Answer Body: `text-base` / `text-sm` with generous line-height (`leading-relaxed`)

### 2.3 Geometry & Radii
- **Cards & Modals**: `12px` (`rounded-xl`)
- **Buttons & Chips**: `8px` (`rounded-lg`)
- **Badges / Pill Tags**: `9999px` (`rounded-full`)

### 2.4 Buttons (Vercel Style)
- **Primary**: `bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all font-medium text-sm px-4 py-2 rounded-lg`
- **Secondary / Ghost**: `bg-white/[0.04] text-neutral-200 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] transition-all text-sm px-4 py-2 rounded-lg`
- **Destructive**: `bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm px-4 py-2 rounded-lg`

### 2.5 Motion & Scroll
- **Lenis Smooth Scroll**: Initialized globally on window scrollable views with responsive dampening.
- **Framer Motion**:
  - Spring-driven card transitions: `stiffness: 300, damping: 25`.
  - 3D perspective flip for question/answer revelation.
  - Peek effects showing the subsequent card underneath.
  - Touch-native swiping with velocity-based thresholds.
  - Respect `prefers-reduced-motion`: fallback to instant opacity transitions when enabled.

---

## 3. Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App Router                    │
│                 (TypeScript + Tailwind CSS)                 │
└──────────────────────┬──────────────────────┬───────────────┘
                       │                      │
       ┌───────────────▼─────────┐    ┌───────▼──────────────┐
       │   IndexedDB (Dexie.js)  │    │ Google Gemini API    │
       │   - Subjects            │    │ - Multimodal Flash   │
       │   - Units               │    │ - JSON Schema Mode   │
       │   - Questions & State   │    │ - Direct client call │
       └─────────────────────────┘    └──────────────────────┘
                       │
       ┌───────────────▼─────────┐
       │      LocalStorage       │
       │  - Gemini API Key       │
       │  - Model Preference     │
       │  - Syllabus Units Cache │
       └─────────────────────────┘
```

- **Framework**: Next.js 14/15 App Router + React 18/19
- **Database**: Dexie.js (IndexedDB wrapper)
- **State/Data Management**: Custom React hooks with reactive Dexie `useLiveQuery`
- **Animations**: `framer-motion`
- **Smooth Scroll**: `@studio-freight/lenis` / `lenis`
- **Icons**: `lucide-react`
- **Markdown & Code**: `react-markdown`, `remark-gfm`, `rehype-highlight` / `shiki`
- **Deployment**: Zero-config Vercel deployment (static / client execution).

---

## 4. Data Models (IndexedDB via Dexie)

### 4.1 Schema Definition
```typescript
export interface Subject {
  id: string;               // UUID v4
  name: string;             // e.g. "Database Management Systems"
  createdAt: number;        // Epoch timestamp (ms)
  syllabus?: string;        // Optional user syllabus list for AI unit mapping
}

export interface Unit {
  id: string;               // UUID v4
  subjectId: string;        // Foreign key to Subject
  number: number;           // e.g. 1, 2, 3... (0 for "Unsorted")
  title: string;            // e.g. "Relational Model & Algebra"
}

export type QuestionStatus = 'new' | 'learning' | 'known';

export interface Question {
  id: string;               // UUID v4
  subjectId: string;        // Foreign key to Subject
  unitId: string;           // Foreign key to Unit
  question: string;         // Plain text / markdown question prompt
  answer: string;           // Rich markdown answer content
  marks?: number;           // e.g. 2, 5, 10
  years: string[];          // e.g. ["2022", "2023"]
  exams: string[];          // e.g. ["MST1", "EndSem", "MidTerm"]
  repeatCount: number;      // Calculated occurrence across papers (>=1)
  status: QuestionStatus;   // 'new' | 'learning' | 'known'
  starred: boolean;         // Bookmark status
  notes?: string;           // User personal revision notes
  aiGenerated?: boolean;    // Flag indicating answer was synthesized by Gemini
  createdAt: number;        // Epoch timestamp (ms)
  updatedAt: number;        // Epoch timestamp (ms)
}
```

---

## 5. Screen Specifications & User Experience

### Screen 1: Onboarding & API Key Modal
- First visit triggers a clean, unobtrusive modal or welcome hero banner.
- Asks for Gemini API Key (with direct link to Google AI Studio: `https://aistudio.google.com/app/apikey`).
- Reassures user: *"Your API key is saved exclusively in your browser's localStorage. It is never transmitted to any third-party server."*
- **Key Validation**: Performs an instant lightweight request (e.g. `generateContent` with 1 token prompt: `"ping"`) before saving.
- Provides a clear *"Continue without API Key"* option (all text import and study features function completely offline).

### Screen 2: Home / Subjects Dashboard
- Grid of subject cards displaying:
  - Subject Name & Code
  - Total Units & Total Questions
  - Circular SVG progress ring indicating `% Known`
  - Quick action to "Study All" or open unit breakdown
- Top actions:
  - "+ Add Subject"
  - Settings link

### Screen 3: Subject Detail Page
- Breadcrumb navigation (`Home > Database Management Systems`).
- Quick stats: Total Questions, Known %, Starred Count, Repeated Questions Count.
- Large minimal unit cards:
  - Unit badge: `Unit 1`, `Unit 2`, etc.
  - Unit Title
  - Progress bar & count (`18 / 24 known • 75%`)
  - Primary button: "Study Unit"
  - Secondary button: "Browse Questions" (Overview)
- Action Bar:
  - "Study All Units" button
  - "Import Past Papers" button (opens Mode A / Mode B Import modal)
  - Subject Syllabus Editor (for AI classification)

### Screen 4: Study Screen (Core Flashcard Experience)
- Focused, full-screen distraction-free view.
- **Top Navigation Bar**:
  - Exit button (`Esc` or `✕` icon) back to Subject view
  - Current unit title & active index (`Question 14 of 32`)
  - Animated progress bar
  - Filter pills: `All`, `Unknown Only`, `Starred Only`, `Repeated (×2+)`, `By Marks`
- **Card Stack View**:
  - Top card rendered with Framer Motion drag gestures (horizontal swipe for Prev/Next, vertical swipe for Known/Revise).
  - Subtle preview/peek of next card positioned behind (`scale(0.96)`, slight vertical offset, lowered opacity).
  - **Card Front**:
    - Metadata row: Marks badge (`[5 Marks]`), Year tags (`2022`, `2023`), Repeated badge (`🔥 Repeated ×3`).
    - Question text in crisp, large typography.
    - Status badge (`New`, `Learning`, `Known`).
    - "Click or Press Space to Reveal Answer" hint.
  - **Card Back (or Revealed state)**:
    - 3D Flip or smooth spring accordion reveal.
    - Formatted Markdown: lists, KaTeX math if present, tables, and highlighted syntax code blocks.
    - Inner scroll container for lengthy answers with sleek custom scrollbar.
    - AI-Generated badge if `aiGenerated === true` with warning notice.
  - **Bottom Action Bar**:
    - Left: `Star (S)` toggle, `Add Note (N)` modal toggle.
    - Center: `Flip (Space)`, `Previous (←)`, `Next (→)`.
    - Right: `Revise Again (R / Swipe Down)` [Warning tint], `Mark Known (K / Swipe Up)` [Success tint].
- **Keyboard Shortcuts Reference**:
  - `Space` / `Enter`: Flip card
  - `ArrowLeft` / `ArrowRight`: Navigate
  - `K`: Mark Known
  - `R`: Mark Revise
  - `S`: Toggle Star
  - `N`: Add / Edit Note
  - `Esc`: Close study view

### Screen 5: Overview Mode (Search & Browse)
- Accessible per Unit or Subject.
- Search input (live filter by question text, answer, or tags).
- Multi-filter toolbar (Status, Marks, Starred, Repeated).
- List / Grid card view showing expandable accordions for quick revision before exam hour.
- Edit / Delete question inline actions.

### Screen 6: Settings & Data Management
- **Gemini API Configuration**:
  - View / change / remove API key.
  - Test Key connection status indicator (green ping indicator).
  - Model selector dropdown (default: `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`).
- **Global / Subject Syllabus Manager**:
  - Textarea to define unit names & topics for accurate Gemini unit classification.
- **Data Portability**:
  - Export entire database to `.json` backup file.
  - Import / restore from `.json` backup file.
  - Reset / Purge all data (with confirmation modal).

---

## 6. Input Modes Specification

### 6.1 Mode A: Deterministic Text Parser (`/lib/parser`)
The parser accepts unstructured text / markdown pasted by the user or uploaded as `.txt` / `.md`.

#### Grammar Rules:
1. **Unit Line**:
   Matches lines starting with `# Unit`, `Unit <n>`, `UNIT-<n>`, `Unit <Roman>: <Title>`.
   - Examples: `Unit 1: Introduction`, `UNIT-2 Relational Algebra`, `# Unit 3 Normalization`.
   - Automatically switches `currentUnitNumber` and `currentUnitTitle`.
   - Any questions encountered before a unit line belong to `Unit 0: "Unsorted"`.
2. **Question Start**:
   Matches lines starting with:
   - `^Q\s*(\d+)?[.:)]?\s+(.+)` (case-insensitive)
   - Matches: `Q1. What is ACID?`, `Q.2 Explain normalization`, `Q3) Define indexing`, `Q: What is a DBMS?`, `Q List relational operators`.
3. **Question Metadata Tag Line**:
   Immediately follows question line or appears before answer.
   - Format: `[2023 | MST1 | 5 marks]`, `[2021, 2022 | EndSem | 10 marks]`, `[MST 1 | 2 Marks]`.
   - Extracts: Years array, Exam name, Marks number.
4. **Answer Parsing & Termination**:
   - Answer content starts after question (and optional metadata line).
   - Terminated **only** by a line consisting solely of three backticks: `^```\s*$`.
   - Inner code blocks wrapped in `~~~` (or non-standalone backticks) are preserved as code blocks inside the answer and do **not** trigger termination.
   - If a new `Q` line appears without an explicit closing ```` `, the parser automatically closes the preceding answer and starts the new question (forgiving mode).
5. **Deduplication**:
   - Repeated questions across pasted chunks are detected via normalized text matching.
   - Merges `years` and `exams` arrays, incrementing `repeatCount`.

#### Interactive Import Preview Screen:
- Visual breakdown of parsed units and question counts.
- Expandable question list with badges for tags, marks, years, and repeat count.
- Inline editor to tweak question/answer text or change assigned unit.
- If unassigned questions exist in "Unsorted", displays "Auto-assign units with Gemini" button.
- "Confirm & Import to Subject" button.

### 6.2 Mode B: Gemini Multimodal Paper Scanner
1. **File Support**:
   - Multi-image drag & drop (JPEG, PNG, WebP) of question papers, handwritten notes, and PDF pages.
2. **Gemini Direct Request**:
   - Uses client-side `fetch` to:
     `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
   - Configured with `generationConfig`:
     - `response_mime_type: "application/json"`
     - Structured JSON schema:
       ```json
       {
         "type": "ARRAY",
         "items": {
           "type": "OBJECT",
           "properties": {
             "question": { "type": "STRING" },
             "answer": { "type": "STRING" },
             "unit": { "type": "INTEGER" },
             "unitTitle": { "type": "STRING" },
             "marks": { "type": "INTEGER" },
             "year": { "type": "STRING" },
             "exam": { "type": "STRING" }
           },
           "required": ["question"]
         }
       }
       ```
3. **Syllabus Context**:
   - Injects user's syllabus unit outlines into the prompt so Gemini maps questions into the correct unit.
4. **AI Answer Generation**:
   - If questions in the paper do not have answers (standard question paper), user can click "Generate Answers with Gemini" (single or bulk).
   - Generated answers are flagged `aiGenerated: true` and rendered with a distinct verification chip.
5. **Error & Rate-limit Handling**:
   - Visual progress bar per image with status (`Uploading`, `Analyzing`, `Done`, `Failed`).
   - Exponential backoff retry on HTTP 429.
   - If JSON response fails parsing, an automatic single-retry repair prompt is sent.
   - Merges identical questions into existing cards with incremented `repeatCount`.

---

## 7. Testing & Verification Plan

1. **Parser Unit Tests (`/lib/parser/__tests__/parser.test.ts`)**:
   - Verification of standard `Q...` syntax variations.
   - Verification of ```` ` answer termination vs `~~~` inner code block preservation.
   - Parsing of `[Year | Exam | Marks]` tags.
   - Handling of Windows `\r\n` line endings, messy whitespace, and missing units.
   - Duplicate question merging and `repeatCount` incrementing.
2. **Dexie Database Integration**:
   - Creation of subjects, units, questions.
   - Status updates (`known`, `learning`, `starred`).
   - Export/import database integrity check.
3. **Study Card Interaction**:
   - Touch drag gesture mechanics and velocity threshold.
   - Keyboard event listeners.
   - Answer reveal layout stability and smooth scrolling.
4. **Build & Lint Verification**:
   - `npm run build` static compilation check with zero TypeScript or ESLint errors.
