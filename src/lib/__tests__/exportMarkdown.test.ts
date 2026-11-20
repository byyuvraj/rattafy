import { describe, it, expect } from "vitest";
import { generateSubjectMarkdown, getExportFilename } from "../exportMarkdown";
import { parsePastPaperText } from "../parser";

describe("exportMarkdown", () => {
  const mockSubject = {
    name: "Distributed Systems",
    code: "CS701",
    branch: "Computer Science",
    year: "4th Year",
    syllabus: "Unit 1: Architectures, Unit 2: Consensus",
  };

  const mockUnits = [
    { id: "u1", number: 1, title: "System Models & Architectures" },
    { id: "u2", number: 2, title: "Consensus & Fault Tolerance" },
  ];

  const mockQuestions = [
    {
      id: "q1",
      unitId: "u1",
      question: "What is a distributed system? Explain key goals.",
      answer: "A distributed system is a collection of autonomous computing entities.\n\n![Architecture](https://example.com/arch.png)\n\nFormula: $E = mc^2$",
      marks: 10,
      years: ["2022", "2023"],
      exams: ["EndSem"],
    },
    {
      id: "q2",
      unitId: "u1",
      question: "Differentiate between loose and tight coupling.",
      answer: "Loosely coupled systems are independent...",
      marks: 5,
      years: ["2021"],
      exams: ["MST1"],
    },
    {
      id: "q3",
      unitId: "u2",
      question: "Explain the Byzantine Generals Problem.",
      answer: "In a network of generals, consensus must be reached despite traitor generals...",
      marks: 10,
      years: ["2020", "2023"],
      exams: ["EndSem"],
    },
  ];

  it("generates fully structured markdown with units, metadata tags, and answers", () => {
    const md = generateSubjectMarkdown(mockSubject, mockUnits, mockQuestions);

    expect(md).toContain("# Distributed Systems");
    expect(md).toContain("**Code:** CS701");
    expect(md).toContain("## UNIT 1: System Models & Architectures");
    expect(md).toContain("### Q1: What is a distributed system? Explain key goals.");
    expect(md).toContain("[2022, 2023 | EndSem | 10 marks]");
    expect(md).toContain("Answer:");
    expect(md).toContain("![Architecture](https://example.com/arch.png)");
    expect(md).toContain("## UNIT 2: Consensus & Fault Tolerance");
    expect(md).toContain("### Q3: Explain the Byzantine Generals Problem.");
  });

  it("is 100% round-trip compatible with Rattafy's past-paper parser", () => {
    const md = generateSubjectMarkdown(mockSubject, mockUnits, mockQuestions);
    const parsed = parsePastPaperText(md);

    expect(parsed.units.length).toBe(2);
    expect(parsed.totalQuestions).toBe(3);

    const unit1 = parsed.units.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1?.questions.length).toBe(2);
    expect(unit1?.questions[0].question).toBe("What is a distributed system? Explain key goals.");
    expect(unit1?.questions[0].marks).toBe(10);
    expect(unit1?.questions[0].years).toEqual(["2022", "2023"]);
    expect(unit1?.questions[0].answer).toContain("A distributed system is a collection");

    const unit2 = parsed.units.find((u) => u.unitNumber === 2);
    expect(unit2).toBeDefined();
    expect(unit2?.questions.length).toBe(1);
    expect(unit2?.questions[0].question).toBe("Explain the Byzantine Generals Problem.");
    expect(unit2?.questions[0].marks).toBe(10);
  });

  it("generates a safe filename", () => {
    const filename = getExportFilename(mockSubject);
    expect(filename).toBe("Distributed_Systems_CS701_Questions.md");
  });
});
