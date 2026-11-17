"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Subject, Unit, Question } from "@/types";
import AddSubjectModal from "@/components/home/AddSubjectModal";
import EditSubjectModal from "@/components/home/EditSubjectModal";
import ImportModal from "@/components/import/ImportModal";
import { useDialog } from "@/components/ui/DialogProvider";
import {
  ShieldCheck,
  Lock,
  LogOut,
  Plus,
  Upload,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
  ExternalLink,
  Edit2,
  Edit3,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import AnswerWithDiagramEditor from "@/components/admin/AnswerWithDiagramEditor";

export default function AdminPage() {
  const { confirm, alert } = useDialog();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Subjects & Content state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [activeSubjectForImport, setActiveSubjectForImport] = useState<{
    subject: Subject;
    units: Unit[];
  } | null>(null);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Expanded subject details (units & questions)
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [subjectDetails, setSubjectDetails] = useState<{
    units: Unit[];
    questions: Question[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Edit Unit / Add Unit state
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editAnsText, setEditAnsText] = useState("");
  const [editMarks, setEditMarks] = useState<number | undefined>(undefined);

  // Add Question state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQUnitId, setNewQUnitId] = useState("");
  const [newQText, setNewQText] = useState("");
  const [newQAns, setNewQAns] = useState("");
  const [newQMarks, setNewQMarks] = useState<number | undefined>(undefined);
  const [newQYears, setNewQYears] = useState("");
  const [isSavingNewQ, setIsSavingNewQ] = useState(false);

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      setIsLoadingSubjects(true);
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch {
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSubjects();
    }
  }, [isAuthenticated, loadSubjects]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsVerifying(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      if (!res.ok) {
        setAuthError("Incorrect passcode. Please check your ADMIN_PASSWORD.");
        return;
      }

      setIsAuthenticated(true);
      setPasscode("");
    } catch {
      setAuthError("Failed to reach server. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setSubjects([]);
    setExpandedSubjectId(null);
  };

  const loadSubjectDetails = async (id: string) => {
    if (expandedSubjectId === id) {
      setExpandedSubjectId(null);
      setSubjectDetails(null);
      return;
    }

    setExpandedSubjectId(id);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubjectDetails({
          units: data.units || [],
          questions: data.questions || [],
        });
      }
    } catch {
      setSubjectDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteSubject = async (sub: Subject) => {
    const confirmed = await confirm({
      title: "Delete Subject?",
      message: `Are you sure you want to permanently delete "${sub.name}" and all its questions from the database?`,
      confirmLabel: "Delete Subject",
      variant: "danger",
    });

    if (confirmed) {
      try {
        const res = await fetch(`/api/subjects/${sub.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        loadSubjects();
        if (expandedSubjectId === sub.id) {
          setExpandedSubjectId(null);
          setSubjectDetails(null);
        }
      } catch (err: any) {
        await alert({
          title: "Delete Error",
          message: err.message,
          variant: "danger",
        });
      }
    }
  };

  const handleOpenImport = async (sub: Subject) => {
    try {
      const res = await fetch(`/api/subjects/${sub.id}`);
      const data = await res.json();
      setActiveSubjectForImport({
        subject: sub,
        units: data.units || [],
      });
    } catch {
      setActiveSubjectForImport({
        subject: sub,
        units: [],
      });
    }
  };

  const handleAddUnit = async (subjectId: string) => {
    if (!newUnitTitle.trim() || !subjectDetails) return;
    try {
      const nextNum = subjectDetails.units.length + 1;
      const res = await fetch(`/api/subjects/${subjectId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: nextNum, title: newUnitTitle.trim() }),
      });
      if (res.ok) {
        setNewUnitTitle("");
        setIsAddingUnit(false);
        loadSubjectDetails(subjectId);
        loadSubjects();
      }
    } catch {}
  };

  const handleDeleteUnit = async (subjectId: string, unitId: string) => {
    const confirmed = await confirm({
      title: "Delete Unit?",
      message: "Are you sure you want to delete this unit and its questions?",
      confirmLabel: "Delete Unit",
      variant: "danger",
    });
    if (confirmed) {
      await fetch(`/api/units/${unitId}`, { method: "DELETE" });
      loadSubjectDetails(subjectId);
      loadSubjects();
    }
  };

  const handleDeleteQuestion = async (subjectId: string, qId: string) => {
    const confirmed = await confirm({
      title: "Delete Question?",
      message: "Are you sure you want to delete this question?",
      confirmLabel: "Delete Question",
      variant: "danger",
    });
    if (confirmed) {
      await fetch(`/api/questions/${qId}`, { method: "DELETE" });
      loadSubjectDetails(subjectId);
      loadSubjects();
    }
  };

  const handleSaveQuestionEdit = async (subjectId: string, qId: string) => {
    try {
      await fetch(`/api/questions/${qId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editQText,
          answer: editAnsText,
          marks: editMarks,
        }),
      });
      setEditingQuestionId(null);
      loadSubjectDetails(subjectId);
    } catch {}
  };

  const handleCreateQuestion = async (subjectId: string) => {
    if (!newQText.trim()) return;
    setIsSavingNewQ(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          unitId: newQUnitId || undefined,
          question: newQText,
          answer: newQAns,
          marks: newQMarks,
          years: newQYears ? newQYears.split(",").map((y) => y.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        setIsAddingQuestion(false);
        setNewQText("");
        setNewQAns("");
        setNewQMarks(undefined);
        setNewQYears("");
        loadSubjectDetails(subjectId);
        loadSubjects();
      }
    } catch {
    } finally {
      setIsSavingNewQ(false);
    }
  };

  // 1. Initial Loading Screen
  if (isAuthenticated === null) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  // 2. Lockscreen / Passcode Prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 hero-glow">
        <div className="w-full max-w-md rounded-card border border-border-subtle bg-surface p-6 sm:p-8 shadow-card modal-glow space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-accent-blue mx-auto mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Rattafy Admin Portal
            </h1>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Enter your admin passcode to manage subjects, upload past papers, and publish exam questions for visitors.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full rounded-btn border border-border-subtle bg-black px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-btn bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !passcode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Unlock Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-foreground-muted hover:text-foreground underline">
              ← Return to Student View
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-card border border-border-subtle bg-surface p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent-green px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
              Admin Session Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Rattafy Administration
            </h1>
            <p className="text-xs text-foreground-secondary">
              Upload past-paper questions and organize units. Any content published here is instantly available for students visiting the site.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-medium text-foreground-secondary hover:text-foreground transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent-blue" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-secondary font-mono">
              Published Subjects ({subjects.length})
            </h2>
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline"
          >
            <span>View Student Site</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {isLoadingSubjects ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-card border border-dashed border-border-subtle p-12 text-center bg-white/[0.01]">
            <BookOpen className="h-8 w-8 text-foreground-muted mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">No subjects created yet</h3>
            <p className="text-xs text-foreground-secondary max-w-sm mx-auto mt-1 mb-4">
              Click &quot;Add Subject&quot; above to create your first subject, then import past-paper questions.
            </p>
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />
              Create First Subject
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => {
              const isExpanded = expandedSubjectId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="rounded-card border border-border-subtle bg-surface overflow-hidden transition-all"
                >
                  {/* Subject Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <button
                      type="button"
                      onClick={() => loadSubjectDetails(sub.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-foreground-muted shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground-muted shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                            {sub.name}
                          </h3>
                          {sub.code && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                              {sub.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                          {sub.branch && <span>{sub.branch} •</span>}
                          {sub.year && <span>{sub.year} •</span>}
                          <span>{sub.unitsCount || 0} units</span>
                          <span>• {sub.questionsCount || 0} questions</span>
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenImport(sub)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-btn bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-xs font-semibold hover:bg-accent-blue/20 transition-all"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Import Papers
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingSubject(sub)}
                        className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        title="Edit subject details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <Link
                        href={`/subject/${sub.id}`}
                        target="_blank"
                        className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-secondary hover:text-foreground hover:bg-white/5 transition-colors"
                        title="Preview subject page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub)}
                        className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-btn text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Accordion: Units & Questions Manager */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 border-t border-border-subtle bg-black/40 space-y-6">
                      {isLoadingDetails ? (
                        <div className="py-6 flex justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
                        </div>
                      ) : subjectDetails ? (
                        <div className="space-y-6">
                          {/* Subject Meta & Quick Edit Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle/60">
                            <div className="text-xs text-foreground-muted font-mono flex items-center gap-2 flex-wrap">
                              {sub.code && (
                                <span className="font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20">
                                  {sub.code}
                                </span>
                              )}
                              {sub.branch && <span className="text-foreground-secondary">{sub.branch}</span>}
                              {sub.year && <span>• {sub.year}</span>}
                              {sub.syllabus && (
                                <span className="italic text-[11px] truncate max-w-xs text-foreground-muted">
                                  Notes configured
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingSubject(sub)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn bg-white/5 hover:bg-white/10 text-foreground hover:text-white border border-border-subtle transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-accent-blue" />
                              Edit Subject Info
                            </button>
                          </div>

                          {/* Units List */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground-secondary">
                                Units in {sub.name}
                              </h4>
                              {!isAddingUnit && (
                                <button
                                  type="button"
                                  onClick={() => setIsAddingUnit(true)}
                                  className="text-xs text-accent-blue hover:underline inline-flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Unit
                                </button>
                              )}
                            </div>

                            {isAddingUnit && (
                              <div className="flex items-center gap-2 p-2 rounded-btn bg-surface border border-border-focus">
                                <input
                                  type="text"
                                  placeholder="New unit title..."
                                  value={newUnitTitle}
                                  onChange={(e) => setNewUnitTitle(e.target.value)}
                                  className="flex-1 bg-transparent px-2 text-xs text-foreground focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddUnit(sub.id)}
                                  className="px-3 py-1 rounded bg-white text-black text-xs font-bold"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingUnit(false)}
                                  className="px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {subjectDetails.units.map((u) => {
                                const qCount = subjectDetails.questions.filter(
                                  (q) => q.unitId === u.id
                                ).length;

                                return (
                                  <div
                                    key={u.id}
                                    className="flex items-center justify-between p-2.5 rounded-btn bg-surface border border-border-subtle text-xs"
                                  >
                                    <div className="truncate min-w-0 pr-2">
                                      <span className="font-mono text-foreground-muted mr-1.5">
                                        #{u.number}
                                      </span>
                                      <span className="font-medium text-foreground">{u.title}</span>
                                      <span className="text-[10px] text-foreground-muted ml-2 font-mono">
                                        ({qCount} Qs)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUnit(sub.id, u.id)}
                                      className="text-foreground-muted hover:text-red-400 p-1"
                                      title="Delete unit"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Questions Management */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground-secondary">
                                Questions ({subjectDetails.questions.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingQuestion(!isAddingQuestion);
                                  if (!newQUnitId && subjectDetails.units.length > 0) {
                                    setNewQUnitId(subjectDetails.units[0].id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn bg-white/10 hover:bg-white/15 text-xs text-foreground font-medium transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>{isAddingQuestion ? "Cancel" : "Add Question"}</span>
                              </button>
                            </div>

                            {/* Add Question Card */}
                            {isAddingQuestion && (
                              <div className="p-3 sm:p-4 rounded-card bg-black/60 border border-border-focus space-y-3">
                                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                                  <span className="text-xs font-semibold text-foreground">Create New Question</span>
                                  <span className="text-[10px] font-mono text-foreground-muted">Subject: {sub.name}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div className="sm:col-span-2">
                                    <label className="text-[10px] font-mono text-foreground-muted block mb-1">
                                      Target Unit
                                    </label>
                                    <select
                                      value={newQUnitId}
                                      onChange={(e) => setNewQUnitId(e.target.value)}
                                      className="w-full bg-surface border border-border-subtle px-2.5 py-1.5 text-xs text-foreground rounded-btn focus:outline-none"
                                    >
                                      {subjectDetails.units.map((u) => (
                                        <option key={u.id} value={u.id}>
                                          Unit #{u.number}: {u.title}
                                        </option>
                                      ))}
                                      {subjectDetails.units.length === 0 && (
                                        <option value="">Unit 1 (Auto-created)</option>
                                      )}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-mono text-foreground-muted block mb-1">
                                        Marks
                                      </label>
                                      <input
                                        type="number"
                                        placeholder="e.g. 5"
                                        value={newQMarks || ""}
                                        onChange={(e) =>
                                          setNewQMarks(e.target.value ? parseInt(e.target.value, 10) : undefined)
                                        }
                                        className="w-full bg-surface border border-border-subtle px-2.5 py-1.5 text-xs text-foreground rounded-btn focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-mono text-foreground-muted block mb-1">
                                        Years
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="2023, 2024"
                                        value={newQYears}
                                        onChange={(e) => setNewQYears(e.target.value)}
                                        className="w-full bg-surface border border-border-subtle px-2.5 py-1.5 text-xs text-foreground rounded-btn focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono text-foreground-muted block mb-1">
                                    Question Text *
                                  </label>
                                  <input
                                    type="text"
                                    value={newQText}
                                    onChange={(e) => setNewQText(e.target.value)}
                                    className="w-full bg-surface border border-border-subtle px-2.5 py-1.5 text-xs text-foreground rounded-btn focus:outline-none"
                                    placeholder="e.g. Explain 8086 microprocessor architecture with a neat block diagram."
                                  />
                                </div>

                                <AnswerWithDiagramEditor
                                  value={newQAns}
                                  onChange={setNewQAns}
                                  label="Answer Content (Markdown & Diagram URLs)"
                                  placeholder="Type answer explanation here. Click '+ Add Diagram URL' above to attach diagrams and preview them live..."
                                  rows={4}
                                />

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingQuestion(false);
                                      setNewQText("");
                                      setNewQAns("");
                                    }}
                                    className="px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!newQText.trim() || isSavingNewQ}
                                    onClick={() => handleCreateQuestion(sub.id)}
                                    className="px-4 py-1.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                                  >
                                    {isSavingNewQ ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Save Question</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {subjectDetails.questions.length === 0 ? (
                              <p className="text-xs text-foreground-muted italic py-2">
                                No questions uploaded yet. Click &quot;Add Question&quot; above or &quot;Import Papers&quot; to import questions from file/text.
                              </p>
                            ) : (
                              <div className="divide-y divide-border-subtle max-h-96 overflow-y-auto rounded-card border border-border-subtle bg-surface">
                                {subjectDetails.questions.map((q) => {
                                  const isEditing = editingQuestionId === q.id;

                                  return (
                                    <div key={q.id} className="p-3 text-xs space-y-2">
                                      {isEditing ? (
                                        <div className="space-y-3 p-3 rounded-card bg-black/60 border border-border-focus">
                                          <div>
                                            <label className="text-[10px] font-mono text-foreground-muted block mb-1">
                                              Question Text
                                            </label>
                                            <input
                                              type="text"
                                              value={editQText}
                                              onChange={(e) => setEditQText(e.target.value)}
                                              className="w-full bg-surface border border-border-subtle px-2.5 py-1.5 text-xs text-foreground rounded-btn focus:outline-none"
                                              placeholder="Question text"
                                            />
                                          </div>

                                          <AnswerWithDiagramEditor
                                            value={editAnsText}
                                            onChange={setEditAnsText}
                                            label="Answer (Markdown & Diagram URLs)"
                                            placeholder="Answer text... Click 'Add Diagram URL' to insert diagrams."
                                            rows={4}
                                          />

                                          <div className="flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-2">
                                              <label className="text-[10px] font-mono text-foreground-muted">Marks:</label>
                                              <input
                                                type="number"
                                                value={editMarks || ""}
                                                onChange={(e) =>
                                                  setEditMarks(
                                                    e.target.value ? parseInt(e.target.value, 10) : undefined
                                                  )
                                                }
                                                className="w-20 bg-surface border border-border-subtle px-2 py-1 text-xs text-foreground rounded-btn focus:outline-none"
                                                placeholder="Marks"
                                              />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => setEditingQuestionId(null)}
                                                className="px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveQuestionEdit(sub.id, q.id)}
                                                className="px-4 py-1.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
                                              >
                                                Save Changes
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              {q.marks && (
                                                <span className="font-mono text-[10px] text-foreground-muted px-1.5 py-0.5 rounded bg-white/5 border border-border-subtle">
                                                  {q.marks} Marks
                                                </span>
                                              )}
                                              {/!\[.*?\]\(.*?\)/.test(q.answer) && (
                                                <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-blue/15 border border-accent-blue/30 text-accent-blue">
                                                  <ImageIcon className="h-2.5 w-2.5" />
                                                  Diagram
                                                </span>
                                              )}
                                            </div>
                                            <p className="font-semibold text-foreground text-xs">{q.question}</p>
                                            {q.answer && (
                                              <p className="text-foreground-muted line-clamp-2 font-mono text-[11px]">
                                                {q.answer}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingQuestionId(q.id);
                                                setEditQText(q.question);
                                                setEditAnsText(q.answer);
                                                setEditMarks(q.marks);
                                              }}
                                              className="p-1.5 text-foreground-muted hover:text-foreground rounded"
                                              title="Edit question"
                                            >
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteQuestion(sub.id, q.id)}
                                              className="p-1.5 text-foreground-muted hover:text-red-400 rounded"
                                              title="Delete question"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
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
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onSubjectAdded={() => loadSubjects()}
      />

      {/* Edit Subject Modal */}
      <EditSubjectModal
        isOpen={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
        subject={editingSubject}
        onSubjectUpdated={() => {
          loadSubjects();
          if (expandedSubjectId && editingSubject && expandedSubjectId === editingSubject.id) {
            loadSubjectDetails(editingSubject.id);
          }
        }}
      />

      {/* Import Modal */}
      {activeSubjectForImport && (
        <ImportModal
          isOpen={Boolean(activeSubjectForImport)}
          onClose={() => setActiveSubjectForImport(null)}
          subject={activeSubjectForImport.subject}
          units={activeSubjectForImport.units}
          onImportComplete={() => {
            loadSubjects();
            if (expandedSubjectId === activeSubjectForImport.subject.id) {
              loadSubjectDetails(activeSubjectForImport.subject.id);
            }
          }}
        />
      )}
    </div>
  );
}
