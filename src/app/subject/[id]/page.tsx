"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, formatPercent } from "@/lib/utils";
import { Unit, Question, Subject } from "@/types";
import UnitCard from "@/components/subject/UnitCard";
import ImportModal from "@/components/import/ImportModal";
import StudyView from "@/components/study/StudyView";
import OverviewMode from "@/components/subject/OverviewMode";
import {
  Play,
  Upload,
  Plus,
  Trash2,
  BookOpen,
  Layers,
  Flame,
  Star,
  Settings2,
  ChevronRight,
  FileText,
  List,
} from "lucide-react";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  // Modals & View Modes
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeStudyUnit, setActiveStudyUnit] = useState<Unit | null>(null);
  const [isStudyAllOpen, setIsStudyAllOpen] = useState(false);
  const [activeOverviewUnit, setActiveOverviewUnit] = useState<Unit | null>(null);
  const [isOverviewAllOpen, setIsOverviewAllOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newUnitNumber, setNewUnitNumber] = useState<number>(1);
  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false);
  const [syllabusInput, setSyllabusInput] = useState("");

  // Live queries
  const subject = useLiveQuery(() => db.subjects.get(subjectId), [subjectId]);
  const units = useLiveQuery(
    () => db.units.where("subjectId").equals(subjectId).sortBy("number"),
    [subjectId]
  );
  const questions = useLiveQuery(
    () => db.questions.where("subjectId").equals(subjectId).toArray(),
    [subjectId]
  );

  if (!subject) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-sm text-foreground-secondary">Loading subject or subject not found...</p>
        <Link href="/" className="mt-4 inline-block text-xs text-accent-blue underline">
          Return to Subjects
        </Link>
      </div>
    );
  }

  const subjectUnits = units || [];
  const subjectQuestions = questions || [];

  const totalQuestions = subjectQuestions.length;
  const knownCount = subjectQuestions.filter((q) => q.status === "known").length;
  const percentKnown = formatPercent(knownCount, totalQuestions);
  const repeatedCount = subjectQuestions.filter((q) => q.repeatCount > 1).length;
  const starredCount = subjectQuestions.filter((q) => q.starred).length;

  // Add unit handler
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    await db.units.add({
      id: generateId(),
      subjectId,
      number: newUnitNumber,
      title: newUnitTitle.trim(),
    });

    setNewUnitTitle("");
    setIsAddUnitOpen(false);
  };

  // Delete subject handler
  const handleDeleteSubject = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${subject.name}" and all its units & questions? This cannot be undone.`
      )
    ) {
      await db.transaction("rw", db.subjects, db.units, db.questions, async () => {
        await db.questions.where("subjectId").equals(subjectId).delete();
        await db.units.where("subjectId").equals(subjectId).delete();
        await db.subjects.delete(subjectId);
      });
      router.push("/");
    }
  };

  // Save syllabus handler
  const handleSaveSyllabus = async () => {
    await db.subjects.update(subjectId, { syllabus: syllabusInput });
    setIsEditingSyllabus(false);
  };

  // Full-screen Study View for single unit
  if (activeStudyUnit) {
    const unitQuestions = subjectQuestions.filter((q) => q.unitId === activeStudyUnit.id);
    return (
      <StudyView
        subject={subject}
        unit={activeStudyUnit}
        initialQuestions={unitQuestions}
        onClose={() => setActiveStudyUnit(null)}
      />
    );
  }

  // Full-screen Study View for ALL units
  if (isStudyAllOpen) {
    return (
      <StudyView
        subject={subject}
        initialQuestions={subjectQuestions}
        onClose={() => setIsStudyAllOpen(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-foreground-muted font-mono">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{subject.name}</span>
      </nav>

      {/* Overview Mode (if active) */}
      {activeOverviewUnit ? (
        <OverviewMode
          subject={subject}
          unit={activeOverviewUnit}
          questions={subjectQuestions.filter((q) => q.unitId === activeOverviewUnit.id)}
          onClose={() => setActiveOverviewUnit(null)}
        />
      ) : isOverviewAllOpen ? (
        <OverviewMode
          subject={subject}
          questions={subjectQuestions}
          onClose={() => setIsOverviewAllOpen(false)}
        />
      ) : (
        <>
          {/* Header Card */}
          <div className="rounded-card border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted font-mono">
                    {subjectUnits.length} Units
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {subject.name}
                </h1>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                  Study unit-by-unit with swipeable past-paper cards. Repeated exam questions are
                  automatically badged for high priority.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={totalQuestions === 0}
                  onClick={() => setIsStudyAllOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  Study All ({totalQuestions})
                </button>

                <button
                  type="button"
                  disabled={totalQuestions === 0}
                  onClick={() => setIsOverviewAllOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-semibold text-foreground transition-all"
                >
                  <List className="h-3.5 w-3.5" />
                  Browse All
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-semibold text-foreground hover:border-accent-blue/40 transition-all"
                >
                  <Upload className="h-3.5 w-3.5 text-accent-blue" />
                  Import Papers
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSubject}
                  title="Delete subject"
                  className="p-2.5 rounded-btn text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border-subtle/80">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  Total Questions
                </span>
                <p className="text-xl font-bold font-mono text-foreground">{totalQuestions}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  Exam Mastery
                </span>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold font-mono text-accent-green">{percentKnown}%</p>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    ({knownCount} known)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  Repeated In Exams
                </span>
                <div className="flex items-baseline gap-1 text-accent-blue">
                  <Flame className="h-4 w-4" />
                  <p className="text-xl font-bold font-mono">{repeatedCount}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  Starred Questions
                </span>
                <div className="flex items-baseline gap-1 text-amber-300">
                  <Star className="h-4 w-4 fill-amber-300" />
                  <p className="text-xl font-bold font-mono">{starredCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Syllabus Context Box */}
          <div className="rounded-card border border-border-subtle bg-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-foreground-muted" />
                <span className="text-xs font-semibold text-foreground">
                  Subject Syllabus Outline (Context for Gemini Unit Mapping)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSyllabusInput(subject.syllabus || "");
                  setIsEditingSyllabus((e) => !e);
                }}
                className="text-xs text-accent-blue hover:underline"
              >
                {isEditingSyllabus ? "Cancel" : subject.syllabus ? "Edit Syllabus" : "+ Add Syllabus"}
              </button>
            </div>

            {isEditingSyllabus ? (
              <div className="space-y-2 mt-2">
                <textarea
                  rows={4}
                  value={syllabusInput}
                  onChange={(e) => setSyllabusInput(e.target.value)}
                  placeholder="Paste your course units & syllabus topics here..."
                  className="w-full rounded-btn border border-border-subtle bg-black p-3 text-xs text-foreground font-mono focus:outline-none focus:border-border-focus"
                />
                <button
                  type="button"
                  onClick={handleSaveSyllabus}
                  className="px-3.5 py-1.5 rounded-btn bg-white text-black text-xs font-semibold hover:bg-neutral-200"
                >
                  Save Syllabus Context
                </button>
              </div>
            ) : subject.syllabus ? (
              <p className="text-xs text-foreground-muted font-mono whitespace-pre-line line-clamp-3">
                {subject.syllabus}
              </p>
            ) : (
              <p className="text-xs text-foreground-muted italic">
                No syllabus configured. Adding your course syllabus helps Gemini automatically map scanned questions to units.
              </p>
            )}
          </div>

          {/* Units Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Units & Modules</h2>
              <button
                type="button"
                onClick={() => {
                  setNewUnitNumber(subjectUnits.length + 1);
                  setIsAddUnitOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-medium text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Unit
              </button>
            </div>

            {/* Units Grid */}
            {subjectUnits.length === 0 ? (
              <div className="p-8 text-center rounded-card border border-dashed border-border-subtle bg-white/[0.01]">
                <p className="text-sm font-semibold text-foreground">No units found in this subject</p>
                <p className="text-xs text-foreground-muted mt-1 mb-4">
                  Import past papers or add your syllabus units manually.
                </p>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200"
                >
                  Import Past Papers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectUnits.map((u) => {
                  const unitQuestions = subjectQuestions.filter((q) => q.unitId === u.id);
                  return (
                    <UnitCard
                      key={u.id}
                      unit={u}
                      questions={unitQuestions}
                      onStudy={(unit) => setActiveStudyUnit(unit)}
                      onOverview={(unit) => setActiveOverviewUnit(unit)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Unit Modal */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-3">Add New Unit</h3>
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-foreground-muted block mb-1">
                  Unit Number:
                </label>
                <input
                  type="number"
                  min={0}
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-btn border border-border-subtle bg-black px-3 py-1.5 text-xs font-mono text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-foreground-muted block mb-1">
                  Unit Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Normalization & Decomposition"
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  className="w-full rounded-btn border border-border-subtle bg-black px-3 py-1.5 text-xs text-foreground"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-3 py-1 text-xs text-foreground-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-btn bg-white text-black text-xs font-semibold hover:bg-neutral-200"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        subject={subject}
        units={subjectUnits}
      />
    </div>
  );
}
