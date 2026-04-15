# EL Lesson Alignment Tool PRD

## 1. Overview

**Product name:** EL Lesson Alignment Tool

**MVP focus:** Single-lesson academic language alignment for content teachers

**Primary audience:** Content-area classroom teachers, with instructional coaches as close secondary users

**Standards scope at launch:** California ELD standards, with optional teacher-provided content expectations

EL Lesson Alignment Tool helps a teacher paste one existing lesson and get that lesson back in the same recognizable format with practical academic language supports added. The product should not feel like a unit planner, curriculum designer, chatbot, or standards report.

The teacher-facing promise is:

> Paste my lesson. Choose grade and content area. Give me the same lesson back with useful academic language supports built in.

The MVP prioritizes teacher simplicity. The aligned lesson appears first. Brief notes and supporting cards appear after the lesson so teachers can understand why the additions help English learners, but those notes are secondary.

## 2. Problem Statement

Content-area teachers often have a lesson that already teaches the right content, but the language demands are implicit. English learners may be expected to explain, justify, compare, argue, discuss, read closely, or write with evidence without enough explicit language support.

Teachers need a fast way to answer:

- What are students expected to say, do, or write as evidence of learning?
- What academic vocabulary, language functions, and language features do students need?
- What sentence frames, discussion stems, or model language will help without lowering the content expectation?
- How can ELPAC level 1 and level 3 students access the same cognitive task as their English-speaking peers?
- How can success criteria combine content expectations and language expectations in student-friendly language?
- What feedback can the teacher give during the lesson to support language growth?

The pain is not that teachers need a new template. The pain is that they need their existing lesson made clearer, more accessible, and more rigorous for English learners without rebuilding it.

## 3. Goals and Non-Goals

### Goals

- Return the submitted lesson in the same format whenever possible.
- Add CA ELD-aligned academic language support directly into the lesson through light, targeted additions or revisions.
- Preserve original headings, section order, tables, bullets, numbering, and teacher wording wherever possible.
- Add a clear content-language objective when the lesson lacks one.
- Make visible what students must say, do, or write as evidence of learning.
- Add academic vocabulary, language functions, language features, frames, stems, and short original model language when useful.
- Provide ELPAC level 1 and level 3 supports that keep the same content expectation and cognitive demand.
- Provide student-friendly success criteria that combine content and language expectations.
- Provide specific teacher feedback moves for language growth.
- Keep CA ELD Part I, Part II, and PLD context together whenever ELD standards are named or summarized.
- Block likely student-identifiable data and prompt-injection attempts before retrieval or model generation.
- Attribute CDE/SBE standards sources without implying affiliation, sponsorship, approval, or endorsement.

### Non-Goals for MVP

- Align a full unit of study.
- Build lesson sequences across a unit.
- Produce a separate multi-section alignment report as the main output.
- Force the teacher's lesson into a new template.
- Rewrite the entire lesson by default.
- Provide an open-ended generic chatbot experience.
- Require teachers to select exact content standards.
- Automatically save uploads, lesson text, outputs, or chat history.
- Treat student-identifiable data as normal workflow input.
- Generate a downloadable revised file.
- Compare original versus revised files.
- Support dashboards, saved searches, alt text generation, or advanced workflow modes.

## 4. Users

### Primary User

**Content-area teachers** use the tool when they want to quickly strengthen one lesson for English learners without becoming ELD standards specialists.

### Secondary Users

- **Instructional coaches** use the output to support teacher planning conversations.
- **Language specialists and ESL teachers** use the output to confirm CA ELD alignment and recommend refinements.
- **Curriculum specialists and district leaders** may review the product direction, but they are not the main MVP user.

### Reviewer Role

Human review is required before outputs are used in instruction. The tool supports educator judgment; it does not approve, certify, or replace professional review.

## 5. MVP Workflow

The launch workflow should be one screen and one main action.

