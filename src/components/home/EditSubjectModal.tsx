"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3 } from "lucide-react";
import { Subject } from "@/types";
import { useDialog } from "@/components/ui/DialogProvider";

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSubjectUpdated?: (updated: Subject) => void;
}

export default function EditSubjectModal({
  isOpen,
  onClose,
  subject,
  onSubjectUpdated,
}: EditSubjectModalProps) {
  const { alert } = useDialog();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name || "");
      setCode(subject.code || "");
      setBranch(subject.branch || "");
      setYear(subject.year || "");
      setSyllabus(subject.syllabus || "");
    }
  }, [subject, isOpen]);

  if (!isOpen || !subject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || null,
          branch: branch.trim() || null,
          year: year.trim() || null,
          syllabus: syllabus.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update subject");
      }

      onClose();
      onSubjectUpdated?.({
        ...subject,
        name: name.trim(),
        code: code.trim() || undefined,
        branch: branch.trim() || undefined,
        year: year.trim() || undefined,
        syllabus: syllabus.trim() || undefined,
      });
    } catch (err: any) {
      await alert({
        title: "Update Error",
        message: `Failed to update subject: ${err.message}`,
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
          className="relative w-full max-w-lg rounded-card border border-border-subtle bg-surface p-5 sm:p-6 shadow-card modal-glow z-10 my-8"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Edit Subject Details</h2>
                <p className="text-xs text-foreground-secondary truncate max-w-[220px] sm:max-w-sm">
                  Editing: <span className="text-foreground font-semibold">{subject.name}</span>
                </p>
              </div>
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

            {/* Subject Code, Branch, and Year Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CS-302"
                  className="w-full rounded-btn border border-border-subtle bg-black px-3 py-2 min-h-[40px] text-xs font-mono text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                  Branch / Stream
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CSE / IT"
                  className="w-full rounded-btn border border-border-subtle bg-black px-3 py-2 min-h-[40px] text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                  Year / Semester
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 3rd Year"
                  className="w-full rounded-btn border border-border-subtle bg-black px-3 py-2 min-h-[40px] text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Course / Syllabus Notes (Optional)
              </label>
              <textarea
                rows={4}
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Unit 1: Process Management & CPU Scheduling&#10;Unit 2: Memory Management & Virtual Memory..."
                className="w-full rounded-btn border border-border-subtle bg-black p-3 text-base sm:text-xs text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none font-mono"
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
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
