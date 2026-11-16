"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Settings, Key, Sparkles, Layers } from "lucide-react";
import { getApiKey } from "@/lib/storage";

export default function Navbar() {
  const pathname = usePathname();
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const key = getApiKey();
    setHasKey(Boolean(key));

    const handleStorageChange = () => {
      setHasKey(Boolean(getApiKey()));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-black/75 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white/10 border border-border-subtle text-foreground group-hover:border-accent-blue/40 group-hover:text-accent-blue transition-colors">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-foreground">Rattafy</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted px-1.5 py-0.5 rounded bg-white/[0.04] border border-border-subtle">
              beta
            </span>
          </div>
        </Link>

        {/* Center / Right Nav Items */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-btn transition-colors ${
              pathname === "/"
                ? "bg-white/10 text-foreground"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Subjects</span>
          </Link>

          {/* Gemini Key Status Pill */}
          <Link
            href="/settings"
            title={hasKey ? "Gemini API connected" : "Offline mode (No Gemini API key set)"}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn bg-white/[0.03] border border-border-subtle text-[11px] font-mono text-foreground-muted hover:border-border-hover transition-colors"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasKey ? "bg-accent-green shadow-[0_0_8px_#22c55e]" : "bg-neutral-600"
              }`}
            />
            {hasKey ? "Gemini Ready" : "Offline Mode"}
          </Link>

          <Link
            href="/settings"
            className={`inline-flex items-center gap-1.5 text-xs font-medium p-2 sm:px-2.5 sm:py-1.5 rounded-btn transition-colors ${
              pathname === "/settings"
                ? "bg-white/10 text-foreground"
                : "text-foreground-secondary hover:text-foreground hover:bg-white/[0.04]"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
