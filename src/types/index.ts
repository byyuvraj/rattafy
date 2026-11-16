export type QuestionStatus = 'new' | 'learning' | 'known';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  branch?: string;
  year?: string;
  createdAt: number;
  syllabus?: string;
  unitsCount?: number;
  questionsCount?: number;
}

export interface Unit {
  id: string;
  subjectId: string;
  number: number;
  title: string;
}

export interface Question {
  id: string;
  subjectId: string;
  unitId: string;
  question: string;
  answer: string;
  marks?: number;
  years: string[];
  exams: string[];
  repeatCount: number;
  status: QuestionStatus;
  starred: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ParsedQuestion {
  question: string;
  answer: string;
  unitNumber?: number;
  unitTitle?: string;
  marks?: number;
  years: string[];
  exams: string[];
  repeatCount: number;
}

export interface ParsedUnitGroup {
  unitNumber: number;
  unitTitle: string;
  questions: ParsedQuestion[];
}

export interface ParseResult {
  units: ParsedUnitGroup[];
  totalQuestions: number;
  warnings: string[];
}

export interface AppSettings {
  autoSaveNotes: boolean;
  hapticFeedback: boolean;
}
