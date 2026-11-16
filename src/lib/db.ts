import Dexie, { type EntityTable } from "dexie";
import { Subject, Unit, Question } from "@/types";
import { generateId } from "./utils";

export class RattafyDatabase extends Dexie {
  subjects!: EntityTable<Subject, "id">;
  units!: EntityTable<Unit, "id">;
  questions!: EntityTable<Question, "id">;

  constructor() {
    super("RattafyDB");
    this.version(1).stores({
      subjects: "id, name, createdAt",
      units: "id, subjectId, number",
      questions: "id, subjectId, unitId, status, starred, repeatCount, createdAt",
    });
  }
}

export const db = new RattafyDatabase();

// Seed Demo Subject (DBMS)
export async function seedDemoData(): Promise<string> {
  const existing = await db.subjects.filter(s => s.name === "Database Management Systems (CS301)").first();
  if (existing) {
    return existing.id;
  }

  const subjectId = generateId();
  const now = Date.now();

  const subject: Subject = {
    id: subjectId,
    name: "Database Management Systems (CS301)",
    code: "CS301",
    createdAt: now,
    syllabus: `Unit 1: Introduction & Relational Model (DBMS architecture, data independence, ER diagrams, keys)
Unit 2: SQL & Relational Algebra (Queries, joins, nested subqueries, views, relational operators)
Unit 3: Normalization & Functional Dependencies (1NF, 2NF, 3NF, BCNF, lossy vs lossless decomposition)
Unit 4: Transaction Processing & Concurrency (ACID properties, serializability, 2PL, deadlock handling)`,
  };

  const unit1Id = generateId();
  const unit2Id = generateId();
  const unit3Id = generateId();

  const units: Unit[] = [
    {
      id: unit1Id,
      subjectId,
      number: 1,
      title: "Introduction & Relational Model",
    },
    {
      id: unit2Id,
      subjectId,
      number: 2,
      title: "SQL & Relational Algebra",
    },
    {
      id: unit3Id,
      subjectId,
      number: 3,
      title: "Normalization & Functional Dependencies",
    },
  ];

  const questions: Question[] = [
    {
      id: generateId(),
      subjectId,
      unitId: unit1Id,
      question: "What is a database management system?",
      answer: `A **Database Management System (DBMS)** is specialized system software designed to store, retrieve, define, and manage structured data efficiently in databases.

### Key Characteristics:
1. **Data Independence**: Shields application programs from changes in physical storage structures (physical) and logical schema (logical).
2. **ACID Properties**: Guarantees Atomicity, Consistency, Isolation, and Durability across concurrent transactions.
3. **Multi-User Access & Security**: Role-based access control preventing simultaneous modification conflicts.
4. **Reduced Redundancy**: Centralized schema design eliminates duplicate storage.

### 3-Schema Architecture:
- **Physical Level**: Internal storage layout (B-trees, hashing, blocks).
- **Logical Level**: Tables, relationships, and constraints.
- **View Level**: User-specific perspectives and abstraction.`,
      marks: 5,
      years: ["2022", "2023", "2024"],
      exams: ["MST1", "EndSem"],
      repeatCount: 3,
      status: "learning",
      starred: true,
      notes: "High probability question for MST1 Section A.",
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      subjectId,
      unitId: unit1Id,
      question: "Differentiate between Physical Data Independence and Logical Data Independence with examples.",
      answer: `| Feature | Logical Data Independence | Physical Data Independence |
| :--- | :--- | :--- |
| **Definition** | Ability to modify the logical schema without altering external views/programs. | Ability to modify the physical schema without altering the logical schema. |
| **Difficulty** | Difficult to achieve because applications are heavily tied to logical structure. | Comparatively easier to achieve. |
| **Example** | Adding a new attribute \`phoneNumber\` to an \`Employee\` table without breaking existing reports. | Changing internal file storage from sequential file to B+ Tree index without changing table schemas. |
| **Schema Level** | Between Conceptual level and External/View level. | Between Internal level and Conceptual/Logical level. |`,
      marks: 5,
      years: ["2021", "2023"],
      exams: ["MST1"],
      repeatCount: 2,
      status: "new",
      starred: false,
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      subjectId,
      unitId: unit1Id,
      question: "Explain the components of an Entity-Relationship (ER) diagram with their standard notations.",
      answer: `An **ER Diagram** visually represents the conceptual data structure of a database domain.

### Core Constructs:
- **Entity**: A real-world object distinguishable from other objects.
  - *Strong Entity*: Represented by a single rectangle (e.g., \`Student\`).
  - *Weak Entity*: Depends on a strong entity; represented by a **double rectangle** (e.g., \`Dependent\`).
- **Attributes**:
  - *Key Attribute*: Underlined text inside an ellipse (e.g., \`RollNo\`).
  - *Composite Attribute*: Ellipse branching into sub-ellipses (e.g., \`Name\` -> \`First\`, \`Last\`).
  - *Multivalued Attribute*: **Double ellipse** (e.g., \`Skills\`, \`PhoneNumbers\`).
  - *Derived Attribute*: **Dashed ellipse** (e.g., \`Age\` computed from \`DOB\`).
- **Relationship**:
  - Diamond symbol connecting participating entities. Double diamond for identifying relationships with weak entities.`,
      marks: 10,
      years: ["2020", "2022"],
      exams: ["EndSem"],
      repeatCount: 2,
      status: "known",
      starred: true,
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      subjectId,
      unitId: unit2Id,
      question: "Write an SQL query to find the 2nd highest salary from an Employee table without using LIMIT/TOP.",
      answer: `To retrieve the second highest salary using standard ANSI SQL without proprietary limit clauses:

### Correlated Subquery Approach:
~~~sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (
    SELECT MAX(salary)
    FROM Employee
);
~~~

### Dense Rank Window Function Approach:
~~~sql
WITH RankedEmployees AS (
    SELECT salary,
           DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
    FROM Employee
)
SELECT salary
FROM RankedEmployees
WHERE rnk = 2;
~~~

> **MST Tip**: Explain that \`DENSE_RANK()\` avoids skipping ranks when two employees share the top salary.`,
      marks: 5,
      years: ["2022", "2023", "2024"],
      exams: ["MST2", "EndSem"],
      repeatCount: 3,
      status: "learning",
      starred: true,
      notes: "Must mention duplicate handling via DENSE_RANK vs RANK.",
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      subjectId,
      unitId: unit2Id,
      question: "Define the fundamental relational algebra operators with their mathematical symbols.",
      answer: `The 5 fundamental operators in Relational Algebra that can derive all other operations:

1. **Selection (σ)**: Filters rows satisfying a predicate condition.
   $$\\sigma_{age > 20}(Students)$$

2. **Projection (π)**: Selects specified columns and eliminates duplicate rows.
   $$\\pi_{name, rollNo}(Students)$$

3. **Cartesian Product (×)**: Combines every tuple of relation R with relation S.
   $$R \\times S$$

4. **Set Union (∪)**: Returns tuples belonging to R, S, or both (relations must be union-compatible).
   $$R \\cup S$$

5. **Set Difference (−)**: Returns tuples in R that do not appear in S.
   $$R - S$$`,
      marks: 10,
      years: ["2021", "2023"],
      exams: ["MST2"],
      repeatCount: 2,
      status: "new",
      starred: false,
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      subjectId,
      unitId: unit3Id,
      question: "What is Boyce-Codd Normal Form (BCNF)? How does it differ from 3NF?",
      answer: `A relation $R$ is in **BCNF** if and only if for every non-trivial functional dependency $X \\rightarrow Y$, $X$ is a **superkey** of $R$.

### Difference Between 3NF and BCNF:
- **3NF Rule**: For every $X \\rightarrow Y$, either:
  1. $X$ is a superkey, **OR**
  2. $Y$ is a **prime attribute** (member of any candidate key).
- **BCNF Rule**: Strips condition #2! Every determinant $X$ **must** be a superkey without exceptions.

### Important Exam Rule:
> Every relation in BCNF is guaranteed to be in 3NF, but not all 3NF relations are in BCNF. BCNF may not always preserve functional dependencies.`,
      marks: 5,
      years: ["2020", "2022", "2023"],
      exams: ["EndSem"],
      repeatCount: 3,
      status: "new",
      starred: true,
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.transaction("rw", db.subjects, db.units, db.questions, async () => {
    await db.subjects.add(subject);
    await db.units.bulkAdd(units);
    await db.questions.bulkAdd(questions);
  });

  return subjectId;
}

// Export All Data as JSON
export async function exportAllData(): Promise<string> {
  const subjects = await db.subjects.toArray();
  const units = await db.units.toArray();
  const questions = await db.questions.toArray();

  const exportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    subjects,
    units,
    questions,
  };

  return JSON.stringify(exportPayload, null, 2);
}

// Import All Data from JSON
export async function importAllData(jsonString: string): Promise<{ subjectsCount: number; questionsCount: number }> {
  const data = JSON.parse(jsonString);

  if (!Array.isArray(data.subjects) || !Array.isArray(data.units) || !Array.isArray(data.questions)) {
    throw new Error("Invalid backup format: missing subjects, units, or questions array.");
  }

  await db.transaction("rw", db.subjects, db.units, db.questions, async () => {
    await db.subjects.bulkPut(data.subjects);
    await db.units.bulkPut(data.units);
    await db.questions.bulkPut(data.questions);
  });

  return {
    subjectsCount: data.subjects.length,
    questionsCount: data.questions.length,
  };
}

// Clear Database
export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.subjects, db.units, db.questions, async () => {
    await db.questions.clear();
    await db.units.clear();
    await db.subjects.clear();
  });
}
