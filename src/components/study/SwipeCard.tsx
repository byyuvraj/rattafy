"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Question } from "@/types";
import {
  Flame,
  Clock,
  Award,
  Star,
  CheckCircle2,
  RotateCcw,
  Sparkles,
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
  const y = useMotionValue(0);

  // Dynamic visual feedback during drag
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacityKnown = useTransform(y, [-150, -30], [1, 0]);
  const opacityRevise = useTransform(y, [30, 150], [0, 1]);
  const opacityNext = useTransform(x, [-150, -30], [1, 0]);
  const opacityPrev = useTransform(x, [30, 150], [0, 1]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const thresholdX = 100;
    const thresholdY = 90;

    // Check vertical swipes first (Known / Revise)
    if (info.offset.y < -thresholdY) {
      onMarkKnown();
      return;
    }
    if (info.offset.y > thresholdY) {
      onMarkRevise();
      return;
    }

    // Check horizontal swipes (Next / Prev)
    if (info.offset.x < -thresholdX) {
      onSwipeNext();
      return;
    }
    if (info.offset.x > thresholdX) {
      onSwipePrev();
      return;
    }
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
            {nextQuestionPreview.repeatCount > 1 && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue">
                Repeated ×{nextQuestionPreview.repeatCount}
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
        style={{ x, y, rotate }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        className="relative w-full h-full cursor-grab active:cursor-grabbing z-10"
      >
        {/* Swipe Feedback Overlay Badges */}
        <motion.div
          style={{ opacity: opacityKnown }}
          className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-accent-green/20 border border-accent-green text-accent-green font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]"
        >
          ✓ Mark Known (Swipe Up)
        </motion.div>

        <motion.div
          style={{ opacity: opacityRevise }}
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-accent-amber/20 border border-accent-amber text-accent-amber font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          ↺ Revise Again (Swipe Down)
        </motion.div>

        <motion.div
          style={{ opacity: opacityNext }}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded bg-white/10 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-sm"
        >
          Next →
        </motion.div>

        <motion.div
          style={{ opacity: opacityPrev }}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded bg-white/10 border border-white/20 text-white font-mono text-xs font-bold backdrop-blur-sm"
        >
          ← Prev
        </motion.div>

        {/* The Card Surface */}
        <div className="w-full h-full rounded-card border border-border-subtle bg-surface shadow-card p-5 sm:p-7 flex flex-col justify-between overflow-hidden relative group hover:border-border-hover transition-colors">
          {/* Card Top Metadata Bar */}
          <div className="flex items-center justify-between gap-2 shrink-0 border-b border-border-subtle/80 pb-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Status Indicator */}
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

              {question.marks && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04] border border-border-subtle text-foreground-secondary">
                  <Award className="h-3 w-3 text-accent-blue" />
                  {question.marks} Marks
                </span>
              )}

              {question.repeatCount > 1 && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-semibold animate-pulse-subtle">
                  <Flame className="h-3 w-3" />
                  Repeated ×{question.repeatCount}
                </span>
              )}

              {question.years && question.years.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04] border border-border-subtle text-foreground-muted">
                  <Clock className="h-3 w-3" />
                  {question.years.join(", ")}
                </span>
              )}
            </div>

            {/* Quick Actions (Star, Note) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNotes();
                }}
                title={question.notes ? "View revision note" : "Add revision note (N)"}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn transition-colors ${
                  question.notes
                    ? "text-accent-blue bg-accent-blue/10"
                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <StickyNote className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar();
                }}
                title="Star question (S)"
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn transition-colors ${
                  question.starred
                    ? "text-accent-gold fill-accent-gold"
                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Star
                  className={`h-4 w-4 ${question.starred ? "fill-accent-gold text-accent-gold" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Card Middle: Question & Answer (Scrollable container for long answers) */}
          <div
            onClick={onFlip}
            className="flex-1 my-3 overflow-y-auto pr-1 flex flex-col justify-start cursor-pointer scroll-touch"
          >
            {/* Question Text */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs font-bold text-accent-blue mt-1 shrink-0">Q.</span>
                <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground leading-snug">
                  {question.question}
                </h2>
              </div>

              {/* Personal Notes Banner if present */}
              {question.notes && (
                <div className="p-2.5 rounded-btn bg-accent-blue/[0.06] border border-accent-blue/20 text-xs text-accent-blue flex items-start gap-2">
                  <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">Note:</strong> {question.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Reveal Answer Section */}
            {isFlipped ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-3 border-t border-border-subtle"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                    Answer
                  </span>
                  {question.aiGenerated && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      <Sparkles className="h-3 w-3" />
                      Gemini Verified
                    </span>
                  )}
                </div>

                {question.answer ? (
                  <MarkdownContent content={question.answer} />
                ) : (
                  <div className="py-8 text-center text-xs text-foreground-muted italic">
                    No answer provided for this question yet.
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="mt-auto py-8 text-center flex flex-col items-center justify-center gap-2 text-foreground-muted hover:text-foreground transition-colors">
                <Eye className="h-5 w-5 opacity-60" />
                <span className="text-xs font-medium">Click or press Space to reveal answer</span>
                <span className="font-mono text-[10px] text-neutral-500">[Space / Enter]</span>
              </div>
            )}
          </div>

          {/* Card Bottom Action Bar */}
          <div className="shrink-0 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRevise();
              }}
              title="Revise Again (R / Swipe Down)"
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
              title="Mark as Known (K / Swipe Up)"
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