1. Teacher opens the app.
2. Teacher pastes a lesson or uploads a text-like lesson file.
3. Teacher chooses grade and content area.
4. ELPAC focus defaults to levels 1 and 3.
5. Teacher optionally adds a lesson goal, content expectations, or short note.
6. Teacher clicks **Align Lesson**.
7. App returns the lesson in the same format with academic language supports added.
8. Teacher reviews and copies the aligned lesson.
9. Any saving must be explicit if save functionality exists.

### Required Inputs

- `lessonText`: pasted lesson text or a text-like upload.
- `gradeLevel` or `gradeBand`: grade context for CA ELD retrieval.
- `contentArea`: content teacher context such as ELA, math, science, or history/social science.

### Optional Inputs

- `elpacLevels`: defaults to `[1, 3]`.
- `lessonGoal`: content goal or learning target.
- `contentExpectations`: teacher-provided content standard, curriculum expectation, or success criteria.
- `contentStandardIds`: optional IDs for future standards matching.
- `teacherNote`: short request such as "focus on discussion supports" or "keep this concise."

### Design Principle

Do not make teachers complete a standards workflow before receiving a useful result. If the tool can infer a reasonable language demand from the lesson, grade, and content area, it should keep the teacher moving.

## 6. Output Requirements

The primary output is **Aligned Lesson**.

The generated lesson must preserve the teacher's submitted structure. The app may label the output pane, but the actual generated material must not be converted into a generic report.

### Primary Output: Aligned Lesson

The app must preserve:

- Original headings and section names.
- Original order and flow.
- Original bullets and numbering where possible.
- Table-like structure when the submission is a table.
- Teacher wording unless a light revision is needed for academic language alignment.

The app may add:

- A content-language objective.
- Student evidence language: what students will say, do, or write.
- Academic vocabulary and language functions.
- Language features students need to practice, such as evidence phrases, comparison language, causal language, or precise mathematical language.
- Sentence frames, discussion stems, writing stems, and short original model language.
- ELPAC 1 and ELPAC 3 supports that keep the same content goal.
- Student-friendly success criteria.
- Teacher feedback prompts that support language growth.

The app must not:

- Convert a table into prose only.
- Replace the teacher's lesson with a new lesson.
- Add long standards explanations inside the lesson.
- Add generic supports that do not connect to the actual lesson task.
- Create a separate five-section report as the main result.
- Lower cognitive demand for students at earlier English proficiency levels.

### Secondary Output: Teacher Support Cards

After the aligned lesson, the app should include concise supporting sections:

- **Why this helps ELs:** content goal, language demand, and student evidence.
- **Student Evidence:** what students should say, do, or write.
- **Academic Language:** vocabulary, functions, features, frames, stems, and original model language.
- **ELPAC Supports:** level 1 and level 3 scaffolds that preserve cognitive demand.
- **Success Criteria:** student-friendly content plus language criteria.
- **Teacher Moves:** specific feedback or prompting language.
- **Brief Alignment Notes:** CA ELD standards or clusters used, including Part I, Part II, and PLD context together.

These sections support teacher trust and usability, but the aligned lesson remains the main deliverable.

### Format Fidelity

Exact formatting may not always be possible across paste, upload, and copy. When exact formatting cannot be preserved, the app should use the closest practical equivalent, such as Markdown headings, bullets, numbering, or tables.

## 7. Product Behavior Requirements

### Strict Preserve-and-Align Rule

The model must follow this non-negotiable rule:

> Preserve the teacher's submitted lesson format and wording wherever possible; add or lightly revise only what is needed to strengthen academic language access and CA ELD alignment.

The app should behave like a careful content-teacher planning partner, not a lesson generator.

### CA ELD Integrity Rule

Whenever the app names or summarizes CA ELD alignment, it must keep these together:

- Part I
- Part II
- PLD context

The product must not present CA ELD standards as isolated checklist items when doing so would separate language purpose, language resources, and proficiency expectations.

### Cognitive Demand Rule

ELPAC level 1 and level 3 supports must change access, not expectation. The output may add visuals, rehearsal, frames, vocabulary previews, sentence stems, partner talk, or teacher feedback, but it must keep the same content learning target.

### Teacher-Friendly Language

