import { AppSettings } from "@/types";

const STORAGE_KEYS = {
  API_KEY: "rattafy_gemini_api_key",
  MODEL: "rattafy_gemini_model",
  HAS_ONBOARDED: "rattafy_has_onboarded",
  SETTINGS: "rattafy_settings",
  DRAFT_PREFIX: "rattafy_draft_import_",
  STUDY_POS_PREFIX: "rattafy_study_pos_",
};

export const DEFAULT_MODEL = "gemini-2.5-flash";

export const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recommended - Fast & Multimodal)" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Standard Multimodal)" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Next-gen Fast)" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Deep Reasoning)" },
];

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || "";
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  } else {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  }
}

export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
}

export function getSelectedModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL;
}

export function setSelectedModel(model: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.MODEL, model);
}

export function hasUserOnboarded(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED) === "true";
}

export function setHasOnboarded(val: boolean = true): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, val ? "true" : "false");
}

/* =======================================================
   DRAFT CACHE: Auto-saves user inputs across sessions
======================================================= */
export function getImportDraft(subjectId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(`${STORAGE_KEYS.DRAFT_PREFIX}${subjectId}`) || "";
}

export function setImportDraft(subjectId: string, text: string): void {
  if (typeof window === "undefined") return;
  if (!text || !text.trim()) {
    localStorage.removeItem(`${STORAGE_KEYS.DRAFT_PREFIX}${subjectId}`);
  } else {
    localStorage.setItem(`${STORAGE_KEYS.DRAFT_PREFIX}${subjectId}`, text);
  }
}

export function clearImportDraft(subjectId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEYS.DRAFT_PREFIX}${subjectId}`);
}

/* =======================================================
   STUDY PROGRESS CACHE: Resumes exact card position
======================================================= */
export function getStudySessionPosition(deckKey: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(`${STORAGE_KEYS.STUDY_POS_PREFIX}${deckKey}`);
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function setStudySessionPosition(deckKey: string, index: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEYS.STUDY_POS_PREFIX}${deckKey}`, String(index));
}

/* =======================================================
   PERSISTENT STORAGE: Prevents browser cache eviction
======================================================= */
export async function ensureStoragePersistence(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getStorageStats(): Promise<{
  usageKB: number;
  quotaMB: number;
  isPersisted: boolean;
}> {
  if (typeof window === "undefined" || !navigator.storage) {
    return { usageKB: 0, quotaMB: 0, isPersisted: false };
  }

  try {
    const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    let usageKB = 0;
    let quotaMB = 0;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageKB = Math.round((estimate.usage || 0) / 1024);
      quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
    }

    return { usageKB, quotaMB, isPersisted };
  } catch {
    return { usageKB: 0, quotaMB: 0, isPersisted: false };
  }
}
