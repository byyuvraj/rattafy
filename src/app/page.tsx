"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import SubjectCard from "@/components/home/SubjectCard";
import AddSubjectModal from "@/components/home/AddSubjectModal";
import {
  Plus,
  Layers,
  Flame,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Live queries from IndexedDB
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const allUnits = useLiveQuery(() => db.units.toArray(), []);
  const allQuestions = useLiveQuery(() => db.questions.toArray(), []);

  const totalQuestionsCount = allQuestions ? allQuestions.length : 0;
  const knownQuestionsCount = allQuestions ? allQuestions.filter((q) => q.status === "known").length : 0;
  const repeatedQuestionsCount = allQuestions ? allQuestions.filter((q) => q.repeatCount > 1).length : 0;
  const overallKnownPercent =
    totalQuestionsCount > 0 ? Math.round((knownQuestionsCount / totalQuestionsCount) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] hero-glow">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-border-subtle text-xs text-foreground-secondary">
            <span className="h-2 w-2 rounded-full bg-accent-blue shadow-[0_0_8px_#4da2ff]" />
            <span>Zero-Backend • Offline-First • 100% Client-Side Privacy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Master past papers by unit.
          </h1>

          <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed max-w-2xl">
            Rattafy transforms past-paper and MST question-answer documents into structured,
            high-retention swipeable cards. Built for university students who want exam-ready mastery.
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-[44px] rounded-btn bg-white text-black text-sm font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        {subjects && subjects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Subjects</span>
              <span className="text-2xl font-bold text-foreground font-mono">{subjects.length}</span>
            </div>
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Total Questions</span>
              <span className="text-2xl font-bold text-foreground font-mono">{totalQuestionsCount}</span>
            </div>
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Known Mastery</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-accent-green font-mono">{overallKnownPercent}%</span>
                <span className="text-xs text-foreground-muted font-mono">({knownQuestionsCount})</span>
              </div>
            </div>
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Repeated in Exams</span>
              <div className="flex items-baseline gap-1 text-accent-blue">
                <Flame className="h-4 w-4" />
                <span className="text-2xl font-bold font-mono">{repeatedQuestionsCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-secondary font-mono">
              Your Subjects
            </h2>
            {subjects && subjects.length > 0 && (
              <span className="text-xs text-foreground-muted font-mono">
                {subjects.length} active {subjects.length === 1 ? "course" : "courses"}
              </span>
            )}
          </div>

          {!subjects ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-40 rounded-card border border-border-subtle bg-surface animate-pulse"
                />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            // Empty State
            <div className="rounded-card border border-dashed border-border-subtle p-10 sm:p-14 text-center bg-white/[0.01]">
              <div className="h-12 w-12 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-foreground-muted mx-auto mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No subjects created yet</h3>
              <p className="text-xs text-foreground-secondary max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
                Create an exam subject to get started, then import past-paper questions and master them by unit.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 min-h-[44px] rounded-btn bg-white text-black text-xs sm:text-sm font-bold hover:bg-neutral-200 transition-all active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create Subject
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subj) => {
                const subjUnits = allUnits ? allUnits.filter((u) => u.subjectId === subj.id) : [];
                const subjQuestions = allQuestions
                  ? allQuestions.filter((q) => q.subjectId === subj.id)
                  : [];

                return (
                  <SubjectCard
                    key={subj.id}
                    subject={subj}
                    units={subjUnits}
                    questions={subjQuestions}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubjectAdded={(newId) => router.push(`/subject/${newId}`)}
      />
    </div>
  );
}
