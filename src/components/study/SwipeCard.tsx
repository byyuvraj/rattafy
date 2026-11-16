"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Question } from "@/types";
import {
  Clock,
  Award,
  Star,
  CheckCircle2,
  RotateCcw,
  StickyNote,
  Eye,
  CornerDownLeft,
} from "lucide-react";
import MarkdownContent from "./MarkdownContent";

interface SwipeCardProps {
  question: Question;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  onMarkKnown: () => void;
  onMarkRevise: () => void;
  onToggleStar: () => void;
  onOpenNotes: () => void;
  nextQuestionPreview?: Question;
}

export default function SwipeCard({
  question,
  isFlipped,
  onFlip,
  onSwipeNext,
  onSwipePrev,
  onMarkKnown,
  onMarkRevise,
  onToggleStar,
  onOpenNotes,
  nextQuestionPreview,
}: SwipeCardProps) {
  const x = useMotionValue(0);

  // Dynamic visual feedback during horizontal drag
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacityNext = useTransform(x, [-120, -20], [1, 0]);
  const opacityPrev = useTransform(x, [20, 120], [0, 1]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastSwipeTimeRef = useRef(0);

  // Reset motion values cleanly when question changes
  useEffect(() => {
    x.set(0);
    isDraggingRef.current = false;
  }, [question.id, x]);

  // Horizontal swipe evaluation strictly for navigating cards
  const resolveHorizontalSwipe = (offsetX: number, velocityX: number) => {
    const now = Date.now();
    // Enforce 400ms cooldown between swipes
    if (now - lastSwipeTimeRef.current < 400) {
      return;
    }

    // Swiped Left -> Next Card
    if (offsetX < -45 || (offsetX < -20 && velocityX < -250) || velocityX < -450) {
      lastSwipeTimeRef.current = now;
      onSwipeNext();
      return;
    }

    // Swiped Right -> Previous Card
    if (offsetX > 45 || (offsetX > 20 && velocityX > 250) || velocityX > 450) {
      lastSwipeTimeRef.current = now;
      onSwipePrev();
      return;
    }
  };

  // Touch handlers to support horizontal swipe navigation while preserving natural vertical scroll
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // If vertical movement is dominant, let the browser scroll the answer naturally
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (Math.abs(deltaX) > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const elapsed = Math.max(1, Date.now() - touchStartRef.current.time);
    const velocityX = (deltaX / elapsed) * 1000;

    touchStartRef.current = null;

    // If vertical scrolling was dominant, do not navigate
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      isDraggingRef.current = false;
      return;
    }

    if (Math.abs(deltaX) > 10) {
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 120);

      resolveHorizontalSwipe(deltaX, velocityX);
    }
  };

  // Framer Motion drag handlers (horizontal only)
  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);

    resolveHorizontalSwipe(info.offset.x, info.velocity.x);
  };

  // Guard click-to-flip against drag/swipe releases
  const handleMiddleClick = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    onFlip();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[calc(100dvh-175px)] sm:h-[560px] max-h-[640px] min-h-[420px] perspective-1000 select-none">
      {/* Background Peek Card */}
      {nextQuestionPreview && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-card border border-white/[0.04] bg-[#0c0c0c] p-6 shadow-card transform translate-y-3 scale-[0.96] opacity-40 pointer-events-none transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            {nextQuestionPreview.marks && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400">
                {nextQuestionPreview.marks} Marks
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-neutral-400 line-clamp-3">
            {nextQuestionPreview.question}
          </p>
        </div>
      )}

      {/* Main Interactive Card */}
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full cursor-grab active:cursor-grabbing z-10 select-none"
      >
        {/* Horizontal Navigation Indicators */}
        <motion.div
          style={{ opacity: opacityNext }}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded bg-white/10 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-sm shadow-md"
        >
          Next →
        </motion.div>

        <motion.div
          style={{ opacity: opacityPrev }}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded bg-white/10 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-sm shadow-md"
        >
          ← Prev
        </motion.div>

        {/* The Card Surface */}
        <div className="w-full h-full rounded-card border border-border-subtle bg-surface shadow-card p-5 sm:p-7 flex flex-col justify-between overflow-hidden relative group hover:border-border-hover transition-colors">
          {/* Card Top Metadata Bar */}
          <div className="flex items-center justify-between gap-2 shrink-0 border-b border-border-subtle/80 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {/* Question Status Pill */}
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  question.status === "known"
                    ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                    : question.status === "learning"
                    ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30"
                    : "bg-white/5 text-foreground-secondary border-border-subtle"
                }`}
              >
                {question.status}
              </span>

              {/* Marks Badge */}
              {question.marks && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                  <Award className="h-3 w-3 text-accent-blue" />
                  {question.marks} Marks
                </span>
              )}

              {/* Year & Exam Tags */}
              {question.years && question.years.length > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                  <Clock className="h-3 w-3" />
                  {question.years.join(", ")}
                </span>
              )}
            </div>

            {/* Star & Notes Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNotes();
                }}
                title="Personal Notes (N)"
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn hover:bg-white/5 transition-colors relative ${
                  question.notes ? "text-accent-blue" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <StickyNote className="h-4 w-4" />
                {question.notes && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-blue" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar();
                }}
                title="Star Question (S)"
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn hover:bg-white/5 transition-colors ${
                  question.starred ? "text-amber-400" : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Star className={`h-4 w-4 ${question.starred ? "fill-amber-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Card Middle: Question + Answer Scroll Area */}
          <div
            onClick={handleMiddleClick}
            className="flex-1 overflow-y-auto py-4 sm:py-5 space-y-4 scroll-touch cursor-pointer"
          >
            {/* Question Text */}
            <div className="space-y-1">
              <span className="font-mono text-xs font-semibold text-accent-blue tracking-wide uppercase">
                Question
              </span>
              <p className="text-base sm:text-lg font-semibold text-foreground leading-snug">
                {question.question}
              </p>
            </div>

            {/* Answer (Toggled by Flip) */}
            {isFlipped ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="pt-3 border-t border-border-subtle cursor-text"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    Answer
                  </span>
                </div>

                {question.answer ? (
                  <MarkdownContent content={question.answer} />
                ) : (
                  <div className="py-8 text-center text-xs text-foreground-muted italic">
                    No answer provided for this question yet.
                  </div>
                )}
              </div>
            ) : (
              /* Tap to reveal prompt */
              <div className="py-6 flex flex-col items-center justify-center text-foreground-muted hover:text-foreground-secondary transition-colors gap-2">
                <div className="h-10 w-10 rounded-full bg-white/[0.03] border border-border-subtle flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-xs font-mono tracking-tight">
                  Tap anywhere or press Space to reveal answer
                </span>
              </div>
            )}
          </div>

          {/* Card Bottom Action Bar: ONLY Manual Known / Revise */}
          <div className="shrink-0 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRevise();
              }}
              title="Mark as Revise (R)"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 min-h-[48px] rounded-btn text-xs sm:text-sm font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 transition-all active:scale-[0.98] flex-1"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Revise</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              className="inline-flex items-center justify-center gap-1 text-xs text-foreground-secondary hover:text-foreground px-3.5 py-3 min-h-[48px] rounded-btn hover:bg-white/5 transition-colors font-mono shrink-0 border border-transparent hover:border-border-subtle"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
              {isFlipped ? "Hide" : "Flip"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkKnown();
              }}
              title="Mark as Known (K)"
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-3 min-h-[48px] rounded-btn text-xs sm:text-sm font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.98] flex-1"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Known</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
