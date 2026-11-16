import { GeminiExtractedItem } from "@/types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Lightweight API key validation
export async function validateGeminiApiKey(
  apiKey: string,
  model = "gemini-2.5-flash"
): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, error: "API key cannot be empty." };
  }

  try {
    const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "ping" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message =
        errData?.error?.message || `API error (${response.status}): ${response.statusText}`;
      return { valid: false, error: message };
    }

    return { valid: true };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || "Failed to reach Google Gemini API. Please check your internet connection.",
    };
  }
}

// Convert File to base64
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Extract questions from past paper images/PDFs with Gemini
export async function extractQuestionsFromMedia(
  apiKey: string,
  model: string,
  fileData: { base64: string; mimeType: string },
  syllabusContext?: string,
  retryCount = 0
): Promise<GeminiExtractedItem[]> {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  let prompt = `You are a precision exam paper extractor. Analyze this past paper / test document and extract every question and answer (if answers are provided).
Extract metadata including marks, examination year, exam name (e.g. MST1, Midterm, EndSem), and unit.
If the paper does not have answers written, return the "answer" field as an empty string "".`;

  if (syllabusContext && syllabusContext.trim()) {
    prompt += `\n\nReference Syllabus Units for categorization:\n${syllabusContext}\nMap each extracted question to the closest matching unit number (1, 2, 3...) and unitTitle from this syllabus. If uncertain, set unit to null.`;
  }

  prompt += `\n\nReturn ONLY a JSON array adhering to this schema:
[
  {
    "question": "Exact question text",
    "answer": "Answer if present on the sheet, or empty string",
    "unit": 1,
    "unitTitle": "Unit name or null",
    "marks": 5,
    "year": "2023",
    "exam": "MST1"
  }
]`;

  const payload = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: fileData.mimeType,
              data: fileData.base64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429 && retryCount < 2) {
      // Exponential backoff for rate limits
      await new Promise((res) => setTimeout(res, 2000 * (retryCount + 1)));
      return extractQuestionsFromMedia(apiKey, model, fileData, syllabusContext, retryCount + 1);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error("Gemini returned an empty response.");
    }

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.questions)) {
        return parsed.questions;
      }
      return [];
    } catch (parseErr) {
      // Repair prompt retry
      if (retryCount === 0) {
        return repairMalformedJson(apiKey, model, candidate);
      }
      throw new Error("Unable to parse Gemini output into structured questions.");
    }
  } catch (err: any) {
    throw err;
  }
}

// Single-retry JSON repair
async function repairMalformedJson(apiKey: string, model: string, brokenJson: string): Promise<GeminiExtractedItem[]> {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Repair this broken JSON output into a valid JSON array of { question, answer, unit, unitTitle, marks, year, exam } objects:\n\n${brokenJson}`,
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0,
      },
    }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    const fixed = JSON.parse(text);
    return Array.isArray(fixed) ? fixed : [];
  } catch {
    return [];
  }
}

// Auto-assign units to unsorted questions using Gemini
export async function autoAssignUnits(
  apiKey: string,
  model: string,
  questions: { question: string }[],
  unitList: { number: number; title: string }[]
): Promise<{ unitNumber: number; unitTitle: string }[]> {
  if (questions.length === 0 || unitList.length === 0) return [];

  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
  const prompt = `Classify each exam question into the most relevant Unit number and Unit title from this syllabus:
${JSON.stringify(unitList, null, 2)}

Questions to classify:
${JSON.stringify(questions.map((q) => q.question), null, 2)}

Return ONLY a JSON array with one object per question in matching order:
[
  { "unitNumber": 1, "unitTitle": "Introduction" },
  ...
]`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to classify units: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

// Generate an exam-grade answer with Gemini
export async function generateAnswerForQuestion(
  apiKey: string,
  model: string,
  question: string,
  marks?: number,
  subjectName?: string
): Promise<string> {
  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const prompt = `You are an expert university professor in ${subjectName || "Computer Science / Engineering"}.
Write a high-yield, structured, exam-grade answer for this past-paper question:
"${question}"
${marks ? `Expected weightage: ${marks} marks.` : ""}

Guidelines:
- Format in clean, readable Markdown.
- Use clear bullet points, bold key terms, tables if comparing concepts, and formatted code blocks if code/SQL is required.
- Be concise yet thorough—what an evaluator looks for to award full marks.
- Do NOT include conversational filler like "Here is the answer". Start straight with the explanation.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gemini answer generation failed (${response.status})`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
