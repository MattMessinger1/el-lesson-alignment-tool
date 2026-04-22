# Safety and Privacy Guardrails

## Input Blocking

The beta blocks likely student-identifiable data before standards retrieval or alignment. If input is blocked, the app returns a stable error code and a teacher-safe message. It does not echo detected values.

Blocked categories include:

- Student IDs, SSIDs, local IDs, and state IDs.
- Dates of birth and social security numbers.
- Student names paired with IEP, 504, ELPAC, score, gradebook, reading level, discipline, behavior, health, or accommodation details.
- Rosters, gradebook tables, student lists, parent or guardian contact details, addresses, emails, and phone numbers.

The product blocks rather than redacts for v0.5. The teacher must remove private student details and retry.

## Browser-Only File Parsing

The beta supports `.txt`, `.md`, `.csv`, `.docx`, and selectable-text `.pdf` lesson uploads. Files are parsed in the browser so raw uploaded files do not go to Vercel. The app places extracted text into the lesson input, and the existing PII and prompt-injection checks run before standards retrieval, OpenAI calls, or Braintrust tracing.

Scanned PDFs, image-only PDFs, OCR, encrypted PDFs, oversized files, unreadable files, and legacy `.doc` files are intentionally not supported in the beta. These failures should return teacher-safe messages and should not call `/api/align`.

## Prompt-Injection Blocking

Lesson text, uploads, teacher notes, and standards summaries are treated as untrusted data. The app blocks high-confidence prompt-injection patterns before alignment, including:

- Requests to ignore or override system/developer instructions.
- Requests to reveal prompts, internal policy, hidden instructions, or secrets.
- Attempts to call tools, browse, write files, use APIs, or access external systems.
- Hidden HTML/script payloads and encoded instruction payloads.

## Agentic Risk Boundary

The launch beta is generation-only. The model must not browse, send email, save files, write to a database, or call arbitrary tools. The server retrieves standards before generation and passes only an allowlisted standards bundle.

## Output Checks

Successful responses include `safetyChecks` for:

- PII input.
- Prompt-injection input.
- Structured output.
- Standards allowlist.
- Format preservation.
- No full rewrite.
- Output data-loss prevention.

If output checks fail, the API fails safely with `ALIGNMENT_FAILED`.

## Retention and Tracing

The app does not persist uploaded files, pasted lesson text, generated output, or chat history by default. Application logs should not include full lesson bodies or model responses.

For internal beta evals, the LLM path sends safe, post-gate alignment requests to OpenAI and records full Braintrust traces for review. Input blocked for PII or prompt injection returns before standards retrieval, model calls, or Braintrust trace creation. Teachers should still avoid pasting student-identifiable data because the correct v0.5 behavior is to block and discard, not redact.

## Visual Packet Safety

When image generation is enabled, the app sends a compact visual packet spec to OpenAI after the alignment response has passed safety, schema, standards allowlist, and quality checks. The spec should include only teacher-facing alignment summaries, standards rationale, ELPAC supports, frames, success criteria, feedback moves, and run metadata. It should not include raw uploaded files or unnecessary full lesson text.

Generated packet prompts must not request CDE logos, seals, school branding, signatures, endorsements, or invented standards. If image generation fails, the checked aligned lesson remains available and the visual packet error is non-blocking.
