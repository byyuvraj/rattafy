export interface UserQuestionProgress {
  status?: "new" | "learning" | "known";
  starred?: boolean;
  notes?: string;
}

const USER_PROGRESS_KEY = "rattafy_user_study_progress";

export function getUserProgress(): Record<string, UserQuestionProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USER_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserQuestionProgress(questionId: string): UserQuestionProgress | undefined {
  const all = getUserProgress();
  return all[questionId];
}

export function setUserQuestionProgress(
  questionId: string,
  updates: Partial<UserQuestionProgress>
): void {
  if (typeof window === "undefined") return;
  try {
    const all = getUserProgress();
    all[questionId] = { ...(all[questionId] || {}), ...updates };
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // LocalStorage quota or privacy mode fail-safe
  }
}

export function clearAllUserProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_PROGRESS_KEY);
}
