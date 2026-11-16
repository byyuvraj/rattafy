"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Database,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  getStorageStats,
  ensureStoragePersistence,
} from "@/lib/storage";
import { clearAllUserProgress } from "@/lib/userProgress";
import { useDialog } from "@/components/ui/DialogProvider";

export default function SettingsPage() {
  const { confirm, alert } = useDialog();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<{
    usageKB: number;
    quotaMB: number;
    isPersisted: boolean;
  } | null>(null);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);

  useEffect(() => {
    // Check admin session status
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.authenticated)))
      .catch(() => setIsAdmin(false));

    getStorageStats().then(setStorageInfo);
    ensureStoragePersistence().then(() => {
      getStorageStats().then(setStorageInfo);
    });
  }, []);

  const handleRequestPersistence = async () => {
    setIsRequestingPersistence(true);
    await ensureStoragePersistence();
    const updated = await getStorageStats();
    setStorageInfo(updated);
    setIsRequestingPersistence(false);
  };

  const handleResetStudyProgress = async () => {
    const confirmed = await confirm({
      title: "Reset Personal Study Progress?",
      message: "This will reset all your known/learning marks and starred questions in this browser. The questions and subjects on the server will not be deleted.",
      confirmLabel: "Reset Progress",
      variant: "danger",
    });

    if (confirmed) {
      clearAllUserProgress();
      await alert({
        title: "Progress Reset",
        message: "Your personal study progress and card marks have been reset.",
        variant: "info",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings & Storage
        </h1>
        <p className="text-xs sm:text-sm text-foreground-secondary">
          Configure offline cache persistence, manage your local study progress, or open the Admin Portal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Admin Portal Card */}
        <div className="rounded-card border border-border-subtle bg-surface p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Admin Portal</h2>
                <p className="text-xs text-foreground-secondary">
                  Manage subjects, upload exam past-paper files, and publish questions.
                </p>
              </div>
            </div>

            <span
              className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700"
              }`}
            >
              {isAdmin ? "Admin Active" : "Locked"}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
            <p className="text-xs text-foreground-muted">
              {isAdmin
                ? "Your admin session is active on this browser."
                : "Passcode required to add or modify exam content."}
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-btn bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all"
            >
              <span>{isAdmin ? "Open Dashboard" : "Enter Admin Portal"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Offline Cache & Storage Persistence Card */}
        <div className="rounded-card border border-border-subtle bg-surface p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/5 border border-border-subtle text-accent-blue">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Browser Storage & Cache</h2>
              <p className="text-xs text-foreground-secondary">
                Guarantees persistent offline study even when device storage is low.
              </p>
            </div>
          </div>

          {storageInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-btn bg-black/40 border border-border-subtle">
                <span className="text-[11px] font-mono text-foreground-muted block mb-1">
                  Storage Used
                </span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {storageInfo.usageKB} KB
                </span>
              </div>
              <div className="p-3 rounded-btn bg-black/40 border border-border-subtle">
                <span className="text-[11px] font-mono text-foreground-muted block mb-1">
                  Available Quota
                </span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {storageInfo.quotaMB > 0 ? `${storageInfo.quotaMB} MB` : "Unrestricted"}
                </span>
              </div>
              <div className="p-3 rounded-btn bg-black/40 border border-border-subtle">
                <span className="text-[11px] font-mono text-foreground-muted block mb-1">
                  Cache Eviction Guard
                </span>
                <span
                  className={`text-sm font-bold font-mono inline-flex items-center gap-1 ${
                    storageInfo.isPersisted ? "text-accent-green" : "text-amber-400"
                  }`}
                >
                  {storageInfo.isPersisted ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Protected
                    </>
                  ) : (
                    "Best Effort"
                  )}
                </span>
              </div>
            </div>
          )}

          {!storageInfo?.isPersisted && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRequestPersistence}
                disabled={isRequestingPersistence}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-btn bg-white/5 border border-border-subtle hover:bg-white/10 text-xs font-semibold text-foreground transition-all"
              >
                {isRequestingPersistence ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-accent-blue" />
                )}
                Request Persistent Storage
              </button>
            </div>
          )}
        </div>

        {/* Reset Study Progress Card */}
        <div className="rounded-card border border-red-500/20 bg-red-950/10 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-red-400">Reset Study Session</h2>
              <p className="text-xs text-foreground-muted">
                Clear all your marked answers, known cards, and starred questions on this device.
              </p>
            </div>
          </div>

          <p className="text-xs text-foreground-secondary leading-relaxed">
            If you want to start fresh or prepare for a new exam revision cycle, resetting your progress will set all question cards back to new.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleResetStudyProgress}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-btn bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset My Study Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
