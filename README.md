# EL Lesson Alignment Tool

This repository contains the product foundation for **EL Lesson Alignment Tool**, a simple teacher-facing tool for aligning existing content-area lessons to California ELD standards and academic language expectations.

The product should feel straightforward for teachers:

1. Paste one lesson.
2. Choose grade, content area, and EL level focus.
3. Get the same lesson back with useful academic language supports built in.

The current milestone is a v0.5 free beta: a Next.js frontend, a safety-gated backend, curated CA ELD records, and an LLM alignment step routed through Braintrust Gateway.

## Current Scope

- Make single-lesson CA ELD and academic language alignment the primary v1 focus.
- Preserve the teacher's submitted format, including headings, order, bullets, numbering, and table-like structure.
- Add only the targeted language objectives, student evidence, supports, prompts, success criteria, and teacher feedback moves needed for content-area EL access.
- Default to ELPAC levels 1 and 3 while preserving the same cognitive demand.
- Keep brief CA ELD alignment notes after the aligned lesson, not as the main output.
- Keep the workflow simple enough for classroom teachers to use quickly.
- Block likely student-identifiable data and prompt-injection attempts before alignment.
- Avoid automatic retention of uploads, lesson text, outputs, or chat history.
- Attribute CDE/SBE standards sources without implying CDE affiliation, sponsorship, or endorsement.
- Trace the LLM alignment pipeline in Braintrust for internal evals after input safety checks pass.

## Documents

- [Product Requirements Document](docs/PRD.md)
- [CA ELD Orchestrator](docs/ORCHESTRATOR.md)
- [Braintrust Tracing](docs/BRAINTRUST_TRACING.md)
- [SME Evaluation Guide](docs/SME_EVAL.md)
- [Safety and Privacy Guardrails](docs/SAFETY_PRIVACY.md)
- [Source Attribution and Rights](docs/SOURCE_RIGHTS.md)
- [Draft CDE Permission Request](docs/CDE_PERMISSION_REQUEST.md)

## App Commands

```bash
npm install
npm run dev
npm test
npm run build
npm run import:cde-eld
```

Copy `.env.example` to `.env.local` for local LLM testing and provide a real `BRAINTRUST_API_KEY`. Do not commit `.env.local`.

The v0.5 app includes a teacher-facing Next.js frontend and a backend `/api/align` route that returns same-format CA ELD-aligned lesson output with student evidence, academic language supports, ELPAC 1/3 supports, student-friendly success criteria, teacher feedback moves, brief notes, standards used, change notes, quality checks, safety checks, `alignmentMode`, and a Braintrust `traceId` when tracing is active.

## Source Inputs

The PRD was drafted from the planning documents in `/Users/mattmessinger/Downloads/`:

- `More Items to Discuss with Matt and Ivonne.docx`
- `Planning and Alignment Studio_First-Journey-Map.docx`
- `TEACHER-FACING APP FEATURES.pdf`

## Repo Status

This repo now contains the v0.5 application scaffold plus the product documentation. The current backend uses official CDE Part I/Part II source records, PLD summaries, launch guardrails, and an LLM lesson-alignment path when `ELD_USE_LLM=true`. The deterministic orchestrator remains available for tests and local emergency mode, but production should run through the Braintrust-routed LLM path.
