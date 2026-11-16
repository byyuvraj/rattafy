"use client";

import { useState, useEffect } from "react";
import SubjectCard from "@/components/home/SubjectCard";
import { Subject } from "@/types";
import {
  Layers,
  Search,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        setSubjects([]);
      }
    } catch {
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects
    ? subjects.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.branch && s.branch.toLowerCase().includes(q)) ||
          (s.year && s.year.toLowerCase().includes(q))
        );
      })
    : [];

  const totalQuestionsCount = subjects
    ? subjects.reduce((sum, s) => sum + (s.questionsCount || 0), 0)
    : 0;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] hero-glow">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero Section */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-border-subtle text-xs text-foreground-secondary">
            <span className="h-2 w-2 rounded-full bg-accent-blue shadow-[0_0_8px_#4da2ff]" />
            <span>Unit-Wise Study Cards • Instant Visual Recall</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Master past papers by unit.
          </h1>

          <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed max-w-2xl">
            Rattafy transforms university past-paper questions and answers into structured,
            high-retention swipeable cards. Built for exam-ready mastery.
          </p>
        </div>

        {/* Aggregate Stats Strip */}
        {subjects && subjects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 mb-10 max-w-md">
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Subjects</span>
              <span className="text-2xl font-bold text-foreground font-mono">{subjects.length}</span>
            </div>
            <div className="p-4 rounded-card bg-surface border border-border-subtle">
              <span className="text-xs text-foreground-muted font-mono block mb-1">Total Questions</span>
              <span className="text-2xl font-bold text-foreground font-mono">{totalQuestionsCount}</span>
            </div>
          </div>
        )}

        {/* Search & Subject Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent-blue" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-secondary font-mono">
                Available Subjects
              </h2>
            </div>

            {subjects && subjects.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search by name, code, branch, year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-btn border border-border-subtle bg-black pl-8 pr-3 py-1.5 min-h-[36px] text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-40 rounded-card border border-border-subtle bg-surface animate-pulse"
                />
              ))}
            </div>
          ) : !subjects || subjects.length === 0 ? (
            // Empty State
            <div className="rounded-card border border-dashed border-border-subtle p-10 sm:p-14 text-center bg-white/[0.01]">
              <div className="h-12 w-12 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center text-foreground-muted mx-auto mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No subjects published yet</h3>
              <p className="text-xs text-foreground-secondary max-w-sm mx-auto mt-1 leading-relaxed">
                Exam questions and past papers will appear here once published by your course administrator.
              </p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground-muted">
              No subjects matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