Output should use plain classroom language. Teachers should be able to copy and use the additions without reading standards theory.

The app should make visible:

- What students are doing with language.
- How language supports the lesson purpose.
- What language supports were added or clarified.
- How ELPAC 1 and 3 students can access the same content expectation.

### Standards Transparency Without Friction

The app may show brief standards rationale after the aligned lesson. It should not require teachers to review a matched standards preview before receiving a useful result in the MVP.

### Copy and Save

Copying the aligned lesson is the primary completion action.

Saving is optional and must be explicit. The app must not automatically save uploaded materials, generated output, or chat history by default.

## 8. API Contract

`POST /api/align` accepts:

- `lessonText`: required.
- `gradeLevel` or `gradeBand`: required.
- `contentArea`: required.
- `elpacLevels`: optional, default `[1, 3]`.
- `lessonGoal`: optional.
- `contentStandardIds`: optional.
- `contentExpectations`: optional.
- `teacherNote`: optional.

Successful responses include:

- `alignedText`: the teacher's lesson in the same format with light academic-language alignment added directly.
- `lessonLanguageFocus`: content goal, language demand, and student evidence summary.
- `studentEvidence`: what students should say, do, or write to show learning.
- `academicLanguageSupports`: vocabulary, functions, features, frames, stems, and original model language.
- `elpacSupports`: supports for ELPAC 1 and ELPAC 3 that keep the same content expectation.
- `studentFriendlySuccessCriteria`: copy-ready criteria combining content and language expectations.
- `teacherFeedbackMoves`: specific things teachers can do or say to support language growth.
- `briefAlignmentNotes`: short CA ELD rationale.
- `standardsUsed`: retrieved CA ELD records and optional content standards in future expansion.
- `qualityChecks`, `safetyChecks`, `changeNotes`, `traceId`, and `alignmentMode`.

Stable error codes:

- `PII_DETECTED`
- `PROMPT_INJECTION_DETECTED`
- `INPUT_TOO_LARGE`
- `UNSUPPORTED_FILE_TEXT`
- `MODEL_CONFIG_MISSING`
- `ALIGNMENT_FAILED`

## 9. Orchestrator Requirements

The orchestrator must:

1. Validate required inputs and size limits.
2. Run input safety scans before standards retrieval or LLM calls.
3. Analyze lesson structure so format can be preserved.
4. Infer language demand from lesson text, grade, content area, and optional goal.
5. Retrieve CA ELD Part I, Part II, and PLD together.
6. Build a delimited prompt where teacher text is treated as untrusted data.
7. Generate a same-format aligned lesson plus structured teacher supports.
8. Validate schema and reject invented standards or report-style outputs.
9. Run output safety checks before returning copy actions.
10. Trace safe LLM runs in Braintrust for internal evals.

The model should be prompted as a **content-teacher academic language alignment editor**, not a unit planner and not a lesson generator.

## 10. Privacy and Data Handling

Student-identifiable data must not be part of the normal workflow. The interface should guide users to paste or upload instructional lesson materials without student names, student IDs, rosters, scores, IEP/504 details, contact information, or other personally identifiable student information.

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

## 11. Source Attribution

The product uses CA ELD standards source material from the California Department of Education and California State Board of Education context. The teacher-facing app must show a visible free-beta source notice and must not imply CDE affiliation, sponsorship, approval, or endorsement.

Official standard text should be stored separately from app-created summaries. App-created explanations should not overwrite or alter official standard text.

## 12. Teacher-Facing MVP Features

The MVP should include:

- Single-screen lesson input.
- Paste or text-like upload input.
- Grade selection.
- Required content area.
- ELPAC 1 and 3 focus.
- Optional lesson goal, content expectations, and teacher note.
- **Align Lesson** action.
- Same-format aligned lesson output.
- Small "Why this helps ELs" panel.
- Student evidence, success criteria, ELPAC supports, academic language, and teacher feedback cards.
- Brief CA ELD alignment notes after the output.
- Copy output.
- Explicit save output if save functionality is included.
- About, Privacy, and Use Guidance.
- Mobile-friendly flow.

