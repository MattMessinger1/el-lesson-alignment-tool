# Braintrust Tracing

## Purpose

The v0.4 LLM alignment step is traced in Braintrust so product, engineering, and SME reviewers can inspect the full alignment pipeline when a safe lesson passes the input gates.

## Environment

Required server-side environment variables:

- `BRAINTRUST_API_KEY`
- `BRAINTRUST_PROJECT_NAME=EL Lesson Alignment Tool`
- `BRAINTRUST_GATEWAY_BASE_URL=https://gateway.braintrust.dev/v1`
- `ELD_ALIGNMENT_MODEL=gpt-5-mini`
- `ELD_USE_LLM=true`

Do not commit local env files or API keys. `.env.local` is ignored by git.

## Span Structure

The production LLM path emits these spans:

- `align.request`
- `safety.input_scan`
- `lesson.structure_analysis`
- `lesson.context_inference`
- `standards.retrieve_eld_bundle`
- `llm.generate_aligned_lesson`
- `quality.check_alignment`
- `safety.output_scan`
- `align.response`

Input blocked for PII or prompt injection returns before the Braintrust trace is created.

## Logged Metadata

Trace metadata includes:

- grade span
- proficiency
- content area
- inferred communication mode
- inferred language function
- standard IDs used
- safety result
- quality result
- alignment mode

Scores include:

- `format_preserved`
- `no_full_rewrite`
- `eld_bundle_complete`
- `standards_allowlist`
- `output_dlp`
- `pii_blocked`

## Trace Content

For internal beta evals, successful LLM traces include the full prompt, retrieved standards bundle, model output, internal tool results, quality checks, and safety checks. This supports debugging and SME review, but it also means safe teacher-submitted lesson content is sent to Braintrust after input safety gates pass.

The app itself does not save uploads, pasted lesson text, generated output, or chat history by default. PII-like input is blocked before retrieval, model calls, or Braintrust trace creation.
