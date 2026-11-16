"use client";

import { useState, useMemo } from "react";
import { Question, Unit, Subject } from "@/types";
import { db } from "@/lib/db";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Award,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import MarkdownContent from "../study/MarkdownContent";
import { useDialog } from "@/components/ui/DialogProvider";

interface OverviewModeProps {
  subject: Subject;
  unit?: Unit;
  questions: Question[];
  onClose: () => void;
  onQuestionsUpdated?: () => void;
}

export default function OverviewMode({
  subject,
  unit,
  questions,
  onClose,
  onQuestionsUpdated,
}: OverviewModeProps) {
  const { confirm } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Status filter
      if (statusFilter === "known" && q.status !== "known") return false;
      if (statusFilter === "learning" && q.status !== "learning") return false;
      if (statusFilter === "new" && q.status !== "new") return false;
      if (statusFilter === "starred" && !q.starred) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query) ||
        q.years.some((y) => y.toLowerCase().includes(query)) ||
        q.exams.some((e) => e.toLowerCase().includes(query))
      );
    });
  }, [questions, searchQuery, statusFilter]);

  const handleToggleStar = async (q: Question) => {
    await db.questions.update(q.id, { starred: !q.starred });
    onQuestionsUpdated?.();
  };

  const handleSetStatus = async (q: Question, status: "known" | "learning" | "new") => {
    await db.questions.update(q.id, { status });
    onQuestionsUpdated?.();
  };

  const handleDelete = async (q: Question) => {
    const confirmed = await confirm({
      title: "Delete Question?",
      message: "Are you sure you want to delete this question? This cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (confirmed) {
      await db.questions.delete(q.id);
      onQuestionsUpdated?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-foreground-secondary hover:text-foreground underline mb-1 inline-flex items-center gap-1"
          >
            ← Back to Units
          </button>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {unit ? `Overview: Unit ${unit.number} — ${unit.title}` : `All Questions Overview: ${subject.name}`}
          </h2>
          <p className="text-xs text-foreground-secondary">
            Quick-scan {filteredQuestions.length} questions before test hour.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-stretch sm:self-auto px-4 py-2 min-h-[44px] flex items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-xs font-semibold text-foreground hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          Exit Overview
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, answers, years..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-btn bg-surface border border-border-subtle text-sm sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scroll-touch">
          {[
            { id: "all", label: "All" },
            { id: "known", label: "Known" },
            { id: "learning", label: "Learning" },
            { id: "new", label: "New" },
            { id: "starred", label: "Starred" },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3.5 py-2 min-h-[38px] flex items-center rounded-btn text-xs font-mono transition-colors shrink-0 ${
                statusFilter === pill.id
                  ? "bg-white text-black font-semibold"
                  : "bg-surface border border-border-subtle text-foreground-secondary hover:text-foreground hover:bg-white/5"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Accordion List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-card border border-border-subtle bg-surface">
            <FileText className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="text-xs text-foreground-muted mt-1">
              Try adjusting your search terms or filter selection.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isExpanded = expandedQuestions[q.id] ?? false;

            return (
              <div
                key={q.id}
                className="rounded-card border border-border-subtle bg-surface hover:border-border-hover transition-colors overflow-hidden"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-3 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button type="button" className="mt-0.5 text-foreground-muted">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.2 rounded-full uppercase tracking-wider font-semibold border ${
                            q.status === "known"
                              ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                              : q.status === "learning"
                              ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30"
                              : "bg-white/5 text-foreground-secondary border-border-subtle"
                          }`}
                        >
                          {q.status}
                        </span>

                        {q.marks && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-foreground-secondary border border-border-subtle">
                            {q.marks} Marks
                          </span>
                        )}

                        {q.years.length > 0 && (
                          <span className="font-mono text-[10px] text-foreground-muted">
                            [{q.years.join(", ")}]
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-foreground leading-snug">
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 shrink-0 pt-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleStar(q)}
                      title="Star"
                      className={`p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn hover:bg-white/5 transition-colors ${
                        q.starred ? "text-amber-400" : "text-foreground-muted"
                      }`}
                    >
                      <Star className={`h-4 w-4 ${q.starred ? "fill-amber-400" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(q)}
                      title="Delete question"
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Answer Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border-subtle bg-black/40 space-y-4">
                    <MarkdownContent content={q.answer} />

                    {/* Status change bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border-subtle/60 text-xs">
                      <span className="text-foreground-muted font-mono">Quick Status:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(q, "new")}
                          className={`px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-btn font-mono text-xs ${
                            q.status === "new"
                              ? "bg-white text-black font-semibold"
                              : "text-foreground-secondary hover:bg-white/5"
                          }`}
                        >
                          New
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(q, "learning")}
                          className={`px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-btn font-mono text-xs ${
                            q.status === "learning"
                              ? "bg-amber-400 text-black font-semibold"
                              : "text-amber-400 hover:bg-amber-400/10"
                          }`}
                        >
                          Revise
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(q, "known")}
                          className={`px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-btn font-mono text-xs ${
                            q.status === "known"
                              ? "bg-emerald-400 text-black font-semibold"
                              : "text-emerald-400 hover:bg-emerald-400/10"
                          }`}
                        >
                          Known
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
