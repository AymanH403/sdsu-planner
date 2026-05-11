# SDSU CPA Planner

SDSU CPA Planner is a local-first desktop and web application for SDSU students who want to estimate whether completed or planned coursework satisfies California CPA education requirements.

The app works entirely locally and does not require a backend server. It is built with Next.js, React, TypeScript, Tailwind CSS, and Tauri.

> Important: This tool is an unofficial planning aid. It does not replace evaluation by the California Board of Accountancy, an academic advisor, or an official transcript review.

---

## Project Goals

This app is designed to help students:

- load an unofficial SDSU transcript PDF locally
- detect term-by-term courses and units
- match courses against the SDSU catalog
- classify courses into CPA requirement categories
- review and correct course assignments
- track CPA progress against selected rulesets
- export or print an eligibility report

The goal is to provide an automated first-pass audit that students can review and adjust before seeking official guidance.

---

## What the App Does

### Transcript Upload and Review

- The user selects or drops a PDF transcript in `components/transcript/TranscriptUpload.tsx`.
- `lib/transcriptPdfParser.ts` extracts text from the PDF using `pdfjs-dist`.
- The parser detects term headings, course lines, and units.
- Detected courses are matched to the SDSU catalog in `data/sdsu_courses.json`.
- A review modal appears so the user can accept, reject, or edit each detected course before importing.

### Course Matching

- `lib/courses.ts` normalizes SDSU course codes and prefix formats.
- `lib/bulkCourseParser.ts` supports bulk entry and flexible formats such as:
  - `ACCTG202`
  - `ACCTG 202`
  - `B A 673`
  - `BA673`
- The matching code handles spaced prefixes like `B A`, `A E`, and `M E`.

### Manual Course Entry

Manually adding a course is supported for:

- retired SDSU courses
- transfer or external credits
- test credit courses
- courses not present in the catalog JSON

Manual entries still participate in classification and audit calculations.

### Course Classification

- `lib/classifier.ts` identifies candidate CPA buckets for each course.
- Classification uses:
  - course prefix
  - course title keywords
  - accounting-related terms
  - business keywords
  - ethics/professional responsibility indicators
  - special topics / independent study signals
- The output is a list of candidate buckets with confidence scores.

### Audit Engine

- `lib/auditEngine.ts` is the core allocation engine.
- It allocates courses to requirement buckets based on the selected ruleset.
- It respects manual overrides and only uses general units when needed.
- It calculates:
  - total and bucket-specific unit progress
  - remaining units needed
  - warnings and review flags
  - eligibility status
- It also generates an audit log explaining each allocation decision.

### Semester Planner

- `components/planner/SemesterPlan.tsx` displays terms and courses grouped by academic year.
- Users can:
  - add or delete terms
  - move courses between terms
  - move courses to "Unassigned"
  - edit units for variable-unit courses
- Terms are sorted using the semester order: `WINTER`, `SPRING`, `SUMMER`, `FALL`.

### Allocation Board

- `components/planner/AllocationBoard.tsx` provides manual CPA bucket allocation.
- Users can drag courses into different requirement buckets when automatic assignment is not correct.
- The visible bucket list depends on the selected ruleset.
- Courses can be reset to automatic allocation.

### Printable Report

- `components/report/EligibilityReport.tsx` builds a worksheet-style printable report.
- The report includes:
  - progress summaries
  - bucket allocations
  - warnings
  - course breakdowns
  - term information
- Users print or save it as PDF from the browser or desktop print dialog.

### ASSIST Roadmap Page

- `app/assist/page.tsx` is a roadmap for future ASSIST transfer lookup integration.
- It is currently a placeholder and not a functioning ASSIST lookup.

---

## Architecture Overview

### Folder Structure

