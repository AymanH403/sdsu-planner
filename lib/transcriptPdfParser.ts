import type { CourseRecord } from "./types";
import { parseBulkCourseInput } from "./bulkCourseParser";

export type TranscriptParseResult = {
  rawText: string;
  matched: CourseRecord[];
  unmatched: string[];
  extractedCodes: string[];
};

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    pages.push(text);
  }

  return pages.join("\n");
}

function cleanTranscriptText(text: string) {
  return text
    .toUpperCase()
    .replace(/\bREF\b/g, " ")
    .replace(/\bCOURSE\b/g, " ")
    .replace(/\bDESCRIPTION\b/g, " ")
    .replace(/\bATTEMPTED\b/g, " ")
    .replace(/\bEARNED\b/g, " ")
    .replace(/\bGRADE\b/g, " ")
    .replace(/\bPOINTS\b/g, " ")
    .replace(/\bPROGRAM\b/g, " ")
    .replace(/\bPLAN\b/g, " ")
    .replace(/\bMAJOR\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function prefixToRegex(prefix: string) {
  // "B A" becomes "B\s*A", allowing transcript text like:
  // B A 671
  // BA 671
  // B    A    671
  return prefix
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
}

export function extractPossibleCourseCodes(
  text: string,
  catalog: CourseRecord[],
): string[] {
  const cleaned = cleanTranscriptText(text);

  const prefixes = Array.from(
    new Set(catalog.map((course) => course.prefix.toUpperCase())),
  ).sort((a, b) => b.length - a.length);

  const found = new Set<string>();

  for (const prefix of prefixes) {
    const prefixPattern = prefixToRegex(prefix);

    const pattern = new RegExp(
      `(?:^|\\s)(${prefixPattern})\\s*-?\\s*(\\d{2,3}[A-Z]{0,3})(?=\\s|$)`,
      "g",
    );

    for (const match of cleaned.matchAll(pattern)) {
      const number = match[2].trim();
      found.add(`${prefix} ${number}`);
    }
  }

  return [...found];
}

export async function parseTranscriptPdf(
  file: File,
  catalog: CourseRecord[],
): Promise<TranscriptParseResult> {
  const rawText = await extractTextFromPdf(file);
  const extractedCodes = extractPossibleCourseCodes(rawText, catalog);
  const parsed = parseBulkCourseInput(extractedCodes.join("\n"), catalog);

  return {
    rawText,
    extractedCodes,
    matched: parsed.matched,
    unmatched: parsed.unmatched,
  };
}