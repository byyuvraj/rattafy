"use client";

import { useState } from "react";
import {
  ParsedUnitGroup,
  ParsedQuestion,
  Unit,
} from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  Trash2,
  Edit2,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

interface ImportPreviewProps {
  groups: ParsedUnitGroup[];
  existingUnits: Unit[];
  subjectName: string;
  onUpdateGroups: (groups: ParsedUnitGroup[]) => void;
  onConfirm: () => void;
  isSaving?: boolean;
}

export default function ImportPreview({
  groups,
  subjectName: _subjectName,
  onUpdateGroups,
  onConfirm,
  isSaving = false,
}: ImportPreviewProps) {
  const { confirm } = useDialog();
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [editingQuestion, setEditingQuestion] = useState<{
    unitIndex: number;
    qIndex: number;
    question: string;
    answer: string;
    marks?: number;
    years: string;
    unitNumber: number;
  } | null>(null);

  const toggleUnit = (num: number) => {
    setExpandedUnits((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const totalQuestions = groups.reduce((acc, g) => acc + g.questions.length, 0);

  const handleStartEdit = (uIdx: number, qIdx: number) => {
    const q = groups[uIdx].questions[qIdx];
    setEditingQuestion({
      unitIndex: uIdx,
      qIndex: qIdx,
      question: q.question,
      answer: q.answer,
      marks: q.marks,
      years: q.years.join(", "),
      unitNumber: groups[uIdx].unitNumber,
    });
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    const { unitIndex, qIndex, question, answer, marks, years, unitNumber } = editingQuestion;

    const newGroups = [...groups];
    const targetQ: ParsedQuestion = {
      ...newGroups[unitIndex].questions[qIndex],
      question: question.trim(),
      answer: answer.trim(),
      marks: marks || undefined,
      years: years
        .split(",")
        .map((y) => y.trim())
        .filter(Boolean),
      unitNumber,
    };

    // If unit changed
    if (unitNumber !== newGroups[unitIndex].unitNumber) {
      newGroups[unitIndex].questions.splice(qIndex, 1);
      let destGroup = newGroups.find((g) => g.unitNumber === unitNumber);
      if (!destGroup) {
        destGroup = {
          unitNumber,
          unitTitle: `Unit ${unitNumber}`,
          questions: [],
        };
        newGroups.push(destGroup);
      }
      destGroup.questions.push(targetQ);
    } else {
      newGroups[unitIndex].questions[qIndex] = targetQ;
    }

    const filtered = newGroups.filter((g) => g.questions.length > 0);
    onUpdateGroups(filtered);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (uIdx: number, qIdx: number) => {
    const confirmed = await confirm({
      title: "Remove Question?",
      message: "Are you sure you want to remove this question from the import preview list?",
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    const newGroups = [...groups];
    newGroups[uIdx].questions.splice(qIdx, 1);
    const filtered = newGroups.filter((g) => g.questions.length > 0);
    onUpdateGroups(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-card bg-surface-elevated border border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-foreground">Import Preview</h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
              {totalQuestions} questions detected
            </span>
          </div>
          <p className="text-xs text-foreground-secondary">
            Structured into {groups.length} units. Review, edit, or adjust units before confirming.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving || totalQuestions === 0}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm & Import ({totalQuestions})
          </button>
        </div>
      </div>

      {/* Unit Groups List */}
      <div className="space-y-4">
        {groups.map((group, uIdx) => {
          const isExpanded = expandedUnits[group.unitNumber] ?? true;
          return (
            <div
              key={group.unitNumber}
              className="rounded-card border border-border-subtle bg-surface overflow-hidden transition-all"
            >
              {/* Unit Header Bar */}
              <button
                type="button"
                onClick={() => toggleUnit(group.unitNumber)}
                className="w-full flex items-center justify-between p-3.5 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-b border-border-subtle"
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-foreground-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-foreground-muted" />
                  )}
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground">
                    {group.unitNumber === 0 ? "Unsorted" : `Unit ${group.unitNumber}`}
                  </span>
                  <span className="text-sm font-medium text-foreground">{group.unitTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground-muted">
                    {group.questions.length} {group.questions.length === 1 ? "question" : "questions"}
                  </span>
                </div>
              </button>

              {/* Questions inside Unit */}
              {isExpanded && (
                <div className="divide-y divide-border-subtle">
                  {group.questions.map((q, qIdx) => {
                    const isEditing =
                      editingQuestion &&
                      editingQuestion.unitIndex === uIdx &&
                      editingQuestion.qIndex === qIdx;

                    return (
                      <div key={qIdx} className="p-4 hover:bg-white/[0.01] transition-colors">
                        {isEditing ? (
                          /* Inline Edit Form */
                          <div className="space-y-3 p-3 rounded-btn bg-black/60 border border-border-focus">
                            <div>
                              <label className="text-[11px] font-mono text-foreground-muted block mb-1">
                                Question:
                              </label>
                              <input
                                type="text"
                                value={editingQuestion.question}
                                onChange={(e) =>
                                  setEditingQuestion({ ...editingQuestion, question: e.target.value })
                                }
                                className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-border-focus"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-mono text-foreground-muted block mb-1">
                                Answer (Markdown):
                              </label>
                              <textarea
                                rows={4}
                                value={editingQuestion.answer}
                                onChange={(e) =>
                                  setEditingQuestion({ ...editingQuestion, answer: e.target.value })
                                }
                                className="w-full rounded-btn border border-border-subtle bg-surface px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-border-focus"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[11px] font-mono text-foreground-muted block mb-1">
                                  Marks:
                                </label>
                                <input
                                  type="number"
                                  value={editingQuestion.marks || ""}
                                  onChange={(e) =>
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      marks: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                    })
                                  }
                                  placeholder="e.g. 5"
                                  className="w-full rounded-btn border border-border-subtle bg-surface px-2.5 py-1 text-xs text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-mono text-foreground-muted block mb-1">
                                  Years (comma separated):
                                </label>
                                <input
                                  type="text"
                                  value={editingQuestion.years}
                                  onChange={(e) =>
                                    setEditingQuestion({ ...editingQuestion, years: e.target.value })
                                  }
                                  placeholder="2022, 2023"
                                  className="w-full rounded-btn border border-border-subtle bg-surface px-2.5 py-1 text-xs text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-mono text-foreground-muted block mb-1">
                                  Unit #:
                                </label>
                                <input
                                  type="number"
                                  value={editingQuestion.unitNumber}
                                  onChange={(e) =>
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      unitNumber: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full rounded-btn border border-border-subtle bg-surface px-2.5 py-1 text-xs text-foreground"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2.5 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingQuestion(null)}
                                className="px-3.5 py-2 min-h-[44px] text-xs text-foreground-secondary hover:text-foreground flex items-center justify-center rounded-btn"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className="px-4 py-2 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center justify-center"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Question View */
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              {/* Metadata Badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {q.marks && (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                                    <Award className="h-3 w-3 text-accent-blue" />
                                    {q.marks} Marks
                                  </span>
                                )}
                                {q.years.length > 0 && (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                                    <Clock className="h-3 w-3" />
                                    {q.years.join(", ")}
                                  </span>
                                )}
                              </div>

                              {/* Question title */}
                              <p className="text-xs sm:text-sm font-medium text-foreground">
                                {q.question}
                              </p>

                              {/* Answer preview */}
                              {q.answer ? (
                                <p className="text-xs text-foreground-muted line-clamp-2 font-mono">
                                  {q.answer.substring(0, 150)}...
                                </p>
                              ) : (
                                <span className="text-[11px] text-neutral-500 italic">No answer provided</span>
                              )}
                            </div>

                            {/* Row Actions */}
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(uIdx, qIdx)}
                                title="Edit question"
                                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(uIdx, qIdx)}
                                title="Delete question"
                                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