```text
app/
  page.tsx                 Upload and transcript landing page
  dashboard/page.tsx       Main planner dashboard
  allocations/page.tsx     Manual CPA bucket allocation board
  assist/page.tsx          ASSIST roadmap page
  settings/page.tsx        Settings, export, and import page
  layout.tsx               Root layout and shell
  globals.css              Global styles

components/
  courses/                 Course search, bulk add, and manual add UI
  layout/                  Shared shell and sidebar layout
  planner/                 Planner UI, allocation board, and report actions
  report/                  Printable eligibility report UI
  transcript/              Transcript upload and review UI

lib/
  auditEngine.ts           Core CPA allocation and progress logic
  bulkCourseParser.ts      Bulk input parsing utilities
  classifier.ts            Course classification logic
  componentHelpers.ts      Shared allocation and bucket helpers
  constants.ts             Shared constants and storage keys
  courses.ts               SDSU catalog normalization and course matching
  rulesets.ts              CPA ruleset definitions
  storage.ts               localStorage persistence helpers
  styleUtils.ts            Bucket styling configuration and helpers
  transcriptPdfParser.ts   PDF transcript parsing logic
  types.ts                 Shared TypeScript types and interfaces
  usePlannerState.ts       Main state management and audit hook

data/
  sdsu_courses.json        SDSU course catalog data

src-tauri/
  tauri.conf.json          Tauri desktop configuration
  Cargo.toml               Rust dependency manifest
```

### Key Shared Files

- `lib/constants.ts` holds shared values such as `SEASONS`, `STORAGE_KEYS`, and `REVIEW_TERMS`.
- `lib/styleUtils.ts` centralizes bucket styling and labels.
- `lib/componentHelpers.ts` centralizes bucket selection and drag/drop validation.
- `lib/storage.ts` handles local persistence for plan and audit log.
- `lib/usePlannerState.ts` ties planner state, audit results, and storage together.

---

## Build and Run Instructions

### Prerequisites

Install:

- Node.js
- npm
- Rust toolchain
- Tauri dependencies for your operating system

### Setup

From the project root:

```bash
npm install
```

### Run in development mode (web)

```bash
npm run dev
```

### Build the production web app

```bash
npm run build
```

### Run the desktop app in development mode

```bash
npm run app:dev
```

### Build the desktop application

```bash
npm run app:build
```

The web app is exported to `out/`, and Tauri packages that output into a desktop executable.

For distribution, the final release bundle can be packaged as a ZIP containing the generated `.msi` installer. End users can run that MSI to install the app without needing Node.js, npm, Rust, or any development tools.

---

## Reproducing the Project

These steps are enough for a classmate to duplicate the solution:

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Run `npm run dev` to start the web app.
4. Open the local URL in the browser.
5. Upload an unofficial SDSU transcript PDF or add courses manually.
6. Review detected courses and import them into the dashboard.
7. Use the allocation board to adjust bucket assignments.
8. Export or print the eligibility report.

For the desktop wrapper:

1. Build the web app with `npm run build`.
2. Launch `npm run app:dev` for Tauri development.
3. Build the final desktop package with `npm run app:build`.

---

## Important Implementation Details

### SDSU prefix handling

SDSU course prefixes may contain spaces, such as `B A` and `A E`.
The matching logic normalizes prefixes and codes so that input like `BA673` and `B A 673` refer to the same course.

### Local persistence

The app persists planner state locally with `lib/storage.ts` and `lib/usePlannerState.ts`.
Saved state includes terms, entries, selected ruleset, and audit log history.

### Tauri packaging

- `next.config.js` uses `output: "export"` so Next.js generates a static site.
- `src-tauri/tauri.conf.json` points Tauri to the static output.
- `src-tauri/Cargo.toml` defines the Rust and Tauri dependencies.
- `npm run app:build` produces the desktop executable.

---

## How to Extend the App

### Add a new CPA requirement bucket

1. Add the bucket to `RequirementBucket` in `lib/types.ts`.
2. Add styling and labels in `lib/styleUtils.ts`.
3. Add classification support in `lib/classifier.ts`.
4. Update allocation logic in `lib/auditEngine.ts`.
5. Adjust UI components if they assume a fixed bucket list.

### Add a new ruleset

1. Add the ruleset to `lib/rulesets.ts`.
2. Update the settings/options UI if needed.
3. Verify the audit engine calculates the new requirements.

---

## Troubleshooting

### If the app does not start

- Run `npm install` first.
- Ensure the Node.js and Rust toolchains are installed.
- For Tauri, ensure OS-specific prerequisites are installed.

### If PDF parsing fails

- The parser requires text-based PDFs.
- Scanned images are not supported.

### If state is not restored

- Check `lib/storage.ts` keys.
- Ensure `usePlannerState.ts` hydrates from localStorage correctly.

---

## Disclaimer

This app is for planning and educational use only. It is not an official CPA audit or certification tool. For final CPA guidance, consult the California Board of Accountancy or an academic advisor.
