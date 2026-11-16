"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Question, Unit, Subject } from "@/types";
import { db } from "@/lib/db";
import { getStudySessionPosition, setStudySessionPosition } from "@/lib/storage";
import SwipeCard from "./SwipeCard";
import confetti from "canvas-confetti";
import {
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Star,
  Flame,
  CheckCircle2,
  StickyNote,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface StudyViewProps {
  subject: Subject;
  unit?: Unit; // If undefined, "Study All Units" mode
  initialQuestions: Question[];
  onClose: () => void;
}

export default function StudyView({
  subject,
  unit,
  initialQuestions,
  onClose,
}: StudyViewProps) {
  const router = useRouter();

  // Local state of questions
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Filters: 'all' | 'unknown' | 'starred' | 'repeated' | 'marks'
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [marksFilter, setMarksFilter] = useState<number | null>(null);

  // Notes Modal state
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState("");

  const deckKey = unit ? `${subject.id}_${unit.id}` : `${subject.id}_all`;

  // Restore cached study position on mount
  useEffect(() => {
    const saved = getStudySessionPosition(deckKey);
    if (saved > 0 && saved < initialQuestions.length) {
      setCurrentIndex(saved);
    }
  }, [deckKey, initialQuestions.length]);

  // Save current card position to cache as user studies
  useEffect(() => {
    if (currentIndex >= 0) {
      setStudySessionPosition(deckKey, currentIndex);
    }
  }, [deckKey, currentIndex]);

  // Sync questions if props update
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Filtered deck
  const filteredQuestions = useMemo(() => {
    let list = [...questions];

    if (activeFilter === "unknown") {
      list = list.filter((q) => q.status !== "known");
    } else if (activeFilter === "starred") {
      list = list.filter((q) => q.starred);
    } else if (activeFilter === "repeated") {
      list = list.filter((q) => q.repeatCount > 1);
    } else if (activeFilter === "marks" && marksFilter !== null) {
      list = list.filter((q) => q.marks === marksFilter);
    }

    return list;
  }, [questions, activeFilter, marksFilter]);

  // Shuffle handler
  const handleToggleShuffle = () => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        setQuestions((current) => [...current].sort(() => Math.random() - 0.5));
      } else {
        setQuestions(initialQuestions);
      }
      setCurrentIndex(0);
      setIsFlipped(false);
      return next;
    });
  };

  const activeQuestion = filteredQuestions[currentIndex];
  const nextQuestion = filteredQuestions[currentIndex + 1];

  // Progress metrics
  const knownCount = questions.filter((q) => q.status === "known").length;
  const progressPercent = questions.length > 0 ? Math.round((knownCount / questions.length) * 100) : 0;

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  // Update question status in Dexie & local state
  const handleUpdateStatus = useCallback(
    async (newStatus: "known" | "learning") => {
      if (!activeQuestion) return;

      if (newStatus === "known") {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#22c55e", "#4da2ff", "#ffffff"],
        });
      }

      await db.questions.update(activeQuestion.id, {
        status: newStatus,
        updatedAt: Date.now(),
      });

      setQuestions((prev) =>
        prev.map((q) => (q.id === activeQuestion.id ? { ...q, status: newStatus } : q))
      );

      // Auto advance to next card after marking
      if (currentIndex < filteredQuestions.length - 1) {
        handleNext();
      }
    },
    [activeQuestion, currentIndex, filteredQuestions.length, handleNext]
  );

  const handleToggleStar = useCallback(async () => {
    if (!activeQuestion) return;
    const newStar = !activeQuestion.starred;

    await db.questions.update(activeQuestion.id, {
      starred: newStar,
      updatedAt: Date.now(),
    });

    setQuestions((prev) =>
      prev.map((q) => (q.id === activeQuestion.id ? { ...q, starred: newStar } : q))
    );
  }, [activeQuestion]);

  const handleOpenNotes = useCallback(() => {
    if (!activeQuestion) return;
    setCurrentNoteText(activeQuestion.notes || "");
    setIsNotesOpen(true);
  }, [activeQuestion]);

  const handleSaveNotes = async () => {
    if (!activeQuestion) return;
    await db.questions.update(activeQuestion.id, {
      notes: currentNoteText.trim(),
      updatedAt: Date.now(),
    });

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === activeQuestion.id ? { ...q, notes: currentNoteText.trim() } : q
      )
    );
    setIsNotesOpen(false);
  };

  // Keyboard Navigation Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in notes textarea
      if (isNotesOpen) return;
      if (["input", "textarea"].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        handleUpdateStatus("known");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleUpdateStatus("learning");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleToggleStar();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleOpenNotes();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isNotesOpen,
    handleNext,
    handlePrev,
    handleFlip,
    handleUpdateStatus,
    handleToggleStar,
    handleOpenNotes,
    onClose,
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden">
      {/* Top Bar */}
      <div className="w-full border-b border-border-subtle bg-black/80 backdrop-blur-md px-4 py-3 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Unit Name & Subject Breadcrumb */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-muted font-mono truncate">
                {subject.name}
              </span>
              <span className="text-xs text-foreground-muted">•</span>
              <h1 className="text-sm font-semibold text-foreground truncate">
                {unit ? `Unit ${unit.number}: ${unit.title}` : "All Units (Master Deck)"}
              </h1>
            </div>
          </div>

          {/* Progress Counters & Close */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-xs text-foreground-secondary">
                {currentIndex + 1}/{filteredQuestions.length || 1}
              </span>
              <span className="text-xs text-accent-green font-mono font-medium hidden xs:inline">
                ({progressPercent}%)
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close Study Mode (Esc)"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn text-foreground-secondary hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Top Animated Progress Bar */}
        <div className="w-full h-1 bg-white/[0.06] mt-2 sm:mt-3 rounded-full overflow-hidden max-w-4xl mx-auto">
          <div
            className="h-full bg-accent-blue transition-all duration-300"
            style={{
              width: `${
                filteredQuestions.length > 0
                  ? ((currentIndex + 1) / filteredQuestions.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Filter and Shuffle Toolbar */}
      <div className="w-full max-w-4xl mx-auto px-4 py-2 shrink-0 flex items-center justify-between gap-2 overflow-x-auto scroll-touch">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveFilter("all");
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 min-h-[38px] flex items-center rounded-btn text-xs font-mono transition-colors shrink-0 ${
              activeFilter === "all"
                ? "bg-white text-black font-semibold"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            }`}
          >
            All ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("unknown");
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 min-h-[38px] flex items-center rounded-btn text-xs font-mono transition-colors shrink-0 ${
              activeFilter === "unknown"
                ? "bg-white text-black font-semibold"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            }`}
          >
            Unknown ({questions.filter((q) => q.status !== "known").length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("starred");
              setCurrentIndex(0);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-btn text-xs font-mono transition-colors shrink-0 ${
              activeFilter === "starred"
                ? "bg-white text-black font-semibold"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Star className="h-3 w-3" />
            Starred ({questions.filter((q) => q.starred).length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("repeated");
              setCurrentIndex(0);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-btn text-xs font-mono transition-colors shrink-0 ${
              activeFilter === "repeated"
                ? "bg-white text-black font-semibold"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Flame className="h-3 w-3 text-accent-blue" />
            Repeated ({questions.filter((q) => q.repeatCount > 1).length})
          </button>
        </div>

        {/* Shuffle Button */}
        <button
          type="button"
          onClick={handleToggleShuffle}
          title="Toggle Shuffle"
          className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[38px] rounded-btn text-xs font-mono transition-colors shrink-0 ${
            isShuffled
              ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
              : "text-foreground-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
      </div>

      {/* Main Study Deck Area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {filteredQuestions.length === 0 ? (
          <div className="text-center p-8 rounded-card border border-border-subtle bg-surface max-w-md">
            <BookOpen className="h-10 w-10 text-foreground-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No questions match filter</h3>
            <p className="text-xs text-foreground-secondary mt-1 mb-4">
              Try switching your filter back to &apos;All&apos; or import more questions for this unit.
            </p>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="px-4 py-1.5 rounded-btn bg-white text-black text-xs font-semibold hover:bg-neutral-200"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <SwipeCard
            question={activeQuestion}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onSwipeNext={handleNext}
            onSwipePrev={handlePrev}
            onMarkKnown={() => handleUpdateStatus("known")}
            onMarkRevise={() => handleUpdateStatus("learning")}
            onToggleStar={handleToggleStar}
            onOpenNotes={handleOpenNotes}
            nextQuestionPreview={nextQuestion}
          />
        )}
      </div>

      {/* Bottom Navigation and Keyboard Hints Bar */}
      <div className="w-full border-t border-border-subtle bg-black/80 backdrop-blur-md px-4 py-2 sm:py-2.5 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-mono text-foreground-secondary hover:text-foreground disabled:opacity-30 transition-all active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          {/* Desktop Keyboard Hints */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-foreground-muted">
            <span>[Space] Flip</span>
            <span>[K] Known</span>
            <span>[R] Revise</span>
            <span>[S] Star</span>
            <span>[N] Note</span>
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentIndex >= filteredQuestions.length - 1}
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-mono text-foreground-secondary hover:text-foreground disabled:opacity-30 transition-all active:scale-[0.98]"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Note Editing Modal */}
      {isNotesOpen && activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-card border border-border-subtle bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-accent-blue" />
                <h3 className="text-sm font-semibold text-foreground">Personal Revision Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted mb-3 line-clamp-1">
              For: {activeQuestion.question}
            </p>

            <textarea
              rows={4}
              value={currentNoteText}
              onChange={(e) => setCurrentNoteText(e.target.value)}
              placeholder="e.g. Always write 4 steps for full marks in MST1..."
              className="w-full rounded-btn border border-border-subtle bg-black p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsNotesOpen(false)}
                className="px-3 py-1.5 text-xs text-foreground-secondary hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 rounded-btn bg-white text-black text-xs font-semibold hover:bg-neutral-200"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
