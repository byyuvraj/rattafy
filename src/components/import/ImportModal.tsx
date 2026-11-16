"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Camera,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { parsePastPaperText } from "@/lib/parser";
import { extractQuestionsFromMedia, fileToBase64 } from "@/lib/gemini";
import { getApiKey, getSelectedModel } from "@/lib/storage";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { Subject, Unit, ParsedUnitGroup, ParsedQuestion } from "@/types";
import ImportPreview from "./ImportPreview";

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
  const [activeTab, setActiveTab] = useState<"text" | "scan">("text");

  // Mode A: Text State
  const [pastedText, setPastedText] = useState("");
  const [liveStats, setLiveStats] = useState<{ totalQuestions: number; unitCount: number } | null>(null);

  // Mode B: Scan State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    currentFile: string;
    completed: number;
    total: number;
    error?: string;
  } | null>(null);

  // Preview State
  const [parsedGroups, setParsedGroups] = useState<ParsedUnitGroup[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasApiKey(Boolean(getApiKey()));
  }, [isOpen]);

  // Live preview counter for text mode
  useEffect(() => {
    if (activeTab === "text" && pastedText.trim().length > 10) {
      const res = parsePastPaperText(pastedText);
      setLiveStats({
        totalQuestions: res.totalQuestions,
        unitCount: res.units.length,
      });
    } else {
      setLiveStats(null);
    }
  }, [pastedText, activeTab]);

  // Reset when closing
  const handleClose = () => {
    setParsedGroups(null);
    setPastedText("");
    setSelectedFiles([]);
    setScanProgress(null);
    onClose();
  };

  // Mode A: Parse and go to preview
  const handleParseText = () => {
    if (!pastedText.trim()) return;
    const result = parsePastPaperText(pastedText);
    setParsedGroups(result.units);
  };

  // Upload .txt or .md file for Mode A
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

  // Mode B: Gemini Paper Scanner
  const handleMediaFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleStartScan = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      alert("Please configure your Google Gemini API key in Settings or Onboarding first.");
      return;
    }

    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setScanProgress({
      currentFile: selectedFiles[0].name,
      completed: 0,
      total: selectedFiles.length,
    });

    const model = getSelectedModel();
    const syllabus = subject.syllabus || "";
    const allExtractedQuestions: ParsedQuestion[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setScanProgress({
          currentFile: file.name,
          completed: i,
          total: selectedFiles.length,
        });

        const fileData = await fileToBase64(file);
        const extracted = await extractQuestionsFromMedia(
          apiKey,
          model,
          fileData,
          syllabus
        );

        for (const item of extracted) {
          if (!item.question || !item.question.trim()) continue;

          allExtractedQuestions.push({
            question: item.question.trim(),
            answer: item.answer?.trim() || "",
            unitNumber: item.unit !== undefined && item.unit !== null ? item.unit : 0,
            unitTitle: item.unitTitle || (item.unit ? `Unit ${item.unit}` : "Unsorted Questions"),
            marks: item.marks || undefined,
            years: item.year ? [item.year] : [],
            exams: item.exam ? [item.exam] : [],
            repeatCount: 1,
            aiGenerated: false,
          });
        }
      }

      // Group extracted questions by unit and merge duplicates
      const unitMap = new Map<number, ParsedUnitGroup>();

      for (const q of allExtractedQuestions) {
        const unitNum = q.unitNumber ?? 0;
        if (!unitMap.has(unitNum)) {
          unitMap.set(unitNum, {
            unitNumber: unitNum,
            unitTitle: q.unitTitle || (unitNum === 0 ? "Unsorted Questions" : `Unit ${unitNum}`),
            questions: [],
          });
        }

        const group = unitMap.get(unitNum)!;
        const normQ = q.question.toLowerCase().replace(/[^\w\s]/g, "").trim();
        const existing = group.questions.find(
          (ex) => ex.question.toLowerCase().replace(/[^\w\s]/g, "").trim() === normQ
        );

        if (existing) {
          existing.years = Array.from(new Set([...existing.years, ...q.years]));
          existing.exams = Array.from(new Set([...existing.exams, ...q.exams]));
          existing.repeatCount = Math.max(existing.repeatCount + 1, existing.years.length);
          if (q.answer && (!existing.answer || q.answer.length > existing.answer.length)) {
            existing.answer = q.answer;
          }
        } else {
          group.questions.push(q);
        }
      }

      const sortedGroups = Array.from(unitMap.values()).sort((a, b) => {
        if (a.unitNumber === 0) return 1;
        if (b.unitNumber === 0) return -1;
        return a.unitNumber - b.unitNumber;
      });

      setParsedGroups(sortedGroups);
    } catch (err: any) {
      alert(`Paper scanning failed: ${err.message}`);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  // Confirm and persist everything into Dexie IndexedDB
  const handleConfirmImport = async () => {
    if (!parsedGroups || parsedGroups.length === 0) return;

    setIsSaving(true);
    try {
      const now = Date.now();
      const existingUnits = await db.units.where("subjectId").equals(subject.id).toArray();
      const unitMapByNumber = new Map<number, string>();

      existingUnits.forEach((u) => {
        unitMapByNumber.set(u.number, u.id);
      });

      const newUnitsToAdd: Unit[] = [];
      const newQuestionsToAdd: any[] = [];

      for (const group of parsedGroups) {
        let unitId = unitMapByNumber.get(group.unitNumber);

        // If unit doesn't exist yet in DB, create it
        if (!unitId) {
          unitId = generateId();
          unitMapByNumber.set(group.unitNumber, unitId);
          newUnitsToAdd.push({
            id: unitId,
            subjectId: subject.id,
            number: group.unitNumber,
            title: group.unitTitle || (group.unitNumber === 0 ? "Unsorted Questions" : `Unit ${group.unitNumber}`),
          });
        }

        // Add questions under this unit
        for (const q of group.questions) {
          newQuestionsToAdd.push({
            id: generateId(),
            subjectId: subject.id,
            unitId: unitId,
            question: q.question,
            answer: q.answer,
            marks: q.marks,
            years: q.years || [],
            exams: q.exams || [],
            repeatCount: q.repeatCount || (q.years && q.years.length > 1 ? q.years.length : 1),
            status: "new",
            starred: false,
            notes: "",
            aiGenerated: Boolean(q.aiGenerated),
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      await db.transaction("rw", db.units, db.questions, async () => {
        if (newUnitsToAdd.length > 0) {
          await db.units.bulkAdd(newUnitsToAdd);
        }
        if (newQuestionsToAdd.length > 0) {
          await db.questions.bulkAdd(newQuestionsToAdd);
        }
      });

      handleClose();
      onImportComplete?.();
    } catch (err: any) {
      alert(`Failed to save imported questions: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
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
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-card border border-border-subtle bg-surface shadow-card modal-glow z-10 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Import Exam Content</h2>
                <p className="text-xs text-foreground-secondary">
                  Target: <span className="font-semibold text-foreground">{subject.name}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-btn text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {parsedGroups ? (
              // Step 2: Preview Screen
              <div>
                <button
                  type="button"
                  onClick={() => setParsedGroups(null)}
                  className="text-xs text-foreground-secondary hover:text-foreground underline mb-4 block"
                >
                  ← Back to Upload / Input
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
              // Step 1: Input Mode Selection & Inputs
              <div className="space-y-6">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-card bg-black/50 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-btn text-xs font-semibold transition-all ${
                      activeTab === "text"
                        ? "bg-white text-black shadow-sm"
                        : "text-foreground-secondary hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    MODE A: Smart Text Import
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                      No API needed
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("scan")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-btn text-xs font-semibold transition-all ${
                      activeTab === "scan"
                        ? "bg-white text-black shadow-sm"
                        : "text-foreground-secondary hover:text-foreground hover:bg-white/[0.03]"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-accent-blue" />
                    MODE B: Scan with Gemini
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-accent-blue/20 text-accent-blue">
                      Multimodal
                    </span>
                  </button>
                </div>

                {/* MODE A Content */}
                {activeTab === "text" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-foreground">
                          Paste past-paper text or upload .txt / .md
                        </label>
                        {liveStats && (
                          <span className="font-mono text-[11px] text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full border border-accent-blue/20">
                            Detected {liveStats.totalQuestions} questions across {liveStats.unitCount} units
                          </span>
                        )}
                      </div>

                      <div>
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
                          className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground px-2.5 py-1 rounded bg-white/5 border border-border-subtle hover:border-border-hover transition-colors"
                        >
                          <Upload className="h-3 w-3" />
                          Upload file
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={12}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`Unit 1: Introduction
Q1. What is a database management system?
[2023 | MST1 | 5 marks]
A DBMS is software that stores, retrieves and manages data...
\`\`\`

Q2. Explain 3-Schema Architecture with diagrams.
[2022 | EndSem | 10 marks]
The ANSI/SPARC 3-schema architecture consists of:
1. Physical level
2. Logical level
3. External view level
\`\`\``}
                      className="w-full rounded-card border border-border-subtle bg-black p-4 font-mono text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none transition-colors"
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
                          • Unit lines like <code className="font-mono text-foreground">Unit 1: Title</code> switch the active unit. Metadata tags like <code className="font-mono text-foreground">[2023 | MST1 | 5 marks]</code> are auto-parsed.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={!pastedText.trim()}
                        onClick={handleParseText}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        Parse & Review Questions
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE B Content */}
                {activeTab === "scan" && (
                  <div className="space-y-4">
                    {!hasApiKey && (
                      <div className="flex items-start gap-3 p-3.5 rounded-card border border-amber-500/20 bg-amber-500/10 text-xs text-amber-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Gemini API Key Required</p>
                          <p className="text-neutral-300">
                            Paper scanning requires a Gemini API key. Add your key in{" "}
                            <a href="/settings" className="underline text-accent-blue font-medium">
                              Settings
                            </a>{" "}
                            to unlock multimodal OCR, syllabus mapping, and question deduplication.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div
                      onClick={() => mediaInputRef.current?.click()}
                      className="border-2 border-dashed border-border-subtle hover:border-accent-blue/50 rounded-card p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.01] hover:bg-white/[0.03]"
                    >
                      <input
                        ref={mediaInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleMediaFilesSelected}
                        className="hidden"
                      />
                      <div className="h-12 w-12 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-3">
                        <Camera className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground text-center">
                        Upload past papers, MST sheets, or handwritten question photos
                      </p>
                      <p className="text-xs text-foreground-muted mt-1 text-center">
                        Supports PNG, JPG, WebP, and PDF pages. Select multiple sheets at once.
                      </p>
                    </div>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-foreground-secondary">
                          <span>{selectedFiles.length} files selected:</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles([])}
                            className="text-red-400 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                          {selectedFiles.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-3 py-2 rounded-btn bg-surface-elevated border border-border-subtle text-xs"
                            >
                              <span className="truncate max-w-[200px] text-foreground font-mono">{f.name}</span>
                              <span className="text-[10px] text-foreground-muted">
                                {(f.size / 1024).toFixed(0)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scan Progress */}
                    {isScanning && scanProgress && (
                      <div className="p-4 rounded-card bg-surface-elevated border border-border-subtle space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-accent-blue font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Scanning {scanProgress.currentFile}...
                          </span>
                          <span className="font-mono text-foreground-muted">
                            {scanProgress.completed + 1} of {scanProgress.total}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-accent-blue transition-all duration-300"
                            style={{
                              width: `${((scanProgress.completed + 1) / scanProgress.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subject Syllabus Context Notice */}
                    {subject.syllabus && (
                      <div className="p-3 rounded-card bg-white/[0.02] border border-border-subtle text-xs text-foreground-muted flex items-start gap-2">
                        <Layers className="h-4 w-4 text-foreground-secondary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-foreground-secondary font-medium">Syllabus Mapping Active:</span>{" "}
                          Gemini will automatically map questions to your subject&apos;s registered units.
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        disabled={selectedFiles.length === 0 || isScanning || !hasApiKey}
                        onClick={handleStartScan}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Extracting Papers...
                          </>
                        ) : (
                          <>
                            Scan with Gemini
                            <Sparkles className="h-4 w-4 text-accent-blue" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
