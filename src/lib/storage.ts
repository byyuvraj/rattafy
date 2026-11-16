const STORAGE_KEYS = {
  SETTINGS: "rattafy_settings",
  DRAFT_PREFIX: "rattafy_draft_import_",
  STUDY_POS_PREFIX: "rattafy_study_pos_",
  ADMIN_TOKEN: "rattafy_admin_token",
};

/* =======================================================
   ADMIN AUTH TOKEN (Local Client Mirror)
======================================================= */
export function getStoredAdminToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || "";
}

export function setStoredAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  } else {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  }
}

export function clearStoredAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
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
