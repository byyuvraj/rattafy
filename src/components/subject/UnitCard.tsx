"use client";

import { Unit, Question } from "@/types";
import { Play, List, Flame, Star, Award, CheckCircle2 } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface UnitCardProps {
  unit: Unit;
  questions: Question[];
  onStudy: (unit: Unit) => void;
  onOverview: (unit: Unit) => void;
}

export default function UnitCard({
  unit,
  questions,
  onStudy,
  onOverview,
}: UnitCardProps) {
  const total = questions.length;
  const known = questions.filter((q) => q.status === "known").length;
  const percent = formatPercent(known, total);
  const repeated = questions.filter((q) => q.repeatCount > 1).length;
  const starred = questions.filter((q) => q.starred).length;

  return (
    <div className="rounded-card border border-border-subtle bg-surface hover:border-border-hover p-5 sm:p-6 transition-all shadow-sm hover:shadow-card group flex flex-col justify-between">
      {/* Top row */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-white/5 border border-border-subtle text-foreground">
            {unit.number === 0 ? "Unsorted" : `Unit ${unit.number}`}
          </span>

          <div className="flex items-center gap-2">
            {repeated > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                <Flame className="h-3 w-3" />
                {repeated} Repeated
              </span>
            )}
            {starred > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Star className="h-3 w-3 fill-amber-300" />
                {starred}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-white transition-colors">
          {unit.title}
        </h3>

        {/* Progress & Stats */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-foreground-secondary">
              {known} of {total} known
            </span>
            <span
              className={`font-semibold ${
                percent === 100 ? "text-accent-green" : percent > 50 ? "text-accent-blue" : "text-foreground-muted"
              }`}
            >
              {percent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percent === 100 ? "bg-accent-green" : "bg-accent-blue"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOverview(unit)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-white/[0.04] border border-border-subtle hover:bg-white/[0.08] hover:border-border-hover text-xs font-medium text-foreground-secondary hover:text-foreground transition-all"
        >
          <List className="h-3.5 w-3.5" />
          Browse ({total})
        </button>

        <button
          type="button"
          disabled={total === 0}
          onClick={() => onStudy(unit)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          Study Unit
        </button>
      </div>
    </div>
  );
}