The MVP should not include teacher-facing design-tool references, internal prompt governance details, pricing, rollout notes, technical build notes, or standards spreadsheet administration screens.

## 13. Deferred Features

The following items are intentionally out of scope for MVP:

- Unit alignment or unit planning.
- Add Supports as a separate workflow.
- Required content-standards alignment workflow.
- Matched standards preview as a required step.
- Multi-section alignment report as the main output.
- Mentor text library or corpus workflow.
- Compare original versus revised.
- Download revised file.
- Saved searches.
- Reuse old output for a new lesson.
- Text-level customization controls.
- Alt text helper.
- Generic regenerate button.
- Full lesson rewrite by default.
- Open-ended generic chatbot.
- Automatic saving of uploads by default.
- Automatic saving of chat history by default.
- Metadata tracking dashboard in the teacher-facing UI.
- Advanced dashboards.

## 14. Acceptance Criteria

### Scenario 1: Pasted Lesson Keeps Same Headings

Given a teacher pastes a lesson with headings such as Objective, Materials, Warm-Up, Activity, and Exit Ticket, when they click **Align Lesson**, then the app returns the lesson with the same headings and sequence while adding targeted CA ELD-aligned academic language supports where needed.

### Scenario 2: Table Input Returns Table-Like Output

Given a teacher submits a lesson in a table format, when the app returns the aligned output, then the output preserves a table-like structure and does not convert the lesson into prose only.

### Scenario 3: Student Evidence Is Clear

Given a teacher submits a lesson, when the app aligns it, then the output identifies what students should say, do, or write as evidence of content learning.

### Scenario 4: Academic Language Supports Are Classroom-Usable

Given a teacher receives aligned output, when they review the support sections, then vocabulary, language functions, frames, stems, and original model language are specific enough to use in the lesson.

### Scenario 5: ELPAC Supports Preserve Cognitive Demand

Given the app provides ELPAC 1 and ELPAC 3 supports, when a teacher reviews them, then both levels support access to the same content expectation rather than simplifying the learning target.

### Scenario 6: Success Criteria Are Student-Friendly

Given a lesson has content and language expectations, when the app returns aligned output, then success criteria are written in student-friendly "I can" language that combines content learning and academic language use.

### Scenario 7: No Forced Template

Given a teacher submits a lesson in their own format, when the app produces aligned output, then the app does not force the lesson into a new planning template or a five-section analysis report.

### Scenario 8: No Whole-Lesson Rewrite by Default

Given a teacher submits an existing lesson, when the app aligns it, then the output preserves original wording wherever possible and only adds or lightly revises what is needed for CA ELD and academic language alignment.

### Scenario 9: ELD Context Stays Together

Given the alignment notes name CA ELD expectations, when the app presents those expectations, then Part I, Part II, and PLD context appear together so language purpose, language resources, and proficiency expectations are not separated.

### Scenario 10: Saving Is Explicit

Given a teacher uploads or pastes instructional material, when they complete an alignment, then the app does not save the upload, chat, or output unless the teacher explicitly chooses to save.

### Scenario 11: Student Data Is Blocked

Given a user pastes likely student-identifiable data, when they submit the lesson, then the app blocks alignment before retrieval or generation and does not echo the detected raw values back to the user.

## 15. Implementation Notes for Future Build

- Treat this PRD as the product source of truth until a later implementation spec exists.
- Design prompts and tests around same-format lesson output, not report generation.
- Keep internal governance materials separate from the teacher-facing app.
- Use structured CA ELD standards data rather than prompt-only standards references.
- Preserve output format through the full flow: input parsing, model prompt, rendering, copy action, and saved output.
- Prefer one clear action, **Align Lesson**, over multiple workflow modes.
- Add CA content standards retrieval later only if it does not complicate the teacher workflow.

## 16. Open Questions for Later Discovery

- What upload file types should be allowed beyond `.txt`, `.md`, and `.csv`?
- How should the app represent CA content standards if optional matching is added?
- What exact retention policy should be used for explicitly saved items?
- Who approves district-facing guidance before pilot launch?
