"use client";

import Link from "next/link";
import { Subject, Unit, Question } from "@/types";
import { ChevronRight } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface SubjectCardProps {
  subject: Subject;
  units?: Unit[];
  questions?: Question[];
}

export default function SubjectCard({
  subject,
  units = [],
  questions = [],
}: SubjectCardProps) {
  const total = questions.length > 0 ? questions.length : (subject.questionsCount ?? 0);
  const unitsCount = units.length > 0 ? units.length : (subject.unitsCount ?? 0);
  const known = questions.filter((q) => q.status === "known").length;
  const percent = total > 0 ? formatPercent(known, total) : 0;

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
        <div className="space-y-2.5 flex-1 min-w-0">
          {/* Metadata Badges (Code, Branch, Year) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {subject.code && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                {subject.code}
              </span>
            )}
            {subject.branch && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-secondary">
                {subject.branch}
              </span>
            )}
            {subject.year && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-border-subtle text-foreground-muted">
                {subject.year}
              </span>
            )}
            <span className="font-mono text-[10px] px-1.5 py-0.5 text-foreground-muted">
              {unitsCount} {unitsCount === 1 ? "unit" : "units"}
            </span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-white transition-colors truncate">
            {subject.name}
          </h3>

          <p className="text-xs text-foreground-secondary font-mono">
            {total} {total === 1 ? "question" : "questions"} total
            {questions.length > 0 ? ` • ${known} known` : ""}
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
      <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-end text-xs text-foreground-muted">
        <div className="inline-flex items-center gap-1 text-foreground-secondary group-hover:text-foreground font-medium transition-colors">
          Open Subject
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
