export type QuestionStatus = 'new' | 'learning' | 'known';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  createdAt: number;
  syllabus?: string;
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
  aiGenerated?: boolean;
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
  aiGenerated?: boolean;
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

export interface GeminiExtractedItem {
  question: string;
  answer?: string;
  unit?: number;
  unitTitle?: string;
  marks?: number;
  year?: string;
  exam?: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  autoSaveNotes: boolean;
  hapticFeedback: boolean;
}
