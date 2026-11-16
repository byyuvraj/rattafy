import { AppSettings } from "@/types";

const STORAGE_KEYS = {
  API_KEY: "rattafy_gemini_api_key",
  MODEL: "rattafy_gemini_model",
  HAS_ONBOARDED: "rattafy_has_onboarded",
  SETTINGS: "rattafy_settings",
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
