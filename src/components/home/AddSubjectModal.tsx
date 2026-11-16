"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, BookOpen } from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectAdded?: (subjectId: string) => void;
}

export default function AddSubjectModal({
  isOpen,
  onClose,
  onSubjectAdded,
}: AddSubjectModalProps) {
  const { alert } = useDialog();
  const [name, setName] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [unitCount, setUnitCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          initialUnits: unitCount,
          syllabus: syllabus.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subject");
      }

      setName("");
      setSyllabus("");
      onClose();
      onSubjectAdded?.(data.id);
    } catch (err: any) {
      await alert({
        title: "Creation Error",
        message: `Failed to create subject: ${err.message}`,
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-card border border-border-subtle bg-surface p-6 shadow-card modal-glow z-10"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
                <BookOpen className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">Add New Subject</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-foreground-muted hover:text-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-btn hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Operating Systems"
                className="w-full rounded-btn border border-border-subtle bg-black px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground-secondary">
                  Initial Units Count
                </label>
                <span className="text-[11px] font-mono text-foreground-muted">
                  {unitCount} {unitCount === 1 ? "unit" : "units"} will be created
                </span>
              </div>

              {/* Mobile-Friendly Stepper Counter */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnitCount((prev) => Math.max(1, prev - 1))}
                  disabled={unitCount <= 1}
                  className="flex h-11 w-12 shrink-0 items-center justify-center rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-foreground transition-all"
                  aria-label="Decrease units"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-btn border border-border-subtle bg-black px-3 select-none">
                  <span className="font-mono text-lg font-bold text-foreground">{unitCount}</span>
                  <span className="text-xs font-mono text-foreground-muted">
                    {unitCount === 1 ? "Unit" : "Units"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setUnitCount((prev) => Math.min(16, prev + 1))}
                  disabled={unitCount >= 16}
                  className="flex h-11 w-12 shrink-0 items-center justify-center rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-foreground transition-all"
                  aria-label="Increase units"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Course / Syllabus Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Unit 1: Process Management & CPU Scheduling&#10;Unit 2: Memory Management & Virtual Memory..."
                className="w-full rounded-btn border border-border-subtle bg-black p-3 text-base sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-foreground-secondary hover:text-foreground flex items-center justify-center rounded-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2.5 min-h-[44px] rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center"
              >
                {isSubmitting ? "Creating..." : "Create Subject"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
