"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, ShieldCheck, Sparkles, ArrowRight, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getApiKey, setApiKey, hasUserOnboarded, setHasOnboarded, getSelectedModel } from "@/lib/storage";
import { validateGeminiApiKey } from "@/lib/gemini";

interface OnboardingModalProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

export default function OnboardingModal({ forceOpen = false, onComplete }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setKeyInput(getApiKey());
      setIsOpen(true);
    } else {
      const alreadyOnboarded = hasUserOnboarded();
      if (!alreadyOnboarded) {
        setIsOpen(true);
      }
    }
  }, [forceOpen]);

  const handleValidateAndSave = async () => {
    if (!keyInput.trim()) {
      setValidationError("Please enter an API key or click 'Continue without Key'.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      const res = await validateGeminiApiKey(keyInput.trim(), getSelectedModel());
      if (res.valid) {
        setValidationSuccess(true);
        setApiKey(keyInput.trim());
        setTimeout(() => {
          setHasOnboarded(true);
          setIsOpen(false);
          onComplete?.();
        }, 600);
      } else {
        setValidationError(res.error || "Invalid API key. Please check the key from Google AI Studio.");
      }
    } catch (err: any) {
      setValidationError(err?.message || "Failed to validate API key.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    setHasOnboarded(true);
    setIsOpen(false);
    onComplete?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-card border border-border-subtle bg-surface p-7 shadow-card modal-glow z-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome to Rattafy</h2>
              <p className="text-xs text-foreground-secondary">
                Turn past-paper giant docs into structured, swipeable exam mastery cards.
              </p>
            </div>
          </div>

          {/* Privacy Banner */}
          <div className="mb-5 rounded-btn border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-xs text-neutral-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-emerald-300">100% Client-Side Privacy:</span> Your API key is stored strictly inside your browser&apos;s <code className="font-mono text-emerald-200">localStorage</code>. It is never logged or transmitted to any server of ours.
              </div>
            </div>
          </div>

          {/* Key Input Section */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-foreground-secondary flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Google Gemini API Key (Optional)
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline"
                >
                  Get free key at Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setValidationError(null);
                }}
                placeholder="AIzaSy..."
                className="w-full rounded-btn border border-border-subtle bg-black px-3.5 py-2.5 font-mono text-sm text-foreground placeholder:text-foreground-muted focus:border-border-focus focus:outline-none transition-colors"
              />
            </div>

            {/* Error or Success notification */}
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-btn border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </motion.div>
            )}

            {validationSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-btn border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Key validated successfully! Storing securely in browser.</span>
              </motion.div>
            )}

            <p className="text-xs text-foreground-muted leading-relaxed">
              Enables Gemini features: photo / scan paper OCR (Mode B), syllabus unit auto-assigning, and AI answer synthesis. You can change or remove it anytime in Settings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto text-xs text-foreground-secondary hover:text-foreground hover:underline transition-colors px-2 py-1"
            >
              Continue without API key (Mode A Text only)
            </button>

            <button
              type="button"
              disabled={isValidating || validationSuccess}
              onClick={handleValidateAndSave}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-btn bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating Key...
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
