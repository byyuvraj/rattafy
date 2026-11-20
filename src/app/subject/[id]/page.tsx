"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPercent } from "@/lib/utils";
import { Unit, Question, Subject } from "@/types";
import UnitCard from "@/components/subject/UnitCard";
import StudyView from "@/components/study/StudyView";
import OverviewMode from "@/components/subject/OverviewMode";
import { getUserProgress } from "@/lib/userProgress";
import {
  Play,
  Star,
  ChevronRight,
  List,
  Loader2,
  BookOpen,
  FileDown,
} from "lucide-react";
import ExportSubjectModal from "@/components/modals/ExportSubjectModal";

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & View Modes
  const [activeStudyUnit, setActiveStudyUnit] = useState<Unit | null>(null);
  const [isStudyAllOpen, setIsStudyAllOpen] = useState(false);
  const [activeOverviewUnit, setActiveOverviewUnit] = useState<Unit | null>(null);
  const [isOverviewAllOpen, setIsOverviewAllOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/subjects/${subjectId}`);
      if (!res.ok) {
        setSubject(null);
        return;
      }
      const data = await res.json();
      setSubject(data.subject);
      setUnits(data.units || []);

      const userProgress = getUserProgress();
      const mergedQuestions: Question[] = (data.questions || []).map((q: Question) => {
        const prog = userProgress[q.id];
        return {
          ...q,
          status: prog?.status || "new",
          starred: prog?.starred ?? false,
          notes: prog?.notes || "",
        };
      });

      setQuestions(mergedQuestions);
    } catch {
      setSubject(null);
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
        <p className="text-xs font-mono text-foreground-muted">Loading subject content...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center space-y-4">
        <p className="text-sm text-foreground-secondary">Subject not found.</p>
        <Link href="/" className="inline-block text-xs text-accent-blue underline">
          ← Return to Subjects
        </Link>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const knownCount = questions.filter((q) => q.status === "known").length;
  const percentKnown = formatPercent(knownCount, totalQuestions);
  const starredCount = questions.filter((q) => q.starred).length;

  // Full-screen Study View for single unit
  if (activeStudyUnit) {
    const unitQuestions = questions.filter((q) => q.unitId === activeStudyUnit.id);
    return (
      <StudyView
        subject={subject}
        unit={activeStudyUnit}
        initialQuestions={unitQuestions}
        onClose={() => {
          setActiveStudyUnit(null);
          loadData();
        }}
      />
    );
  }

  // Full-screen Study View for ALL units
  if (isStudyAllOpen) {
    return (
      <StudyView
        subject={subject}
        initialQuestions={questions}
        onClose={() => {
          setIsStudyAllOpen(false);
          loadData();
        }}
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
          questions={questions.filter((q) => q.unitId === activeOverviewUnit.id)}
          onClose={() => {
            setActiveOverviewUnit(null);
            loadData();
          }}
          onQuestionsUpdated={loadData}
        />
      ) : isOverviewAllOpen ? (
        <OverviewMode
          subject={subject}
          questions={questions}
          onClose={() => {
            setIsOverviewAllOpen(false);
            loadData();
          }}
          onQuestionsUpdated={loadData}
        />
      ) : (
        <>
          {/* Header Card */}
          <div className="rounded-card border border-border-subtle bg-surface p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  {subject.code && (
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                      {subject.code}
                    </span>
                  )}
                  {subject.branch && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                      {subject.branch}
                    </span>
                  )}
                  {subject.year && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-muted">
                      {subject.year}
                    </span>
                  )}
                  <span className="text-xs text-foreground-muted font-mono">
                    {units.length} Units
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {subject.name}
                </h1>
                <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
                  Study unit-by-unit with swipeable past-paper cards. Track mastery, revise difficult topics,
                  and star high-priority questions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
                <button
                  type="button"
                  disabled={totalQuestions === 0}
                  onClick={() => setIsStudyAllOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-[44px] rounded-btn bg-white text-black text-sm font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm w-full sm:w-auto"
                >
                  <Play className="h-4 w-4 fill-black" />
                  Study All ({totalQuestions})
                </button>

                <button
                  type="button"
                  disabled={totalQuestions === 0}
                  onClick={() => setIsOverviewAllOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-semibold text-foreground transition-all disabled:opacity-40"
                >
                  <List className="h-3.5 w-3.5" />
                  Browse Questions
                </button>

                <button
                  type="button"
                  disabled={totalQuestions === 0}
                  onClick={() => setIsExportOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-semibold text-foreground transition-all disabled:opacity-40"
                  title="Extract all questions as structured Markdown (.md)"
                >
                  <FileDown className="h-3.5 w-3.5 text-accent-blue" />
                  <span>Extract .md</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border-subtle/80">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  Total Questions
                </span>
                <p className="text-xl font-bold font-mono text-foreground">{totalQuestions}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-foreground-muted uppercase">
                  My Exam Mastery
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
                  My Starred Questions
                </span>
                <div className="flex items-baseline gap-1 text-amber-300">
                  <Star className="h-4 w-4 fill-amber-300" />
                  <p className="text-xl font-bold font-mono">{starredCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Syllabus / Notes Card if present */}
          {subject.syllabus && (
            <div className="rounded-card border border-border-subtle bg-surface p-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-accent-blue" />
                <span>Course & Syllabus Outline</span>
              </div>
              <p className="text-xs text-foreground-secondary font-mono whitespace-pre-line leading-relaxed">
                {subject.syllabus}
              </p>
            </div>
          )}

          {/* Units Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-foreground">Units & Modules</h2>

            {/* Units Grid */}
            {units.length === 0 ? (
              <div className="p-8 text-center rounded-card border border-dashed border-border-subtle bg-white/[0.01]">
                <p className="text-sm font-semibold text-foreground">No units found in this subject</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Questions have not been assigned to units yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {units.map((u) => {
                  const unitQuestions = questions.filter((q) => q.unitId === u.id);
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

      {/* Extract / Export Modal */}
      {subject && isExportOpen && (
        <ExportSubjectModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          subject={subject}
          units={units}
          questions={questions}
        />
      )}
    </div>
  );
}
