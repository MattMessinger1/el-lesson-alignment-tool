# EL Lesson Alignment Tool PRD

## 1. Overview

**Product name:** EL Lesson Alignment Tool

**MVP focus:** Align a Unit

**Primary audience:** Teachers and instructional coaches

**Standards scope at launch:** California ELD plus selected California content standards

EL Lesson Alignment Tool is a guided AI-supported workspace that helps educators review existing units, lessons, or tasks for alignment with California ELD expectations and selected content standards. The product is not a generic lesson generator. Its job is to preserve what teachers already have, make the language and standards demands visible, and suggest targeted additions or light revisions that can be copied back into the original planning materials.

The first version focuses only on the **Align a Unit** workflow. Later workflows such as Improve a Unit and Add Supports may build on this foundation, but they are not part of the launch MVP.

## 2. Problem Statement

California teachers are expected to interpret several dimensions of instruction at the same time:

- Content expectations and standards.
- Communicative purpose, such as explain, argue, describe, recount, or justify.
- Mode of communication, including collaborative, interpretive, and productive language.
- Language resources, including cohesion, clause structure, vocabulary, text organization, and discourse moves.
- English learner proficiency expectations from Emerging through Bridging.
- The relationship among CA ELD Part I, CA ELD Part II, and proficiency level descriptors.

This work often happens during planning, under time pressure, and across multiple documents. Teachers and coaches must search, compare, interpret, and combine standards language with lesson materials. The bottleneck is not simply finding standards; it is translating **content plus instructional purpose** into clear language demands and usable instruction.

Most tools follow a pattern like:

> Content -> Activity -> Add scaffolds

This product should follow:

> Content + Purpose -> Language Demand -> Instruction

If the tool does not clearly show what students are doing with language, how language works in the task, and how expectations change across proficiency levels, it is not aligned to the intended California ELD model.

## 3. Goals and Non-Goals

### Goals

- Help teachers and instructional coaches review a unit, lesson, or task against CA ELD and selected content standards.
- Preserve the user's original structure and wording whenever possible.
- Identify what is already aligned, what needs work, and what targeted additions could strengthen the material.
- Present ELD expectations in teacher-friendly language without separating Part I, Part II, and PLD context.
- Provide copy-ready revision text that can be inserted into the user's existing plan.
- Allow users to ask clarifying questions before moving on.
- Require explicit user action to save outputs.

### Non-Goals for MVP

- Rewrite an entire unit by default.
- Provide an open-ended generic chatbot experience.
- Automatically save uploads or chat history.
- Treat student-identifiable data as normal workflow input.
- Generate a revised downloadable file.
- Compare original versus revised files.
- Support saved searches, dashboards, mentor text suggestions, alt text generation, or Google Images prompt support.
- Ship the full Improve a Unit or Add Supports workflows.

## 4. Users

### Primary Users

**Teachers** use the tool to understand how well an existing unit, lesson, or task supports English learners and aligns with relevant standards.

**Instructional coaches** use the tool to support teacher planning conversations, identify alignment strengths and gaps, and produce practical revision language.

### Secondary Users

- Language specialists and ESL teachers who support ELD interpretation.
- Curriculum specialists who review instructional materials.
- District leaders who sponsor alignment practices and need a clear explanation of the tool's role.

### Reviewer Role

Human review is required before outputs are used in instruction. The tool should support educator judgment; it should not approve, certify, or replace professional review.

## 5. MVP Workflow

The launch workflow is **Align a Unit**.

1. User opens the app.
2. User chooses **Align a Unit**.
3. User pastes text or uploads a unit, lesson, or task.
4. User chooses grade band.
5. User chooses content area.
6. User chooses standards set.
7. User may ask for clarification before continuing.
8. App shows captured input for review.
9. App previews matched standards.
10. User runs the alignment analysis.
11. App shows structured results.
12. User copies or explicitly saves useful output.

### Required Inputs

- Unit, lesson, or task text, provided by paste or upload.
- Grade band.
- Content area.
- Standards set.

### Optional Inputs

- Clarification or customization prompt.
- Planning context, such as unit goal, target task, or focus language goal.

### Required Output Sections

Every alignment result must use these sections:

1. **Summary**
2. **What Is Already Aligned**
3. **What Needs Work**
4. **Suggested Additions**
5. **Revision Text**

These sections should remain stable unless usability testing proves a change is necessary.

## 6. Product Behavior Requirements

### Preserve and Augment Rule

The model must follow this non-negotiable behavior rule:

> Preserve the user's original structure and wording whenever possible; add, clarify, or revise only where needed.

The app should not default to broad rewriting. Revisions should be targeted, explainable, and easy for a teacher to insert back into existing planning materials.

### CA ELD Integrity Rule

Whenever the app presents CA ELD alignment, it must keep these together:

