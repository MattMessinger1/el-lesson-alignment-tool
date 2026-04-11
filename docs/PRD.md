# EL Lesson Alignment Tool PRD

## 1. Overview

**Product name:** EL Lesson Alignment Tool

**MVP focus:** Same-format CA ELD alignment

**Primary audience:** Classroom teachers, with instructional coaches as close secondary users

**Standards scope at launch:** California ELD standards

EL Lesson Alignment Tool helps teachers take a lesson, unit, or task they already have and align it to California ELD standards with as little friction as possible. The product should not feel like a standards report, planning template, or generic AI chatbot. It should feel like a simple alignment helper:

> Put in my lesson. Give me my lesson back, in the same format, with CA ELD alignment added.

The MVP should prioritize teacher simplicity over standards-review complexity. The main output is the teacher's submitted material, preserved in its original structure and lightly revised or annotated so it better reflects CA ELD expectations. Brief alignment notes may appear after the aligned material, but they are secondary.

Selected content standards can be optional context or a later expansion. They should not drive the first teacher workflow unless the product direction changes.

## 2. Problem Statement

Teachers often have usable lessons and units, but aligning them to CA ELD expectations requires specialized interpretation. They must understand what students are doing with language, which language resources are needed, how expectations shift by proficiency level, and how CA ELD Part I, Part II, and proficiency level descriptors work together.

The current pain is not that teachers need a new report. The pain is that teachers need their existing plan made clearer, stronger, and more aligned without being forced to rebuild it.

Many tools create extra work by returning a separate analysis:

> Here is what is aligned. Here are the gaps. Here are suggested revisions.

For this product, the teacher-friendly pattern should be:

> Here is your lesson back, in your format, with CA ELD alignment built in.

The tool succeeds when a teacher can copy the aligned output and immediately recognize it as their own lesson, just strengthened for English learner language development.

## 3. Goals and Non-Goals

### Goals

- Return the submitted lesson, unit, or task in the same format whenever possible.
- Add CA ELD alignment directly into the material through light, targeted additions or revisions.
- Preserve original headings, section order, tables, bullets, numbering, and teacher wording wherever possible.
- Make CA ELD language expectations visible in teacher-friendly language.
- Keep CA ELD Part I, Part II, and PLD context together whenever ELD standards are named or summarized.
- Keep the workflow minimal enough for teachers to complete quickly.
- Provide brief alignment notes after the aligned material so teachers and coaches can see what was addressed.
- Require explicit user action to save outputs.
- Block likely student-identifiable data and prompt-injection attempts before alignment.
- Attribute CDE/SBE standards sources without implying affiliation, sponsorship, approval, or endorsement.

### Non-Goals for MVP

- Produce a separate multi-section alignment report as the main output.
- Force the teacher's material into a new template.
- Rewrite an entire lesson, unit, or task by default.
- Provide an open-ended generic chatbot experience.
- Make selected content standards required.
- Automatically save uploads or chat history.
- Treat student-identifiable data as normal workflow input.
- Generate a revised downloadable file.
- Compare original versus revised files.
- Support dashboards, saved searches, mentor text suggestions, alt text generation, or other advanced workflows.

## 4. Users

### Primary User

**Teachers** use the tool when they want to quickly strengthen an existing lesson, unit, or task for English learners without learning a complicated standards workflow.

### Secondary Users

- **Instructional coaches** use the output to support teacher planning conversations.
- **Language specialists and ESL teachers** use the output to confirm CA ELD alignment and recommend refinements.
- **Curriculum specialists and district leaders** may use the product direction to understand what the tool does, but they are not the main MVP user.

### Reviewer Role

Human review is required before outputs are used in instruction. The tool supports educator judgment; it does not approve, certify, or replace professional review.

## 5. MVP Workflow

The launch workflow should be as simple as possible.

1. Teacher opens the app.
2. Teacher pastes text or uploads a lesson, unit, or task.
3. Teacher chooses grade band.
4. Teacher chooses ELD proficiency range if known.
5. Teacher optionally adds a lesson goal, content area, or short note.
6. Teacher clicks **Align to CA ELD**.
7. App returns the aligned material in the same format as submitted.
8. Teacher reviews and copies the aligned output.
9. Teacher may explicitly save the output if save functionality exists.

