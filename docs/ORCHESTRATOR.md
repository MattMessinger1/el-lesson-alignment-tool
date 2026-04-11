# CA ELD Orchestrator

The v0.2 orchestrator turns the v0.1 placeholder route into a standards-grounded pipeline.

## Current Behavior

The app now uses a curated draft JSON standards source in `data/ca-eld/standards.json`. These records are structured for SME review and app retrieval. They should be treated as a draft seed until a CA ELD specialist marks records as reviewed.

## Pipeline

1. Analyze lesson structure so headings, tables, order, and insertion points can be preserved.
2. Infer grade span, proficiency range, content area, communication mode, language function, and language demand.
3. Retrieve a CA ELD bundle where Part I, Part II, and PLD records always travel together.
4. Add light inline CA ELD alignment to the teacher's original lesson format.
5. Return structured API output: aligned lesson, brief notes, standards used, and quality checks.

## LLM Contract

The implementation exports the system prompt and tool definitions in `lib/eld/llm-contract.ts`. The current route is deterministic so the product can run without external model credentials. When an LLM is added, it should be constrained by the same contract:

- Preserve the teacher's submitted format and wording.
- Add only what is needed for CA ELD alignment.
- Do not create a separate report as the main output.
- Never invent standards.
- Never cite Part I without paired Part II and PLD context.
- Return structured JSON matching the API response contract.

## API Response

`POST /api/align` returns:

- `alignedText`: same-format teacher-ready output.
- `briefAlignmentNotes`: concise trust notes.
- `standardsUsed`: IDs and summaries from retrieved records.
- `qualityChecks`: format, rewrite, ELD bundle, privacy, and report-format checks.
