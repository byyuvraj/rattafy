export interface ExportSubjectData {
  name: string;
  code?: string | null;
  branch?: string | null;
  year?: string | null;
  syllabus?: string | null;
}

export interface ExportUnitData {
  id: string;
  number: number;
  title: string;
}

export interface ExportQuestionData {
  id?: string;
  unitId?: string | null;
  question: string;
  answer?: string | null;
  marks?: number | null;
  years?: string[] | string | null;
  exams?: string[] | string | null;
}

function parseArrayField(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Generates a clean, fully structured Markdown string containing all units and questions.
 * The output is human-readable and 100% compatible with Rattafy's past-paper parser.
 */
export function generateSubjectMarkdown(
  subject: ExportSubjectData,
  units: ExportUnitData[],
  questions: ExportQuestionData[]
): string {
  const lines: string[] = [];

  // 1. Subject Header
  lines.push(`# ${subject.name.trim()}`);

  const metaParts: string[] = [];
  if (subject.code?.trim()) metaParts.push(`**Code:** ${subject.code.trim()}`);
  if (subject.branch?.trim()) metaParts.push(`**Branch:** ${subject.branch.trim()}`);
  if (subject.year?.trim()) metaParts.push(`**Year:** ${subject.year.trim()}`);
  metaParts.push(`**Units:** ${units.length}`);
  metaParts.push(`**Questions:** ${questions.length}`);

  if (metaParts.length > 0) {
    lines.push(metaParts.join(" | "));
  }

  if (subject.syllabus?.trim()) {
    lines.push("");
    lines.push("### Syllabus / Notes");
    lines.push(subject.syllabus.trim());
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Sort units ascending by unit number
  const sortedUnits = [...units].sort((a, b) => a.number - b.number);

  let globalQuestionCounter = 1;

  // 2. Unit-wise Questions
  for (const unit of sortedUnits) {
    const unitQuestions = questions.filter((q) => q.unitId === unit.id);

    lines.push(`## UNIT ${unit.number}: ${unit.title.trim()}`);
    lines.push("");

    if (unitQuestions.length === 0) {
      lines.push("*No questions recorded in this unit.*");
      lines.push("");
      lines.push("---");
      lines.push("");
      continue;
    }

    for (const q of unitQuestions) {
      // Question Title
      lines.push(`### Q${globalQuestionCounter}: ${q.question.trim()}`);

      // Metadata Tag [years | exams | marks]
      const years = parseArrayField(q.years);
      const exams = parseArrayField(q.exams);
      const marks = q.marks;

      const tagParts: string[] = [];
      if (years.length > 0) tagParts.push(years.join(", "));
      if (exams.length > 0) tagParts.push(exams.join(", "));
      if (marks) tagParts.push(`${marks} ${marks === 1 ? "mark" : "marks"}`);

      if (tagParts.length > 0) {
        lines.push(`[${tagParts.join(" | ")}]`);
        lines.push("");
      }

      // Answer
      const answerText = (q.answer || "").trim();
      lines.push("Answer:");
      if (answerText) {
        lines.push(answerText);
      } else {
        lines.push("*(No answer provided)*");
      }

      lines.push("");
      lines.push("---");
      lines.push("");
      globalQuestionCounter++;
    }
  }

  // 3. Unassigned / General Questions (if any exist without a matching unit)
  const unassignedQuestions = questions.filter(
    (q) => !q.unitId || !units.some((u) => u.id === q.unitId)
  );

  if (unassignedQuestions.length > 0) {
    lines.push(`## UNIT 0: General / Unsorted Questions`);
    lines.push("");

    for (const q of unassignedQuestions) {
      lines.push(`### Q${globalQuestionCounter}: ${q.question.trim()}`);

      const years = parseArrayField(q.years);
      const exams = parseArrayField(q.exams);
      const marks = q.marks;

      const tagParts: string[] = [];
      if (years.length > 0) tagParts.push(years.join(", "));
      if (exams.length > 0) tagParts.push(exams.join(", "));
      if (marks) tagParts.push(`${marks} ${marks === 1 ? "mark" : "marks"}`);

      if (tagParts.length > 0) {
        lines.push(`[${tagParts.join(" | ")}]`);
        lines.push("");
      }

      const answerText = (q.answer || "").trim();
      lines.push("Answer:");
      if (answerText) {
        lines.push(answerText);
      } else {
        lines.push("*(No answer provided)*");
      }

      lines.push("");
      lines.push("---");
      lines.push("");
      globalQuestionCounter++;
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

/**
 * Generates a clean, safe filename for exporting the markdown file.
 * e.g. "Distributed_Systems_CS701_Questions.md"
 */
export function getExportFilename(subject: ExportSubjectData): string {
  const safeName = subject.name.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
  const codeSuffix = subject.code
    ? `_${subject.code.replace(/[^a-zA-Z0-9_\-]/g, "_")}`
    : "";
  return `${safeName}${codeSuffix}_Questions.md`;
}

/**
 * Triggers a browser file download of the generated markdown string.
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
