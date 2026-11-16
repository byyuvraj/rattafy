# Rattafy ⚡

> **A visual exam-preparation environment that replaces scrolling through giant 100+ page Word docs.**

Rattafy takes past-paper and Mid Semester Test (MST) question-answer documents, parses and structures them unit-wise, and turns them into high-retention, swipeable exam mastery flashcards.

---

## Features

- **Apple-meets-Vercel Aesthetic**: Ultra-minimal dark theme (#000000 / #0a0a0a), 1px subtle borders, Geist typography, and spring physics.
- **100% Client-Side Privacy (Zero Backend)**:
  - IndexedDB (Dexie.js) stores all subjects, units, questions, and revision notes.
  - The Google Gemini API key is kept solely in browser `localStorage`.
- **Mode A: Smart Deterministic Text Parser (Offline-First)**:
  - Instant text & file upload (`.txt` / `.md`).
  - Supports question headers (`Q1.`, `Q.1`, `Q1)`, `Q:`), metadata tags (`[2023 | MST1 | 5 marks]`), units, and code blocks.
  - Standalone ```` ` answer termination, forgiving fallback, and live detection preview.
- **Mode B: Gemini Multimodal Paper Scanner**:
  - Drag-and-drop photos of question papers, handwritten sheets, or PDF pages.
  - Multimodal extraction into strict JSON schemas.
  - Auto-assigns unsorted questions to syllabus units.
  - Generates exam-grade AI answers when only questions exist on the paper.
- **Touch & Keyboard Driven Active Recall**:
  - Swipe cards (Left/Right to navigate, Up for Known, Down for Revise).
  - Space / Enter to flip, K for Known, R for Revise, S for Star, N for personal notes.
  - Filters by Unknown only, Starred, or Marks weightage.
  - Markdown, tables, and highlighted syntax code blocks.

---

## Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### Installation

1. Clone or navigate to the repository:
```bash
git clone https://github.com/your-username/rattafy.git
cd rattafy
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. (Optional) Run parser unit tests:
```bash
npm test
```

---

## Past-Paper Text Import Format (Mode A)

Rattafy uses a deterministic parser that requires no API keys or servers. You can paste your past papers directly or upload `.txt` / `.md` files.

### Syntax Rules:
1. **Unit Line**: Begins with `Unit <number>` or `# Unit <number>` (e.g., `Unit 1: Introduction`, `UNIT-2 Relational Algebra`). Switches the active unit for subsequent questions.
2. **Question Line**: Begins with `Q`, `Q1`, `Q.1`, `Q1.`, `Q1)`, `Q:` (case-insensitive).
3. **Optional Metadata Tag**: Directly under the question: `[Year | Exam | Marks]` (e.g. `[2023 | MST1 | 5 marks]`).
4. **Answer Block**: Everything after the question until a line containing only three backticks: ```` `.
5. **Inner Code Blocks**: Any code inside the answer wrapped in `~~~` (e.g. `~~~sql ... ~~~`) is preserved as a code snippet and will not trigger answer termination.

### Canonical Example:

```text
Unit 1: Introduction
Q1. What is a database management system?
[2023 | MST1 | 5 marks]
A DBMS is software that stores, retrieves and manages data efficiently in structured databases.
Key characteristics include:
- Data independence (physical & logical)
- ACID transaction guarantees
- Concurrency control and multi-user access
```

Unit 2: SQL Queries
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

## Deployment (Vercel Ready)

Rattafy is ready for zero-config Vercel deployment:

```bash
npm run build
```

Because it uses client-side IndexedDB and calls Gemini directly with the user's client-stored key, it can be deployed on any static or edge host without database connection strings or server configurations.

---

## License
MIT
