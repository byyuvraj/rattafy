"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileDown,
  Copy,
  Check,
  X,
  FileText,
  Eye,
  Code,
  Download,
} from "lucide-react";
import {
  generateSubjectMarkdown,
  getExportFilename,
  downloadMarkdownFile,
  ExportSubjectData,
  ExportUnitData,
  ExportQuestionData,
} from "@/lib/exportMarkdown";

interface ExportSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: ExportSubjectData;
  units: ExportUnitData[];
  questions: ExportQuestionData[];
}

export default function ExportSubjectModal({
  isOpen,
  onClose,
  subject,
  units,
  questions,
}: ExportSubjectModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  if (!isOpen) return null;

  const markdownContent = generateSubjectMarkdown(subject, units, questions);
  const filename = getExportFilename(subject);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadMarkdownFile(markdownContent, filename);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl rounded-card border border-border-subtle bg-surface p-5 sm:p-6 shadow-card modal-glow z-10 my-8 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                <FileDown className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Extract Questions (.md)
                </h2>
                <p className="text-xs text-foreground-muted font-mono flex items-center gap-1.5 flex-wrap">
                  <span>{subject.name}</span>
                  {subject.code && <span>• {subject.code}</span>}
                  <span>• {questions.length} questions</span>
                  <span>• {units.length} units</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-btn bg-white/[0.02] border border-border-subtle text-xs">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">
                Target File: <span className="font-mono text-accent-blue">{filename}</span>
              </p>
              <p className="text-[11px] text-foreground-muted">
                Fully structured format containing unit headers, tags, answers, formulas, and diagram URLs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-foreground border border-border-subtle text-xs font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          {/* Markdown Content Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-foreground-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-3 w-3 text-accent-blue" />
                <span>Structured Markdown Preview</span>
              </label>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[11px] font-mono text-foreground-muted hover:text-foreground inline-flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                <span>{showPreview ? "Collapse Preview" : "Show Preview"}</span>
              </button>
            </div>

            {showPreview && (
              <div className="relative rounded-btn border border-border-subtle bg-black/60 overflow-hidden">
                <pre className="p-3 text-xs font-mono text-neutral-300 overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap select-all">
                  {markdownContent}
                </pre>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1 font-mono">
              <FileText className="h-3 w-3" />
              100% compatible with Rattafy Past-Paper Import
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
