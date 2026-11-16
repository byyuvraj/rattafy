"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { parsePastPaperText } from "@/lib/parser";
import {
  getImportDraft,
  setImportDraft,
  clearImportDraft,
} from "@/lib/storage";
import { Subject, Unit, ParsedUnitGroup } from "@/types";
import ImportPreview from "./ImportPreview";
import { useDialog } from "@/components/ui/DialogProvider";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  units: Unit[];
  onImportComplete?: () => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  subject,
  units,
  onImportComplete,
}: ImportModalProps) {
  const { confirm, alert } = useDialog();

  // Text State
  const [pastedText, setPastedText] = useState("");
  const [liveStats, setLiveStats] = useState<{ totalQuestions: number; unitCount: number } | null>(null);

  // Preview State
  const [parsedGroups, setParsedGroups] = useState<ParsedUnitGroup[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const cached = getImportDraft(subject.id);
      if (cached && cached.trim()) {
        setPastedText(cached);
      }
    }
  }, [isOpen, subject.id]);

  // Live preview counter for text mode & Auto-save to draft cache
  useEffect(() => {
    setImportDraft(subject.id, pastedText);

    if (pastedText.trim().length > 10) {
      const res = parsePastPaperText(pastedText);
      setLiveStats({
        totalQuestions: res.totalQuestions,
        unitCount: res.units.length,
      });
    } else {
      setLiveStats(null);
    }
  }, [pastedText, subject.id]);

  const handleClearDraft = async () => {
    const confirmed = await confirm({
      title: "Discard Draft?",
      message: "Are you sure you want to discard your saved draft text? This cannot be undone.",
      confirmLabel: "Discard Draft",
      variant: "danger",
    });
    if (!confirmed) return;
    setPastedText("");
    clearImportDraft(subject.id);
  };

  const handleClose = () => {
    setParsedGroups(null);
    onClose();
  };

  const handleParseText = () => {
    if (!pastedText.trim()) return;
    const result = parsePastPaperText(pastedText);
    setParsedGroups(result.units);
  };

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        const res = parsePastPaperText(content);
        setParsedGroups(res.units);
      }
    };
    reader.readAsText(file);
  };

  // Confirm and persist into Server Database via API
  const handleConfirmImport = async () => {
    if (!parsedGroups || parsedGroups.length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          groups: parsedGroups,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      clearImportDraft(subject.id);
      setPastedText("");
      handleClose();
      onImportComplete?.();
    } catch (err: any) {
      await alert({
        title: "Import Error",
        message: `Failed to save imported questions: ${err.message}`,
        variant: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-4xl max-h-[95dvh] flex flex-col rounded-card border border-border-subtle bg-surface shadow-card modal-glow z-10 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Import Exam Questions</h2>
                <p className="text-xs text-foreground-secondary truncate max-w-[200px] sm:max-w-md">
                  Target: <span className="font-semibold text-foreground">{subject.name}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 scroll-touch">
            {parsedGroups ? (
              // Step 2: Preview Screen
              <div>
                <button
                  type="button"
                  onClick={() => setParsedGroups(null)}
                  className="text-xs text-foreground-secondary hover:text-foreground underline mb-4 inline-flex items-center gap-1 py-1 min-h-[36px]"
                >
                  ← Back to Input
                </button>
                <ImportPreview
                  groups={parsedGroups}
                  existingUnits={units}
                  subjectName={subject.name}
                  onUpdateGroups={setParsedGroups}
                  onConfirm={handleConfirmImport}
                  isSaving={isSaving}
                />
              </div>
            ) : (
              // Step 1: Text Input Screen
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-foreground">
                      Paste past-paper text or upload .txt / .md
                    </label>
                    {liveStats && (
                      <span className="font-mono text-[11px] text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full border border-accent-blue/20">
                        {liveStats.totalQuestions} Qs ({liveStats.unitCount} units)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md"
                      onChange={handleTextFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground px-3 py-2 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:border-border-hover transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload .txt / .md
                    </button>
                  </div>
                </div>

                {pastedText.trim().length > 0 && (
                  <div className="flex items-center justify-between text-[11px] px-1 py-1 rounded bg-white/[0.02] border border-border-subtle/60">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" />
                      Draft auto-saved to browser cache
                    </span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-foreground-muted hover:text-red-400 hover:underline px-2 py-0.5 text-xs"
                    >
                      Clear draft
                    </button>
                  </div>
                )}

                <textarea
                  rows={12}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Unit 1: Introduction to DBMS
Q1. What is a Database Management System? Explain its main advantages over traditional file systems.
[2023 | MST1 | 5 marks]
A Database Management System (DBMS) is system software for creating and managing databases.

Key advantages include:
1. Data Independence: Separation of data structure from application programs.
2. Controlled Redundancy: Eliminates duplicate data entries.
3. Concurrency Control: Allows multiple users to access data simultaneously.
\`\`\`

Unit 2: Relational Model
Q2. Explain the difference between primary key, candidate key, and foreign key with an example.
[2022 | End-Term | 7 marks]
- Candidate Key: Minimal set of attributes that can uniquely identify a tuple.
- Primary Key: The chosen candidate key by the database designer.
- Foreign Key: An attribute matching the primary key of another relation.
\`\`\``}
                  className="w-full rounded-card border border-border-subtle bg-black p-3.5 sm:p-4 font-mono text-base sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none transition-colors"
                />

                {/* Format Guidelines Tip */}
                <div className="flex items-start gap-2.5 p-3 rounded-card bg-white/[0.02] border border-border-subtle text-xs text-foreground-muted">
                  <Info className="h-4 w-4 text-accent-blue shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-foreground-secondary font-medium">Deterministic Format Rules:</p>
                    <p>
                      • Questions begin with <code className="font-mono text-foreground">Q1.</code>, <code className="font-mono text-foreground">Q.1</code>, <code className="font-mono text-foreground">Q1)</code>, or <code className="font-mono text-foreground">Q:</code>.
                    </p>
                    <p>
                      • Answers are terminated strictly by a standalone <code className="font-mono text-foreground">```</code> line. Inner code blocks wrapped in <code className="font-mono text-foreground">~~~</code> are preserved safely.
                    </p>
                    <p>
                      • Unit headers like <code className="font-mono text-foreground">Unit 1: Title</code> automatically group subsequent questions. Metadata tags like <code className="font-mono text-foreground">[2023 | MST1 | 5 marks]</code> are auto-parsed.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!pastedText.trim()}
                    onClick={handleParseText}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-btn bg-white text-black text-sm font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    Parse & Review Questions
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
