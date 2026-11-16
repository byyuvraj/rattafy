"use client";

import { useState, useEffect, useRef } from "react";
import {
  Key,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Check,
  Loader2,
  Cpu,
} from "lucide-react";
import {
  getApiKey,
  setApiKey,
  removeApiKey,
  getSelectedModel,
  setSelectedModel,
  AVAILABLE_MODELS,
} from "@/lib/storage";
import { validateGeminiApiKey } from "@/lib/gemini";
import { exportAllData, importAllData, clearAllData } from "@/lib/db";

export default function SettingsPage() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [modelInput, setModelInput] = useState(AVAILABLE_MODELS[0].id);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKeyInput(getApiKey());
    setModelInput(getSelectedModel());
  }, []);

  const handleTestAndSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      removeApiKey();
      setValidationStatus({
        success: true,
        message: "API key removed. Rattafy will operate in offline Mode A text-only mode.",
      });
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    try {
      const res = await validateGeminiApiKey(apiKeyInput.trim(), modelInput);
      if (res.valid) {
        setApiKey(apiKeyInput.trim());
        setValidationStatus({
          success: true,
          message: "API key successfully verified and saved in local storage!",
        });
      } else {
        setValidationStatus({
          success: false,
          message: res.error || "Key validation failed. Please check your Google AI Studio key.",
        });
      }
    } catch (err: any) {
      setValidationStatus({
        success: false,
        message: err.message || "Failed to validate key.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    removeApiKey();
    setApiKeyInput("");
    setValidationStatus({
      success: true,
      message: "API key removed from browser storage.",
    });
  };

  const handleModelChange = (modelId: string) => {
    setModelInput(modelId);
    setSelectedModel(modelId);
  };

  // Export JSON Backup
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportAllData();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rattafy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON Backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const result = await importAllData(content);
          setImportStatus(
            `Successfully restored ${result.subjectsCount} subjects and ${result.questionsCount} questions!`
          );
        } catch (innerErr: any) {
          alert(`Restore failed: ${innerErr.message}`);
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert(`Failed to read backup file: ${err.message}`);
      setIsImporting(false);
    }
  };

  // Clear Database
  const handleClearDatabase = async () => {
    if (
      confirm(
        "WARNING: This will permanently delete all your subjects, units, questions, and revision notes. Are you sure?"
      )
    ) {
      await clearAllData();
      alert("All data cleared.");
      window.location.href = "/";
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      {/* Title */}
      <div className="border-b border-border-subtle pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
          Manage your Gemini AI integration, export study backups, and configure preferences.
        </p>
      </div>

      {/* Gemini API Key Configuration Section */}
      <div className="rounded-card border border-border-subtle bg-surface p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
            <Key className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Google Gemini API Configuration</h2>
            <p className="text-xs text-foreground-muted">
              Powers multimodal paper scanning (Mode B), syllabus auto-assignment, and AI answer synthesis.
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="rounded-btn border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-xs text-neutral-300 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-300">Client-Side Privacy Guarantee:</span> Your key is stored strictly inside your browser&apos;s <code className="font-mono text-emerald-200">localStorage</code>. It is never logged or sent to any server.
          </div>
        </div>

        {/* Key Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground-secondary">
              Gemini API Key:
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline font-mono"
            >
              Get free key at Google AI Studio
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setValidationStatus(null);
              }}
              placeholder="AIzaSy..."
              className="flex-1 rounded-btn border border-border-subtle bg-black px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isValidating}
                onClick={handleTestAndSaveKey}
                className="px-4 py-2 rounded-btn bg-white text-black text-xs font-semibold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Test & Save
                  </>
                )}
              </button>

              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="px-3 py-2 rounded-btn bg-white/5 border border-border-subtle text-xs text-foreground-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          {validationStatus && (
            <div
              className={`p-3 rounded-btn border text-xs flex items-start gap-2 ${
                validationStatus.success
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}
            >
              {validationStatus.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{validationStatus.message}</span>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <label className="text-xs font-medium text-foreground-secondary flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            Active Gemini Model
          </label>
          <select
            value={modelInput}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-btn border border-border-subtle bg-black px-3 py-2 text-xs font-mono text-foreground focus:border-border-focus focus:outline-none"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-foreground-muted">
            <code className="text-accent-blue font-mono">gemini-2.5-flash</code> is recommended for high-speed multimodal paper OCR and structured JSON responses.
          </p>
        </div>
      </div>

      {/* Data Backup & Portability Section */}
      <div className="rounded-card border border-border-subtle bg-surface p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-foreground">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Data Portability & Backups</h2>
            <p className="text-xs text-foreground-muted">
              Export your study decks to a standalone JSON file or restore across browsers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-btn border border-border-subtle bg-surface-elevated space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Export All Study Decks</h3>
              <p className="text-[11px] text-foreground-muted mt-1">
                Generates a single JSON archive of all your subjects, units, question cards, and revision notes.
              </p>
            </div>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportData}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-btn bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-foreground transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? "Exporting..." : "Download JSON Backup"}
            </button>
          </div>

          <div className="p-4 rounded-btn border border-border-subtle bg-surface-elevated space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-foreground">Restore from Backup</h3>
              <p className="text-[11px] text-foreground-muted mt-1">
                Load a previously exported Rattafy JSON backup file into your browser.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-btn bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-foreground transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                {isImporting ? "Restoring..." : "Restore Backup File"}
              </button>
            </div>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-btn border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-card border border-red-500/20 bg-red-500/[0.03] p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Wipe all local IndexedDB database records from this device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearDatabase}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Purge All Data
        </button>
      </div>
    </div>
  );
}
