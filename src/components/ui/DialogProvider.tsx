"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";

export type DialogVariant = "danger" | "warning" | "info" | "success";

export interface DialogOptions {
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface ActiveDialog extends DialogOptions {
  id: number;
  isAlert: boolean;
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  confirm: (options: string | DialogOptions) => Promise<boolean>;
  alert: (options: string | DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return ctx;
}

let dialogCounter = 0;

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: string | DialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const opts: DialogOptions =
        typeof options === "string"
          ? { title: "Confirm", message: options, variant: "danger" }
          : options;

      dialogCounter += 1;
      setActiveDialog({
        ...opts,
        id: dialogCounter,
        isAlert: false,
        resolve: (val: boolean) => {
          setActiveDialog(null);
          resolve(val);
        },
      });
    });
  }, []);

  const alert = useCallback((options: string | DialogOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      const opts: DialogOptions =
        typeof options === "string"
          ? { title: "Notice", message: options, variant: "info" }
          : options;

      dialogCounter += 1;
      setActiveDialog({
        ...opts,
        id: dialogCounter,
        isAlert: true,
        resolve: () => {
          setActiveDialog(null);
          resolve();
        },
      });
    });
  }, []);

  // Keyboard navigation & focus trap
  useEffect(() => {
    if (!activeDialog) return;

    // Focus default button
    const timer = setTimeout(() => {
      if (activeDialog.isAlert) {
        confirmBtnRef.current?.focus();
      } else if (activeDialog.variant === "danger") {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        activeDialog.resolve(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDialog]);

  const handleConfirm = () => {
    if (activeDialog) {
      activeDialog.resolve(true);
    }
  };

  const handleCancel = () => {
    if (activeDialog) {
      activeDialog.resolve(false);
    }
  };

  const variant = activeDialog?.variant || (activeDialog?.isAlert ? "info" : "danger");

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      <AnimatePresence>
        {activeDialog && (
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Dialog Card */}
            <motion.div
              key={activeDialog.id}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="relative z-10 w-full max-w-md rounded-card border border-border-subtle bg-surface p-5 sm:p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {variant === "danger" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-red-500/10 border border-red-500/20 text-red-400">
                      <Trash2 className="h-5 w-5" />
                    </div>
                  )}
                  {variant === "warning" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                  {variant === "info" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                      <Info className="h-5 w-5" />
                    </div>
                  )}
                  {variant === "success" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent-green/10 border border-accent-green/20 text-accent-green">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <h3
                    id="dialog-title"
                    className="text-base sm:text-lg font-bold tracking-tight text-foreground"
                  >
                    {activeDialog.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-btn p-1.5 text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-foreground-secondary leading-relaxed pl-0 sm:pl-[52px]">
                {typeof activeDialog.message === "string" ? (
                  <p className="whitespace-pre-line">{activeDialog.message}</p>
                ) : (
                  activeDialog.message
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                {!activeDialog.isAlert && (
                  <button
                    ref={cancelBtnRef}
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs sm:text-sm font-semibold text-foreground transition-all active:scale-[0.98]"
                  >
                    {activeDialog.cancelLabel || "Cancel"}
                  </button>
                )}

                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={handleConfirm}
                  className={
                    variant === "danger" && !activeDialog.isAlert
                      ? "px-5 py-2.5 min-h-[44px] rounded-btn bg-red-600 hover:bg-red-500 text-xs sm:text-sm font-bold text-white transition-all shadow-sm active:scale-[0.98]"
                      : "px-5 py-2.5 min-h-[44px] rounded-btn bg-white hover:bg-neutral-200 text-xs sm:text-sm font-bold text-black transition-all shadow-sm active:scale-[0.98]"
                  }
                >
                  {activeDialog.confirmLabel ||
                    (activeDialog.isAlert
                      ? "Got it"
                      : variant === "danger"
                      ? "Delete"
                      : "Confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
