import { describe, it, expect } from "vitest";
import {
  parsePastPaperText,
  parseUnitHeader,
  parseQuestionHeader,
  parseMetadataTag,
  normalizeQuestion,
} from "../index";

describe("Parser Unit Tests", () => {
  describe("Unit Header Detection", () => {
    it("parses Arabic numeral unit formats", () => {
      expect(parseUnitHeader("Unit 1: Introduction")).toEqual({
        unitNumber: 1,
        unitTitle: "Introduction",
      });
      expect(parseUnitHeader("UNIT-2 Relational Algebra")).toEqual({
        unitNumber: 2,
        unitTitle: "Relational Algebra",
      });
      expect(parseUnitHeader("# Unit 3")).toEqual({
        unitNumber: 3,
        unitTitle: "Unit 3",
      });
      expect(parseUnitHeader("### UNIT 4 - Transaction Management")).toEqual({
        unitNumber: 4,
        unitTitle: "Transaction Management",
      });
    });

    it("parses Roman numeral unit formats", () => {
      expect(parseUnitHeader("Unit III: Normalization")).toEqual({
        unitNumber: 3,
        unitTitle: "Normalization",
      });
      expect(parseUnitHeader("UNIT-IV Concurrency")).toEqual({
        unitNumber: 4,
        unitTitle: "Concurrency",
      });
    });

    it("returns null for non-unit lines", () => {
      expect(parseUnitHeader("Just a normal sentence")).toBeNull();
      expect(parseUnitHeader("Q1. What is database?")).toBeNull();
    });
  });

  describe("Question Header Detection", () => {
    it("detects varied question prefix patterns", () => {
      expect(parseQuestionHeader("Q1. Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Q.1 Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Q1) Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Q: Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Q1 Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Question 1: Explain ACID properties").isQuestion).toBe(true);
      expect(parseQuestionHeader("Q What is indexing?").isQuestion).toBe(true);
    });

    it("extracts question text correctly", () => {
      expect(parseQuestionHeader("Q1. What is a DBMS?").questionText).toBe("What is a DBMS?");
      expect(parseQuestionHeader("Q.2 Define primary key").questionText).toBe("Define primary key");
      expect(parseQuestionHeader("Q: What is SQL?").questionText).toBe("What is SQL?");
    });
  });

  describe("Metadata Tag Parsing", () => {
    it("parses [year | exam | marks] correctly", () => {
      const tag1 = parseMetadataTag("[2023 | MST1 | 5 marks]");
      expect(tag1.isTag).toBe(true);
      expect(tag1.years).toEqual(["2023"]);
      expect(tag1.exams).toEqual(["MST1"]);
      expect(tag1.marks).toBe(5);

      const tag2 = parseMetadataTag("[2021, 2022 | EndSem | 10 marks]");
      expect(tag2.isTag).toBe(true);
      expect(tag2.years).toEqual(["2021", "2022"]);
      expect(tag2.exams).toEqual(["EndSem"]);
      expect(tag2.marks).toBe(10);
    });
  });

  describe("Full Past Paper Text Parsing", () => {
    it("parses basic sample provided in prompt", () => {
      const sample = `Unit 1: Introduction
Q1. What is a database management system?
A DBMS is software that stores, retrieves and manages data...
\`\`\``;

      const result = parsePastPaperText(sample);
      expect(result.units.length).toBe(1);
      expect(result.units[0].unitNumber).toBe(1);
      expect(result.units[0].unitTitle).toBe("Introduction");
      expect(result.units[0].questions.length).toBe(1);
      expect(result.units[0].questions[0].question).toBe("What is a database management system?");
      expect(result.units[0].questions[0].answer).toContain("A DBMS is software");
    });

    it("preserves inner ~~~ code blocks and only terminates at standalone ```", () => {
      const input = `Unit 2: SQL Queries
Q1. How to find the second highest salary?
[2023 | MST2 | 5 marks]
Here is the query using a subquery:
~~~sql
SELECT MAX(salary) FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
~~~
Make sure to explain why this works.
\`\`\`
Q2. What is an index?
An index speeds up retrieval.
\`\`\``;

      const result = parsePastPaperText(input);
      expect(result.units.length).toBe(1);
      expect(result.units[0].questions.length).toBe(2);

      const q1 = result.units[0].questions[0];
      expect(q1.question).toBe("How to find the second highest salary?");
      expect(q1.marks).toBe(5);
      expect(q1.years).toEqual(["2023"]);
      expect(q1.exams).toEqual(["MST2"]);
      // Verified that ~~~ is preserved as code block
      expect(q1.answer).toContain("```sql");
      expect(q1.answer).toContain("Make sure to explain why this works.");

      const q2 = result.units[0].questions[1];
      expect(q2.question).toBe("What is an index?");
      expect(q2.answer).toBe("An index speeds up retrieval.");
    });

    it("handles Windows CRLF line endings and messy whitespace", () => {
      const crlfInput = "Unit 1: Intro\r\n\r\nQ1. Define schema.\r\n[2022 | MST1 | 2 marks]\r\nA schema is the logical structure.\r\n```\r\n";
      const result = parsePastPaperText(crlfInput);
      expect(result.totalQuestions).toBe(1);
      expect(result.units[0].questions[0].question).toBe("Define schema.");
      expect(result.units[0].questions[0].marks).toBe(2);
    });

    it("places questions without a unit header into 'Unsorted Questions'", () => {
      const input = `Q1. Standalone question without unit
This answer is unsorted.
\`\`\``;
      const result = parsePastPaperText(input);
      expect(result.units.length).toBe(1);
      expect(result.units[0].unitNumber).toBe(0);
      expect(result.units[0].unitTitle).toBe("Unsorted Questions");
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("merges duplicate questions across papers and increments repeatCount", () => {
      const input = `Unit 1: Introduction
Q1. What is normalization?
[2021 | MST1 | 5 marks]
Normalization minimizes redundancy.
\`\`\`
Q2. Explain ER model.
Entity relationship model.
\`\`\`
Q3. What is normalization?
[2023 | EndSem | 5 marks]
Normalization minimizes redundancy and avoids update anomalies.
\`\`\``;

      const result = parsePastPaperText(input);
      expect(result.units[0].questions.length).toBe(2);

      const normQ = result.units[0].questions.find((q) => q.question.toLowerCase().includes("normalization"));
      expect(normQ).toBeDefined();
      expect(normQ?.years).toContain("2021");
      expect(normQ?.years).toContain("2023");
      expect(normQ?.repeatCount).toBe(2);
      expect(normQ?.exams).toContain("MST1");
      expect(normQ?.exams).toContain("EndSem");
    });
  });
});
