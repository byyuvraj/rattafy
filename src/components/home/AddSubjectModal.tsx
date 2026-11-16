"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, BookOpen, Layers } from "lucide-react";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { Subject, Unit } from "@/types";

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
  const [name, setName] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [unitCount, setUnitCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const subjectId = generateId();
      const now = Date.now();

      const newSubject: Subject = {
        id: subjectId,
        name: name.trim(),
        createdAt: now,
        syllabus: syllabus.trim() || undefined,
      };

      // Create default units
      const initialUnits: Unit[] = [];
      for (let i = 1; i <= unitCount; i++) {
        initialUnits.push({
          id: generateId(),
          subjectId,
          number: i,
          title: `Unit ${i}`,
        });
      }

      await db.transaction("rw", db.subjects, db.units, async () => {
        await db.subjects.add(newSubject);
        if (initialUnits.length > 0) {
          await db.units.bulkAdd(initialUnits);
        }
      });

      setName("");
      setSyllabus("");
      onClose();
      onSubjectAdded?.(subjectId);
    } catch (err: any) {
      alert(`Failed to create subject: ${err.message}`);
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
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Initial Units Count
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={unitCount}
                onChange={(e) => setUnitCount(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-btn border border-border-subtle bg-black px-3.5 py-2.5 min-h-[44px] text-base sm:text-xs font-mono text-foreground focus:border-border-focus focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground-secondary block mb-1.5">
                Syllabus Outline (Optional for AI classification)
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
                Create Subject
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
