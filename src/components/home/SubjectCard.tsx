"use client";

import Link from "next/link";
import { Subject, Unit, Question } from "@/types";
import { BookOpen, ChevronRight, Layers, Flame, Star } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface SubjectCardProps {
  subject: Subject;
  units: Unit[];
  questions: Question[];
}

export default function SubjectCard({
  subject,
  units,
  questions,
}: SubjectCardProps) {
  const total = questions.length;
  const known = questions.filter((q) => q.status === "known").length;
  const percent = formatPercent(known, total);
  const repeated = questions.filter((q) => q.repeatCount > 1).length;

  // SVG Circular progress ring calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Link
      href={`/subject/${subject.id}`}
      className="group block rounded-card border border-border-subtle bg-surface hover:border-border-hover p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-card relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Subject Info */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted font-mono">
              {units.length} {units.length === 1 ? "unit" : "units"}
            </span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-white transition-colors truncate">
            {subject.name}
          </h3>

          <p className="text-xs text-foreground-secondary font-mono">
            {total} {total === 1 ? "question" : "questions"} total • {known} known
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg className="w-16 h-16 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={percent === 100 ? "#22c55e" : "#4da2ff"}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs font-bold text-foreground">
              {percent}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info row */}
      <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-3">
          {repeated > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-accent-blue">
              <Flame className="h-3 w-3" />
              {repeated} Repeated
            </span>
          )}
        </div>

        <div className="inline-flex items-center gap-1 text-foreground-secondary group-hover:text-foreground font-medium transition-colors">
          Open
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