### Required Inputs

- Lesson, unit, or task text, provided by paste or upload.
- Grade band.

### Optional Inputs

- ELD proficiency range, such as Emerging, Expanding, Bridging, or a combination.
- Lesson goal, unit goal, or task objective.
- Content area.
- Short teacher note, such as "focus on discussion supports" or "keep this concise."

### Design Principle

Do not make teachers choose more fields than necessary. If the app can make a reasonable alignment suggestion from the submitted content and grade band, it should do so and keep the teacher moving.

## 6. Output Requirements

The primary output is **Aligned Lesson/Unit/Task**.

The content inside that output should preserve the teacher's submitted structure. The app may label the output pane, but the actual generated material should not be converted into a generic report.

### Primary Output: Aligned Lesson/Unit/Task

The app must preserve:

- Original headings and section names.
- Original order and flow.
- Original bullets and numbering where possible.
- Table-like structure when the submission is a table.
- Teacher wording unless a light revision is needed for CA ELD alignment.

The app may add:

- A language objective or language goal in the most natural location.
- Student language-use expectations.
- Collaborative, interpretive, or productive language moves.
- Sentence frames, discussion prompts, or language supports when needed.
- Short notes that clarify how students will use language to meet the lesson purpose.
- Proficiency-aware supports when the submitted context makes them useful.

The app must not:

- Convert a table into prose only.
- Replace the teacher's lesson with a new lesson.
- Add long standards explanations inside the lesson.
- Add generic supports that do not connect to the actual task.
- Create a separate five-section report as the main result.

### Secondary Output: Brief Alignment Notes

After the aligned material, the app should include a short **Brief Alignment Notes** section.

This section should be concise and should include:

- CA ELD standards or standard clusters addressed.
- The main language demand of the lesson or task.
- A plain-language note about how the output was strengthened.

Brief Alignment Notes should support trust and review, but they should never become the main teacher deliverable.

### Format Fidelity

Exact formatting may not always be possible across paste, upload, and copy. When exact formatting cannot be preserved, the app should use the closest practical equivalent, such as Markdown headings, bullets, numbering, or tables.

## 7. Product Behavior Requirements

### Strict Preserve-and-Align Rule

The model must follow this non-negotiable behavior rule:

> Preserve the teacher's submitted format and wording wherever possible; add or lightly revise only what is needed to align the material to CA ELD standards.

The app should behave like a careful planning partner, not a lesson generator. It should add alignment into the teacher's existing material rather than moving the teacher into a new structure.

### CA ELD Integrity Rule

Whenever the app names or summarizes CA ELD alignment, it must keep these together:

- Part I
- Part II
- PLD context

The product must not present CA ELD standards as isolated checklist items when doing so would separate language purpose, language resources, and proficiency expectations.

### Teacher-Friendly Language

Output should use plain classroom language. Teachers should be able to understand what was added without needing deep standards expertise.

The app should make visible:

- What students are doing with language.
- How language supports the lesson purpose.
- What language supports were added or clarified.
- How proficiency expectations are being considered when relevant.

### Standards Transparency Without Friction

The app may show brief standards rationale after the aligned output. It should not require teachers to review a matched standards preview before receiving a useful result in the MVP.

### Copy and Save

Copying the aligned output is the primary completion action.

Saving is optional and must be explicit. The app must not automatically save uploaded materials, generated output, or chat history by default.

## 8. Privacy and Data Handling

Student-identifiable data must not be part of the normal workflow. The interface should guide users to paste or upload instructional materials without student names, student IDs, or other personally identifiable student information.

Default retention behavior:

- Do not automatically save uploads.
- Do not automatically save chat history.
- Do not automatically save outputs.
- Save only when the user explicitly chooses to save.
- Block likely PII before retrieval or generation.
- Do not echo detected PII values back to the user.
- Treat teacher-provided lesson text and notes as untrusted data, not system instructions.
- Block high-confidence prompt-injection attempts before alignment.

The product should include plain-language About, Privacy, and Use Guidance content.

## 8.1 Source Attribution

The product uses CA ELD standards source material from the California Department of Education and California State Board of Education context. The teacher-facing app must show a visible free-beta source notice and must not imply CDE affiliation, sponsorship, approval, or endorsement.

