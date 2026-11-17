"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mt-3 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-medium text-foreground mt-3 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 text-neutral-200 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-neutral-200">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-neutral-200">{children}</ol>,
          li: ({ children }) => <li className="text-neutral-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent-blue/60 bg-accent-blue/[0.04] pl-4 py-1.5 my-3 rounded-r italic text-neutral-300 text-xs sm:text-sm">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border-subtle bg-black/40">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.05] border-b border-border-subtle">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3.5 py-2 font-mono text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="px-3.5 py-2 border-t border-border-subtle text-neutral-300">{children}</td>,
          img: ({ src, alt }: { src?: string; alt?: string }) => (
            <MarkdownImage src={src} alt={alt} />
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline) {
              return <CodeBlock code={codeString} language={match ? match[1] : ""} />;
            }

            return (
              <code
                className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-200 border border-white/[0.08]"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  // Reset zoom level when lightbox closes
  useEffect(() => {
    if (!isLightboxOpen) {
      setZoomScale(1);
    }
  }, [isLightboxOpen]);

  if (!src) return null;

  if (hasError) {
    return (
      <div className="my-3 flex items-center justify-between gap-3 p-3 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="font-semibold truncate">Diagram failed to load</p>
            <p className="text-[11px] text-amber-300/70 truncate">{alt || src}</p>
          </div>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] underline hover:text-white shrink-0 font-mono"
        >
          <span>Open link</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <>
      <figure className="my-4 rounded-xl border border-border-subtle bg-black/40 overflow-hidden group">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsLightboxOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
          className="relative flex items-center justify-center p-3 sm:p-5 bg-black/30 hover:bg-black/20 transition-colors cursor-zoom-in min-h-[140px]"
          title="Click to view full-size diagram"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
                <span>Loading diagram...</span>
              </div>
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || "Diagram"}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={clsx(
              "max-h-72 sm:max-h-96 md:max-h-[440px] w-auto max-w-full object-contain rounded transition-all duration-300",
              isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}
          />

          {!isLoading && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md border border-white/10 rounded-btn px-2 py-1 flex items-center gap-1 text-[11px] text-foreground font-mono shadow-lg">
              <ZoomIn className="h-3 w-3 text-accent-blue" />
              <span>Zoom</span>
            </div>
          )}
        </div>

        {alt && (
          <figcaption className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-foreground-muted font-mono bg-white/[0.02] border-t border-border-subtle">
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted/70" />
            <span className="truncate max-w-full text-neutral-300">{alt}</span>
          </figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top header bar */}
          <div
            className="flex items-center justify-between gap-3 pb-3 border-b border-border-subtle shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ImageIcon className="h-4 w-4 text-accent-blue shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                {alt || "Diagram Viewer"}
              </span>
              <span className="text-[11px] font-mono text-foreground-muted px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                {Math.round(zoomScale * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(prev + 0.25, 3))}
                disabled={zoomScale >= 3}
                className="p-1.5 rounded-btn bg-white/5 hover:bg-white/10 disabled:opacity-40 text-foreground transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(prev - 0.25, 0.5))}
                disabled={zoomScale <= 0.5}
                className="p-1.5 rounded-btn bg-white/5 hover:bg-white/10 disabled:opacity-40 text-foreground transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-foreground transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-btn bg-white/5 hover:bg-white/10 text-foreground transition-colors"
                title="Open original image in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-btn bg-white/10 hover:bg-white/20 text-foreground transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lightbox image content */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 cursor-zoom-out"
            onClick={() => setIsLightboxOpen(false)}
          >
            <div
              className="inline-block transition-transform duration-200 ease-out cursor-default"
              style={{ transform: `scale(${zoomScale})` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || "Diagram view"}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg border border-border-subtle shadow-2xl bg-black/60"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg border border-border-subtle bg-[#0a0a0a] overflow-hidden group">
      {/* Code header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-border-subtle text-xs font-mono text-foreground-muted">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-foreground-secondary hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre className="p-3.5 overflow-x-auto font-mono text-xs text-neutral-200 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
