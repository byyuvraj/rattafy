"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

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
