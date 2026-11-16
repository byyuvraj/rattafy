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
