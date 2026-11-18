import { describe, it, expect } from "vitest";
import { preprocessLaTeX } from "@/components/study/MarkdownContent";

describe("preprocessLaTeX", () => {
  it("converts inline \\( ... \\) to $...$", () => {
    const input = "The kinetic energy is \\( E = \\frac{1}{2}mv^2 \\) in physics.";
    const result = preprocessLaTeX(input);
    expect(result).toBe("The kinetic energy is $E = \\frac{1}{2}mv^2$ in physics.");
  });

  it("converts escaped \\\\( ... \\\\) to $...$", () => {
    const input = "Formula: \\\\( a^2 + b^2 = c^2 \\\\)";
    const result = preprocessLaTeX(input);
    expect(result).toBe("Formula: $a^2 + b^2 = c^2$");
  });

  it("converts block \\[ ... \\] to $$ ... $$", () => {
    const input = "Solve the integral:\n\\[ \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2} \\]";
    const result = preprocessLaTeX(input);
    expect(result).toContain("$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$");
  });

  it("converts escaped block \\\\[ ... \\\\] to $$ ... $$", () => {
    const input = "Matrix:\n\\\\[ \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix} \\\\]";
    const result = preprocessLaTeX(input);
    expect(result).toContain("$$\n\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}\n$$");
  });

  it("normalizes spaced single dollars $ x + y $ to $x + y$", () => {
    const input = "Given $ x + y = 10 $, find x.";
    const result = preprocessLaTeX(input);
    expect(result).toBe("Given $x + y = 10$, find x.");
  });

  it("preserves regular dollar amounts", () => {
    const input = "The price is $50 and another is $100.";
    const result = preprocessLaTeX(input);
    expect(result).toBe("The price is $50 and another is $100.");
  });
});
