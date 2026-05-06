import type { CourseRecord } from "./types";
import { parseBulkCourseInput } from "./bulkCourseParser";

export type TranscriptParsedTerm = {
  id: string;
  name: string;
  courseCodes: string[];
};

export type TranscriptParseResult = {
  rawText: string;
  matched: CourseRecord[];
  unmatched: string[];
  extractedCodes: string[];
  terms: TranscriptParsedTerm[];
  courseTermMap: Record<string, string>;
  transferWarning: boolean;
  transferWarningReasons: string[];
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
  return prefix
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
}

function normalizeTermName(raw: string) {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(\d{4})\s+(FALL|SPRING|SUMMER|WINTER)\b/i, "$2 $1")
    .toUpperCase();
}

function termIdFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function findTermHeaders(text: string) {
  const normalized = text.toUpperCase().replace(/\s+/g, " ");
  const termPattern =
    /\b((FALL|SPRING|SUMMER|WINTER)\s+\d{4}|\d{4}\s+(FALL|SPRING|SUMMER|WINTER))\b/g;

  return [...normalized.matchAll(termPattern)].map((match) => ({
    index: match.index ?? 0,
    name: normalizeTermName(match[1]),
  }));
}

function extractCodesFromText(text: string, catalog: CourseRecord[]) {
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

export function detectTransferCreditWarning(text: string) {
  const upper = text.toUpperCase();

  const checks = [
    { label: "Transfer credit", pattern: /\bTRANSFER\s+(CREDIT|CREDITS|UNITS|WORK)\b/ },
    { label: "Credits transferred", pattern: /\b(CREDITS|UNITS)\s+TRANSFERRED\b/ },
    { label: "Test credit", pattern: /\b(TEST|EXAM)\s+CREDIT\b/ },
    { label: "AP credit", pattern: /\b(AP|ADVANCED\s+PLACEMENT)\b/ },
    { label: "IB credit", pattern: /\b(IB|INTERNATIONAL\s+BACCALAUREATE)\b/ },
    { label: "CLEP credit", pattern: /\bCLEP\b/ },
  ];

  const reasons = checks
    .filter((check) => check.pattern.test(upper))
    .map((check) => check.label);

  return {
    transferWarning: reasons.length > 0,
    transferWarningReasons: reasons,
  };
}

export function extractTranscriptTerms(
  text: string,
  catalog: CourseRecord[],
): {
  extractedCodes: string[];
  terms: TranscriptParsedTerm[];
  courseTermMap: Record<string, string>;
} {
  const clean = cleanTranscriptText(text);
  const headers = findTermHeaders(clean);

  if (headers.length === 0) {
    const extractedCodes = extractCodesFromText(clean, catalog);
    return { extractedCodes, terms: [], courseTermMap: {} };
  }

  const terms: TranscriptParsedTerm[] = [];
  const courseTermMap: Record<string, string> = {};
  const allCodes = new Set<string>();

  for (let i = 0; i < headers.length; i++) {
    const current = headers[i];
    const next = headers[i + 1];

    const chunk = clean.slice(current.index, next?.index ?? clean.length);
    const codes = extractCodesFromText(chunk, catalog);
    const id = termIdFromName(current.name);

    if (codes.length > 0) {
      const existing = terms.find((term) => term.id === id);

      if (existing) {
        existing.courseCodes = Array.from(new Set([...existing.courseCodes, ...codes]));
      } else {
        terms.push({ id, name: current.name, courseCodes: codes });
      }

      for (const code of codes) {
        allCodes.add(code);
        courseTermMap[code] = id;
      }
    }
  }

  return {
    extractedCodes: [...allCodes],
    terms,
    courseTermMap,
  };
}

export async function parseTranscriptPdf(
  file: File,
  catalog: CourseRecord[],
): Promise<TranscriptParseResult> {
  const rawText = await extractTextFromPdf(file);
  const extracted = extractTranscriptTerms(rawText, catalog);
  const parsed = parseBulkCourseInput(extracted.extractedCodes.join("\n"), catalog);
  const warning = detectTransferCreditWarning(rawText);

  return {
    rawText,
    extractedCodes: extracted.extractedCodes,
    matched: parsed.matched,
    unmatched: parsed.unmatched,
    terms: extracted.terms,
    courseTermMap: extracted.courseTermMap,
    transferWarning: warning.transferWarning,
    transferWarningReasons: warning.transferWarningReasons,
  };
}