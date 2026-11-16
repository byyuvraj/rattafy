# Rattafy ⚡

> **A visual exam-preparation environment that replaces scrolling through giant 100+ page Word docs.**

Rattafy takes past-paper and Mid Semester Test (MST) question-answer documents, parses and structures them unit-wise, and turns them into high-retention, swipeable exam mastery cards.

---

## Architecture & Concept

Rattafy is architected with an **Admin + Visitor** model:
- **Admin Portal (`/admin`)**: The administrator logs in using an admin passcode (`ADMIN_PASSWORD`), creates subjects, organizes units, and imports past papers using a smart deterministic text/markdown parser with live previews.
- **Visitor / Student View (`/`)**: Anyone visiting the site instantly sees all published subjects, units, and questions ready to study with zero setup.
- **Private Retention Tracking**: Each visitor's study progress (known/learning status, starred questions, personal notes) is automatically saved to their browser's local storage so each student has private, persistent progress without needing an account.
- **Database Backend**: Powered by Prisma ORM. Defaults to zero-setup SQLite (`dev.db`), and connects seamlessly to PostgreSQL (Supabase, Neon, Railway) by setting `DATABASE_URL`.

---

## Features

- **Apple-meets-Vercel Aesthetic**: Minimal dark theme (`#000000` / `#0a0a0a`), 1px subtle borders, Geist typography, and spring physics.
- **Admin Management Portal (`/admin`)**:
  - Protected with `ADMIN_PASSWORD` (default: `admin`).
  - Create, edit, and delete subjects with auto-cascading unit & question deletion.
  - Create and manage units per subject.
  - Bulk import exam questions with preview, edit, and validation before committing.
  - Edit or delete individual questions.
- **Smart Deterministic Text & Markdown Parser**:
  - Instant text paste or file upload (`.txt` / `.md`).
  - Supports question headers (`Q1.`, `Q.1`, `Q1)`, `Q:`), metadata tags (`[2023 | MST1 | 5 marks]`), units, and code blocks.
  - Standalone ```` ` answer termination, forgiving fallback, and live question detection preview.
  - Draft auto-saving to local browser cache so work is never lost.
- **Touch & Keyboard Driven Active Recall**:
  - Full-screen swipeable cards with smooth gesture detection.
  - Space / Enter to flip card, K for Known, R for Revise, S for Star, N for personal notes.
  - Filter questions by Unknown, Starred, or Unit.
  - Rich Markdown formatting with syntax-highlighted code blocks.

---

## Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/byyuvraj/rattafy.git
cd rattafy
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="your-secure-admin-passcode"
```

4. Push database schema:
```bash
npx prisma db push
```

5. Run development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Go to [http://localhost:3000/admin](http://localhost:3000/admin) to log in and upload your first subject!

---

## Past-Paper Text Import Format

You can paste past papers directly into the Admin Import modal or upload `.txt` / `.md` files:

### Syntax Rules:
1. **Unit Line**: Begins with `Unit <number>` or `# Unit <number>` (e.g., `Unit 1: Introduction`). Sets the active unit for subsequent questions.
2. **Question Line**: Begins with `Q1.`, `Q.1`, `Q1)`, `Q:`, or `Q` (case-insensitive).
3. **Optional Metadata Tag**: Directly under the question: `[Year | Exam | Marks]` (e.g. `[2023 | MST1 | 5 marks]`).
4. **Answer Block**: Everything after the question until a line containing only three backticks: ```` `.
5. **Inner Code Blocks**: Any code snippet inside the answer wrapped in `~~~` (e.g. `~~~sql ... ~~~`) is preserved safely and will not prematurely terminate the answer.

### Canonical Example:

```text
Unit 1: Introduction to DBMS
Q1. What is a Database Management System? Explain its main advantages over traditional file systems.
[2023 | MST1 | 5 marks]
A Database Management System (DBMS) is system software for creating and managing databases.

Key advantages include:
1. Data Independence: Separation of data structure from application programs.
2. Controlled Redundancy: Eliminates duplicate data entries.
3. Concurrency Control: Allows multiple users to access data simultaneously.
```

Unit 2: Relational Model & SQL
Q2. Write an SQL query to retrieve the second highest salary from an Employee table without using LIMIT.
[2022, 2024 | EndSem | 10 marks]
Here is the correlated subquery approach:
~~~sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
~~~
```
```

---

## Testing & Verification

Run parser unit tests:
```bash
npm test
```

Run linter:
```bash
npm run lint
```

Build production bundle:
```bash
npm run build
```
