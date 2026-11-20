import { ParsedQuestion, ParsedUnitGroup, ParseResult } from "@/types";

// Helper: Convert Roman numerals to integers
function romanToInt(roman: string): number {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
  };
  const upper = roman.toUpperCase();
  let result = 0;
  for (let i = 0; i < upper.length; i++) {
    const current = map[upper[i]] || 0;
    const next = map[upper[i + 1]] || 0;
    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result > 0 ? result : 1;
}

// Check if a line is a Unit header
// Matches: "Unit 1", "UNIT-2", "# Unit 3", "Unit III: Name", "Unit 4 - Storage"
export function parseUnitHeader(line: string): { unitNumber: number; unitTitle: string } | null {
  const trimmed = line.trim();
  // Strip leading markdown headers like #, ##, ###
  const stripped = trimmed.replace(/^#+\s*/, "");

  const unitRegex = /^UNIT\s*[-_:.]?\s*([0-9]+|[IVXLCDM]+)(?:\s*[-_:.)]\s*(.*)|\s+(.*))?$/i;
  const match = stripped.match(unitRegex);

  if (!match) return null;

  const rawNum = match[1];
  let unitNumber = parseInt(rawNum, 10);
  if (isNaN(unitNumber)) {
    unitNumber = romanToInt(rawNum);
  }

  const rawTitle = (match[2] || match[3] || "").trim();
  const unitTitle = rawTitle.length > 0 ? rawTitle : `Unit ${unitNumber}`;

  return { unitNumber, unitTitle };
}

// Check if a line is a Question start
// Matches: "Q", "Q1", "Q.1", "Q1.", "Q1)", "Q:", "Q 1:", "Question 1:", "### Q1:"
export function parseQuestionHeader(line: string): { isQuestion: boolean; questionText: string } {
  const trimmed = line.trim();
  // Strip leading markdown headers like #, ##, ###
  const stripped = trimmed.replace(/^#+\s*/, "");

  // Pattern covering: Q, Q1, Q.1, Q1., Q1), Q:, Q 1., Question 1:, etc.
  const qRegex = /^(?:Question|Q)(?:\s*\.?\s*\d+[.:)]?|\s*[:.)]|\s+)\s*(.*)$/i;
  const match = stripped.match(qRegex);

  if (match) {
    return {
      isQuestion: true,
      questionText: match[1]?.trim() || "",
    };
  }

  // Also standalone "Q" or "Q1" with colon or dot
  const standaloneQ = /^(?:Question|Q)\s*\d*\s*$/i;
  if (standaloneQ.test(stripped)) {
    return {
      isQuestion: true,
      questionText: "",
    };
  }

  return { isQuestion: false, questionText: "" };
}

// Check if a line contains metadata tags like: [2023 | MST1 | 5 marks] or [2021, 2022 | EndSem | 10 marks]
export function parseMetadataTag(line: string): {
  isTag: boolean;
  years: string[];
  exams: string[];
  marks?: number;
} {
  const trimmed = line.trim();
  const tagRegex = /^\[(.*?)\]$/;
  const match = trimmed.match(tagRegex);

  if (!match) {
    return { isTag: false, years: [], exams: [] };
  }

  const content = match[1];
  const parts = content.split(/[|,]/).map((p) => p.trim()).filter(Boolean);

  const years: string[] = [];
  const exams: string[] = [];
  let marks: number | undefined;

  for (const part of parts) {
    // Check for marks: e.g. "5 marks", "10m", "5 Marks", "10 marks"
    const marksMatch = part.match(/^(\d+)\s*(?:marks?|m)\b/i);
    if (marksMatch) {
      marks = parseInt(marksMatch[1], 10);
      continue;
    }

    // Check for 4-digit year (e.g. 2019, 2022, 2023, 2024)
    if (/^(?:19|20)\d{2}$/.test(part)) {
      if (!years.includes(part)) {
        years.push(part);
      }
      continue;
    }

    // Otherwise treat as exam name (MST1, Midterm, EndSem, etc.)
    if (part.length > 0 && !exams.includes(part)) {
      exams.push(part);
    }
  }

  return { isTag: true, years, exams, marks };
}

// Normalize question string for duplicate detection
export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministic Past-Paper Parser
 * Parses plain text / markdown into structured units and questions.
 */