Official standard text should be stored separately from app-created summaries. App-created explanations should not overwrite or alter official standard text.

## 9. Teacher-Facing MVP Features

The MVP should include:

- Simple home or start screen.
- Paste or upload input.
- Grade band selection.
- Optional ELD proficiency range.
- Optional lesson goal or content area.
- **Align to CA ELD** action.
- Same-format aligned output.
- Brief Alignment Notes after the output.
- Copy output.
- Explicit save output if save functionality is included.
- About, Privacy, and Use Guidance.
- Mobile-friendly flow.

The MVP should not include teacher-facing design-tool references, internal prompt governance details, pricing, rollout notes, technical build notes, or standards spreadsheet administration screens.

## 10. Deferred Features

The following items are intentionally out of scope for MVP:

- Improve a Unit workflow.
- Add Supports as a separate workflow.
- Required content-standards alignment workflow.
- Matched standards preview as a required step.
- Multi-section alignment report as the main output.
- Examples by proficiency level as a separate library.
- Compare original versus revised.
- Download revised file.
- Saved searches.
- Reuse old output for a new unit.
- Mentor text suggestions.
- Text-level customization controls.
- Alt text helper.
- Google Images prompt support.
- Metadata tracking dashboard in the teacher-facing UI.
- Advanced dashboards.
- Generic regenerate button.
- Full rewritten unit by default.
- Open-ended generic chatbot.
- Automatic saving of uploads by default.
- Automatic saving of chat history by default.

## 11. Acceptance Criteria

### Scenario 1: Pasted Lesson Keeps Same Headings

Given a teacher pastes a lesson with headings such as Objective, Materials, Warm-Up, Activity, and Exit Ticket, when they click **Align to CA ELD**, then the app returns the lesson with the same headings and sequence while adding targeted CA ELD-aligned language supports where needed.

### Scenario 2: Table Input Returns Table-Like Output

Given a teacher submits a lesson in a table format, when the app returns the aligned output, then the output preserves a table-like structure and does not convert the lesson into prose only.

### Scenario 3: CA ELD Alignment Is Built Into the Lesson

Given a teacher submits an existing task, when the app aligns it, then the output adds or lightly revises language objectives, language demands, prompts, or supports directly in the task rather than only describing suggested changes.

### Scenario 4: Alignment Notes Are Brief and Secondary

Given an aligned output is complete, when the teacher reviews the result, then the aligned lesson appears first and any CA ELD alignment notes appear afterward in a short supporting section.

### Scenario 5: No Forced Template

Given a teacher submits a lesson in their own format, when the app produces aligned output, then the app does not force the lesson into a new planning template or a five-section analysis report.

### Scenario 6: No Whole-Lesson Rewrite by Default

Given a teacher submits an existing unit or lesson, when the app aligns it, then the output preserves original wording wherever possible and only adds or lightly revises what is needed for CA ELD alignment.

### Scenario 7: ELD Context Stays Together

Given the alignment notes name CA ELD expectations, when the app presents those expectations, then Part I, Part II, and PLD context appear together so language purpose, language resources, and proficiency expectations are not separated.

### Scenario 8: Saving Is Explicit

Given a teacher uploads or pastes instructional material, when they complete an alignment, then the app does not save the upload, chat, or output unless the teacher explicitly chooses to save.

### Scenario 9: Student Data Is Discouraged

Given a user is preparing to paste or upload content, when they see input guidance, then the app reminds them not to include student-identifiable data as normal input.

## 12. Implementation Notes for Future Build

- Treat this PRD as the product source of truth until a later implementation spec exists.
- Design prompts and tests around same-format output, not separate report generation.
- Keep internal governance materials separate from the teacher-facing app.
- Use structured CA ELD standards data rather than prompt-only standards references.
- Preserve output format through the full flow: input parsing, model prompt, rendering, copy action, and saved output.
- Prefer one clear action, **Align to CA ELD**, over multiple workflow modes.

## 13. Open Questions for Later Discovery

- Which CA ELD grade spans and proficiency ranges should ship first?
- What upload file types should be allowed beyond pasted text?
- How should the app represent CA ELD standards inside Brief Alignment Notes?
- What exact retention policy should be used for explicitly saved items?
- Who approves district-facing guidance before pilot launch?