- Part I
- Part II
- PLD context

The product must not present ELD standards as isolated checklist items when doing so would separate language purpose, language resources, and proficiency expectations.

### Standards Matching

The app should preview matched standards before running the final analysis. The preview helps users confirm that the app is analyzing the right instructional context.

For MVP, the standards source layer should support CA ELD plus selected content standards. Broader standards sets, including ELA, Math, Science, Social Studies, CTE, and PE, may be planned as future expansion.

### Teacher-Friendly Output

Outputs should be written for classroom educators, not standards specialists only. They should explain:

- What students are being asked to do with language.
- How language functions in the task.
- Which expectations are already visible.
- Where the lesson or unit needs more explicit language support.
- What targeted language or revision could be added.

### Clarification Support

The app may include a help or clarification panel inside the workflow. This is not a generic chatbot. It should help users understand matched standards, output sections, and possible next steps without taking over the task.

### Save and Copy

Users must be able to copy useful output. Users may save output only through an explicit action.

The app must not automatically save uploaded materials or chat history by default.

## 7. Privacy and Data Handling

Student-identifiable data must not be part of the normal workflow. The interface should guide users to paste or upload instructional materials without student names, student IDs, or other personally identifiable student information.

Default retention behavior:

- Do not automatically save uploads.
- Do not automatically save chat history.
- Do not automatically save outputs.
- Save only when the user explicitly chooses to save.

The product should include an About, Privacy, and Use Guidance area explaining these expectations in plain language.

## 8. Teacher-Facing MVP Features

The MVP should include:

- Home.
- Align a Unit workflow.
- Upload or paste input.
- Grade band selection.
- Content area selection.
- Standards set selection.
- Captured input review.
- Matched standards preview.
- Structured alignment analysis.
- Copy-ready revision notes.
- Copy output.
- Explicit save output.
- Help or clarification panel.
- Saved Items area for explicitly saved outputs.
- About, Privacy, and Use Guidance.
- Mobile-first step flow.

The MVP should not include teacher-facing design-tool references, internal prompt governance details, pricing, rollout notes, technical build notes, or standards spreadsheet administration screens.

## 9. Deferred Features

The following items are intentionally out of scope for MVP:

- Improve a Unit workflow.
- Add Supports as a full workflow.
- Examples by proficiency level.
- Compare original versus revised.
- Download revised file.
- Saved searches.
- Reuse old output for a new unit.
- Mentor text suggestions.
- Text-level customization.
- Alt text helper.
- Google Images prompt support.
- Metadata tracking dashboard in the teacher-facing UI.
- Advanced dashboards.
- Generic regenerate button.
- Full rewritten unit by default.
- Open-ended generic chatbot.
- Automatic saving of uploads by default.
- Automatic saving of chat history by default.

## 10. Acceptance Criteria

### Scenario 1: Teacher Runs Alignment Review

Given a teacher pastes a unit into the Align a Unit workflow, chooses grade band, content area, and standards set, when they run analysis, then the app returns the five required output sections: Summary, What Is Already Aligned, What Needs Work, Suggested Additions, and Revision Text.

### Scenario 2: ELD Context Stays Together

Given an alignment result includes CA ELD expectations, when the app presents those expectations, then Part I, Part II, and PLD context appear together so language purpose, language resources, and proficiency expectations are not separated.

### Scenario 3: Output Preserves Original Material

Given a teacher submits an existing unit, when the app suggests revisions, then the output identifies targeted additions or light edits and does not rewrite the entire unit by default.

### Scenario 4: User Can Copy Revision Text

Given an alignment result is complete, when the teacher reviews the Revision Text section, then the teacher can copy that text for use in their own planning document.

### Scenario 5: Saving Is Explicit

Given a teacher uploads or pastes instructional material, when they complete an alignment review, then the app does not save the upload, chat, or output unless the teacher explicitly chooses to save.

### Scenario 6: Student Data Is Discouraged

Given a user is preparing to paste or upload content, when they see input guidance, then the app reminds them not to include student-identifiable data as normal input.

## 11. Implementation Notes for Future Build

- Treat this PRD as the product source of truth until a later implementation spec exists.
- Keep internal governance materials separate from the teacher-facing app.
- Design the source layer so standards files can be edited outside the app and exported into app-readable formats.
- Use structured standards data rather than prompt-only standards references.
- Keep output section names stable in prompts, UI, tests, and documentation.
- Prefer workflow-specific actions over generic AI controls.

## 12. Open Questions for Later Discovery

- Which selected content standards should ship first alongside CA ELD?
- Which grade bands should be supported in the first pilot?
- What upload file types should be allowed beyond pasted text?
- What exact retention policy should be used for explicitly saved items?
- Who approves district-facing guidance before pilot launch?