export function parsePastPaperText(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { units: [], totalQuestions: 0, warnings: [] };
  }

  // Normalize Windows line endings \r\n -> \n
  const lines = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  const warnings: string[] = [];
  const unitGroupsMap = new Map<number, { title: string; questions: ParsedQuestion[] }>();

  // Default unit for questions without header
  const UNSORTED_UNIT_NUM = 0;
  const UNSORTED_TITLE = "Unsorted Questions";

  let currentUnitNum = UNSORTED_UNIT_NUM;
  let currentUnitTitle = UNSORTED_TITLE;

  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let answerLines: string[] = [];
  let inAnswerBlock = false;

  const commitCurrentQuestion = () => {
    if (!currentQuestion || !currentQuestion.question?.trim()) {
      currentQuestion = null;
      answerLines = [];
      inAnswerBlock = false;
      return;
    }

    const questionText = currentQuestion.question.trim();
    // Reconstruct answer markdown. Inner ~~~ code blocks are converted to standard markdown if desired or preserved.
    let answerText = answerLines.join("\n").trim();

    // Convert inner ~~~ code blocks to ``` for standard markdown renderers
    answerText = answerText.replace(/^~~~(\w*)$/gm, "```$1");

    const parsedQ: ParsedQuestion = {
      question: questionText,
      answer: answerText,
      unitNumber: currentUnitNum,
      unitTitle: currentUnitTitle,
      marks: currentQuestion.marks,
      years: currentQuestion.years && currentQuestion.years.length > 0 ? currentQuestion.years : [],
      exams: currentQuestion.exams && currentQuestion.exams.length > 0 ? currentQuestion.exams : [],
      repeatCount: currentQuestion.years && currentQuestion.years.length > 1 ? currentQuestion.years.length : 1,
    };

    if (!unitGroupsMap.has(currentUnitNum)) {
      unitGroupsMap.set(currentUnitNum, {
        title: currentUnitTitle,
        questions: [],
      });
    }

    const group = unitGroupsMap.get(currentUnitNum)!;

    // Check for duplicates in current group to merge repeated questions
    const normText = normalizeQuestion(parsedQ.question);
    const existingIndex = group.questions.findIndex((q) => normalizeQuestion(q.question) === normText);

    if (existingIndex >= 0) {
      const existing = group.questions[existingIndex];
      // Merge years
      const mergedYears = Array.from(new Set([...existing.years, ...parsedQ.years]));
      // Merge exams
      const mergedExams = Array.from(new Set([...existing.exams, ...parsedQ.exams]));
      const newRepeat = Math.max(existing.repeatCount + 1, mergedYears.length);

      // Prefer longer answer if existing was shorter
      const bestAnswer = (parsedQ.answer.length > existing.answer.length) ? parsedQ.answer : existing.answer;

      group.questions[existingIndex] = {
        ...existing,
        answer: bestAnswer,
        years: mergedYears,
        exams: mergedExams,
        marks: existing.marks || parsedQ.marks,
        repeatCount: newRepeat,
      };
    } else {
      group.questions.push(parsedQ);
    }

    currentQuestion = null;
    answerLines = [];
    inAnswerBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Check for standalone terminator ``` or horizontal rule --- which ends an answer
    if (inAnswerBlock && (trimmed === "```" || trimmed === "---" || trimmed === "***")) {
      commitCurrentQuestion();
      continue;
    }

    // 2. Check for Unit Header
    const unitMatch = parseUnitHeader(trimmed);
    if (unitMatch) {
      // If we were inside an open question, commit it first (forgiving mode)
      if (currentQuestion) {
        commitCurrentQuestion();
      }
      currentUnitNum = unitMatch.unitNumber;
      currentUnitTitle = unitMatch.unitTitle;
      continue;
    }

    // 3. Check for Question Start
    const qMatch = parseQuestionHeader(trimmed);
    if (qMatch.isQuestion) {
      // Commit preceding question if unclosed
      if (currentQuestion) {
        commitCurrentQuestion();
      }

      currentQuestion = {
        question: qMatch.questionText,
        years: [],
        exams: [],
      };
      answerLines = [];
      inAnswerBlock = false;
      continue;
    }

    // 4. If we have an active question but haven't started answer yet
    if (currentQuestion && !inAnswerBlock) {
      // Check if this line is a metadata tag [Year | Exam | Marks]
      const tagMatch = parseMetadataTag(trimmed);
      if (tagMatch.isTag) {
        currentQuestion.years = tagMatch.years;
        currentQuestion.exams = tagMatch.exams;
        if (tagMatch.marks !== undefined) {
          currentQuestion.marks = tagMatch.marks;
        }
        continue;
      }

      // If question text was empty or incomplete, append line to question
      if (!currentQuestion.question) {
        currentQuestion.question = trimmed;
        continue;
      }

      // Check if line looks like "Answer:" or "Ans:" or "A:" (require colon or dot for single letter 'A')
      const ansPrefixMatch =
        trimmed.match(/^(?:Answer|Ans)[\s.:-]\s*(.*)$/i) ||
        trimmed.match(/^A[:.-]\s*(.*)$/i);
      if (ansPrefixMatch) {
        inAnswerBlock = true;
        if (ansPrefixMatch[1]) {
          answerLines.push(ansPrefixMatch[1]);
        }
        continue;
      }

      // Otherwise, the answer has started
      inAnswerBlock = true;
      answerLines.push(line);
      continue;
    }

    // 5. If we are in answer block, collect line
    if (inAnswerBlock) {
      answerLines.push(line);
      continue;
    }
  }

  // Commit any pending question at EOF
  if (currentQuestion) {
    commitCurrentQuestion();
  }

  // Format into sorted array of ParsedUnitGroup
  const sortedUnitKeys = Array.from(unitGroupsMap.keys()).sort((a, b) => {
    if (a === 0) return 1; // Unsorted placed at end
    if (b === 0) return -1;
    return a - b;
  });

  let totalQuestions = 0;
  const units: ParsedUnitGroup[] = [];

  for (const num of sortedUnitKeys) {
    const group = unitGroupsMap.get(num)!;
    if (group.questions.length > 0) {
      units.push({
        unitNumber: num,
        unitTitle: group.title,
        questions: group.questions,
      });
      totalQuestions += group.questions.length;
    }
  }

  if (unitGroupsMap.has(UNSORTED_UNIT_NUM) && unitGroupsMap.get(UNSORTED_UNIT_NUM)!.questions.length > 0) {
    warnings.push(
      `${unitGroupsMap.get(UNSORTED_UNIT_NUM)!.questions.length} questions were placed in "Unsorted" because no unit header was found.`
    );
  }

  return {
    units,
    totalQuestions,
    warnings,
  };
}
