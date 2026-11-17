"use client";

import React, { useState, useRef, useId } from "react";
import {
  ImagePlus,
  Image as ImageIcon,
  Eye,
  Edit3,
  X,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Bold,
  List,
  Code,
  Table,
} from "lucide-react";
import MarkdownContent from "@/components/study/MarkdownContent";

interface AnswerWithDiagramEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  minHeight?: string;
}

interface ParsedDiagram {
  caption: string;
  url: string;
  raw: string;
  index: number;
}

export default function AnswerWithDiagramEditor({
  value,
  onChange,
  placeholder = "Write answer in Markdown... You can add bullet points, code, and diagram images.",
  rows = 5,
  label = "Answer (Markdown & Diagrams)",
  minHeight = "130px",
}: AnswerWithDiagramEditorProps) {
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isDiagramDrawerOpen, setIsDiagramDrawerOpen] = useState(false);

  // Inserter state
  const [diagramUrl, setDiagramUrl] = useState("");
  const [diagramCaption, setDiagramCaption] = useState("");
  const [imgStatus, setImgStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  // Parse any existing diagrams in value
  const parseDiagrams = (text: string): ParsedDiagram[] => {
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    const diagrams: ParsedDiagram[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      diagrams.push({
        caption: match[1] || "Diagram",
        url: match[2],
        raw: match[0],
        index: match.index,
      });
    }
    return diagrams;
  };

  const detectedDiagrams = parseDiagrams(value);

  // Test URL when it changes
  const handleUrlChange = (url: string) => {
    setDiagramUrl(url);
    if (!url.trim()) {
      setImgStatus("idle");
      setImgDimensions(null);
      return;
    }

    setImgStatus("loading");
    setImgDimensions(null);

    const testImg = new window.Image();
    testImg.onload = () => {
      setImgStatus("success");
      setImgDimensions({ width: testImg.naturalWidth, height: testImg.naturalHeight });
    };
    testImg.onerror = () => {
      setImgStatus("error");
      setImgDimensions(null);
    };
    testImg.src = url.trim();
  };

  // Insert diagram markdown into answer text
  const handleInsertDiagram = () => {
    const trimmedUrl = diagramUrl.trim();
    if (!trimmedUrl) return;

    const caption = diagramCaption.trim() || "Diagram";
    const diagramMarkdown = `\n\n![${caption}](${trimmedUrl})\n\n`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? value.length;
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + diagramMarkdown + after;
      onChange(newValue);
    } else {
      onChange(value ? `${value.trimEnd()}${diagramMarkdown}` : diagramMarkdown.trim());
    }

    // Reset drawer
    setDiagramUrl("");
    setDiagramCaption("");
    setImgStatus("idle");
    setImgDimensions(null);
    setIsDiagramDrawerOpen(false);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Remove a specific diagram from the text
  const handleRemoveDiagram = (rawTag: string) => {
    const updated = value.replace(rawTag, "").trim();
    onChange(updated);
  };

  // Helper formatting shortcuts
  const insertFormatting = (prefix: string, suffix: string, defaultText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  return (
    <div className="space-y-2 w-full">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
        <div className="flex items-center gap-1.5">
          <label htmlFor={textareaId} className="text-[11px] font-mono font-medium text-foreground-secondary">
            {label}
          </label>
          {detectedDiagrams.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue text-[10px] font-mono">
              <ImageIcon className="h-2.5 w-2.5" />
              {detectedDiagrams.length} {detectedDiagrams.length === 1 ? "diagram" : "diagrams"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Markdown Actions */}
          {activeTab === "write" && (
            <div className="hidden sm:flex items-center gap-0.5 pr-2 mr-2 border-r border-border-subtle">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**", "bold text")}
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                title="Bold (**text**)"
              >
                <Bold className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n- ", "", "list item")}
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                title="Bullet List (- item)"
              >
                <List className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("```\n", "\n```", "// code here")}
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                title="Code Block"
              >
                <Code className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() =>
                  insertFormatting(
                    "\n\n| Item | Description |\n|---|---|\n| 1 | ",
                    " |\n",
                    "Example"
                  )
                }
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                title="Table"
              >
                <Table className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Add Diagram URL Button */}
          <button
            type="button"
            onClick={() => {
              setIsDiagramDrawerOpen(!isDiagramDrawerOpen);
              if (activeTab === "preview") setActiveTab("write");
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn text-xs font-medium transition-all ${
              isDiagramDrawerOpen
                ? "bg-accent-blue text-white shadow-sm"
                : "bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
            }`}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Add Diagram URL</span>
          </button>

          {/* Write / Preview Tab Switcher */}
          <div className="flex items-center bg-black/40 border border-border-subtle rounded-btn p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                activeTab === "write"
                  ? "bg-white/15 text-foreground font-semibold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Edit3 className="h-2.5 w-2.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                activeTab === "preview"
                  ? "bg-white/15 text-foreground font-semibold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Eye className="h-2.5 w-2.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagram Inserter Drawer */}
      {isDiagramDrawerOpen && (
        <div className="p-3 rounded-card bg-neutral-900/90 border border-accent-blue/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-accent-blue" />
              <span className="text-xs font-semibold text-foreground">Insert Diagram / Image URL</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDiagramDrawerOpen(false)}
              className="p-1 text-foreground-muted hover:text-foreground rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input Fields */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block mb-1">
                  Diagram Image URL *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/diagram.png or imgur/cdn url"
                  value={diagramUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-surface border border-border-subtle focus:border-accent-blue rounded-btn px-2.5 py-1.5 text-xs text-foreground font-mono focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block mb-1">
                  Caption / Alt Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8086 Internal Architecture Diagram"
                  value={diagramCaption}
                  onChange={(e) => setDiagramCaption(e.target.value)}
                  className="w-full bg-surface border border-border-subtle focus:border-accent-blue rounded-btn px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-foreground-muted leading-tight">
                Direct image links (.png, .jpg, .svg, .webp) from Imgur, Cloudinary, GitHub raw, or university CDNs work directly.
              </p>
            </div>

            {/* Live Image Verification Preview Box */}
            <div className="flex flex-col">
              <label className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted block mb-1">
                Live URL Preview
              </label>

              <div className="flex-1 min-h-[110px] max-h-[140px] rounded-btn border border-border-subtle bg-black/50 p-2 flex flex-col items-center justify-center overflow-hidden relative">
                {imgStatus === "idle" && (
                  <div className="text-center p-2 text-foreground-muted">
                    <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-40" />
                    <p className="text-[11px]">Enter an image URL above to test preview</p>
                  </div>
                )}

                {imgStatus === "loading" && (
                  <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-blue" />
                    <span>Verifying image link...</span>
                  </div>
                )}

                {imgStatus === "error" && (
                  <div className="text-center p-2 text-rose-400">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-rose-400" />
                    <p className="text-xs font-medium">Image failed to load</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Check that the link is publicly accessible and a direct image URL.
                    </p>
                  </div>
                )}

                {imgStatus === "success" && (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={diagramUrl}
                      alt={diagramCaption || "Preview"}
                      className="max-h-20 w-auto object-contain rounded"
                    />
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
                      <Check className="h-3 w-3" />
                      <span>
                        Verified ({imgDimensions?.width}×{imgDimensions?.height}px)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsDiagramDrawerOpen(false)}
              className="px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertDiagram}
              disabled={!diagramUrl.trim()}
              className="px-3.5 py-1.5 rounded-btn bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>Insert Diagram</span>
            </button>
          </div>
        </div>
      )}

      {/* Detected Diagrams Chips List */}
      {detectedDiagrams.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-btn bg-white/[0.02] border border-border-subtle">
          <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider mr-1">
            Attached Diagrams:
          </span>
          {detectedDiagrams.map((d, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-border-subtle text-xs text-foreground group"
            >
              <ImageIcon className="h-3 w-3 text-accent-blue" />
              <span className="max-w-[120px] truncate text-[11px] font-medium" title={d.caption}>
                {d.caption || "Diagram"}
              </span>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-muted hover:text-foreground"
                title="Open image URL"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <button
                type="button"
                onClick={() => handleRemoveDiagram(d.raw)}
                className="text-foreground-muted hover:text-rose-400 ml-0.5"
                title="Remove diagram from answer"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Body: Write vs Preview */}
      {activeTab === "write" ? (
        <textarea
          id={textareaId}
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full bg-surface border border-border-subtle focus:border-border-focus rounded-btn px-3 py-2 text-xs font-mono text-foreground leading-relaxed focus:outline-none transition-colors resize-y"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full rounded-btn border border-border-subtle bg-black/40 p-3.5 overflow-y-auto max-h-96"
        >
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-xs text-foreground-muted italic py-4 text-center">
              No answer content to preview yet. Switch back to Write tab to compose your answer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
