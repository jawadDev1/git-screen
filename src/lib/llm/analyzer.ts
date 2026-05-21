import { getGeminiClient, GEMINI_MODEL } from "./client";
import { buildPrompt, IPromptInput } from "./prompts";
import { IGeminiReport } from "@/types";

// Response Parser
const extractSection = (text: string, header: string): string => {
  const pattern = new RegExp(
    `${header}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\d+\\.|$)`,
    "i",
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
};

const extractBullets = (text: string): string[] => {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);
};

const parseGeneralReport = (raw: string): IGeminiReport["sections"] => ({
  snapshot: extractSection(raw, "1\\. SNAPSHOT"),
  technicalExpertise: extractSection(raw, "2\\. TECHNICAL EXPERTISE"),
  workStyle: extractSection(raw, "3\\. WORK STYLE"),
  projectQuality: extractSection(raw, "4\\. PROJECT QUALITY"),
  strengths: extractBullets(extractSection(raw, "5\\. STRENGTHS")),
  concerns: extractBullets(extractSection(raw, "6\\. CONCERNS")),
  verdict: extractSection(raw, "7\\. RECRUITER VERDICT"),
});

const parseJDReport = (raw: string): IGeminiReport["sections"] => ({
  snapshot: extractSection(raw, "1\\. SNAPSHOT"),
  technicalExpertise: "",
  workStyle: "",
  projectQuality: "",
  jdFitAssessment: extractSection(raw, "2\\. JD FIT ASSESSMENT"),
  technicalMatch: extractSection(raw, "3\\. TECHNICAL MATCH"),
  roleSuitability: extractSection(raw, "4\\. ROLE SUITABILITY"),
  strengthsForRole: extractBullets(
    extractSection(raw, "5\\. STRENGTHS FOR THIS ROLE"),
  ),
  gapsForRole: extractBullets(extractSection(raw, "6\\. GAPS FOR THIS ROLE")),
  strengths: [],
  concerns: [],
  verdict: extractSection(raw, "7\\. RECRUITER VERDICT"),
});

// Main Analyzer

export const generateCandidateReport = async (
  input: IPromptInput,
): Promise<IGeminiReport> => {
  const client = getGeminiClient();
  const prompt = buildPrompt(input);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 1500,
        // not deep reasoning
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    clearTimeout(timeoutId);

    const raw = response.text ?? "";

    if (!raw.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    const hasJD = input.jdMatch !== null;
    const sections = hasJD ? parseJDReport(raw) : parseGeneralReport(raw);

    return {
      raw,
      sections,
      generatedAt: new Date(),
      hasJD,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini API timed out after 30 seconds. Try again.");
    }

    const message =
      error instanceof Error ? error.message : "Unknown Gemini API error.";
    throw new Error(`Failed to generate report: ${message}`);
  }
};
