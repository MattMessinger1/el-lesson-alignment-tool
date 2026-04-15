import assert from "node:assert/strict";
import test from "node:test";
import examples from "../data/evals/sme-examples.json";
import {
  alignLessonWithOrchestrator,
  analyzeLessonStructure,
  checkAlignmentQuality,
  inferLessonContext
} from "../lib/eld/orchestrator";
import { SME_RUBRIC } from "../lib/eld/sme-rubric";
import { flattenStandardsUsed, retrieveEldBundle } from "../lib/eld/standards";

test("retrieveEldBundle returns Part I, Part II, and PLD together", () => {
  const bundle = retrieveEldBundle({
    gradeSpan: "3-5",
    proficiency: "mixed",
    mode: "collaborative",
    languageFunction: "explain_with_evidence"
  });

  assert.equal(bundle.partI.length, 1);
  assert.equal(bundle.partII.length, 1);
  assert.equal(bundle.pld.length, 1);
});

test("orchestrator returns structured same-heading output", () => {
  const response = alignLessonWithOrchestrator({
    lessonText: `Objective
Students will identify the central idea.

Activity
Students read and discuss an article.

Exit Ticket
Students write one supporting detail.`,
    gradeBand: "3-5",
    proficiency: "mixed",
    lessonGoal: "central idea",
    contentArea: "ELA",
    teacherNote: ""
  });

  assert.ok(response.alignedText.startsWith("Objective"));
  assert.ok(response.alignedText.includes("Activity"));
  assert.ok(response.alignedText.includes("Exit Ticket"));
  assert.ok(response.alignedText.includes("Language Objective:"));
  assert.ok(response.briefAlignmentNotes.length >= 3);
  assert.equal(response.lessonLanguageFocus.contentGoal, "central idea");
  assert.ok(response.studentEvidence.some((item) => /discuss|write|explain/i.test(item)));
  assert.ok(response.academicLanguageSupports.sentenceFrames.length > 0);
  assert.ok(response.elpacSupports.some((support) => support.level === "1"));
  assert.ok(response.elpacSupports.some((support) => support.level === "3"));
  assert.ok(response.studentFriendlySuccessCriteria.length > 0);
  assert.ok(response.teacherFeedbackMoves.length > 0);
  assert.ok(response.standardsUsed.some((standard) => standard.part === "Part I"));
  assert.ok(response.standardsUsed.some((standard) => standard.part === "Part II"));
  assert.ok(response.standardsUsed.some((standard) => standard.part === "PLD"));
});

test("table-like lesson stays table-like", () => {
  const response = alignLessonWithOrchestrator({
    lessonText: `Time | Teacher | Students
5 min | Launch task | Discuss what they notice
15 min | Investigation | Record observations`,
    gradeBand: "6-8",
    proficiency: "expanding",
    lessonGoal: "observations from investigation",
    contentArea: "Science",
    teacherNote: ""
  });

  assert.ok(response.alignedText.includes("|"));
  assert.ok(response.alignedText.includes("Time | Teacher | Students"));
});

test("quality checks catch report format and student data", () => {
  const originalText = "Objective\nStudent ID 123456 will explain an idea.";
  const structure = analyzeLessonStructure(originalText);
  const context = inferLessonContext({
    lessonText: originalText,
    gradeBand: "3-5",
    proficiency: "mixed",
    contentArea: "ELA"
  });
  const standardsUsed = [
    {
      id: "PI",
      gradeSpan: context.gradeSpan,
      part: "Part I" as const,
      mode: "collaborative" as const,
      proficiencyLevel: "mixed" as const,
      languageFunction: "explain_with_evidence",
      teacherFriendlySummary: "",
      descriptor: "",
      standardText: "",
      sourceName: "",
      sourceUrl: ""
    }
  ];
  const checks = checkAlignmentQuality({
    originalText,
    alignedText:
      "What Is Already Aligned\nWhat Needs Work\nSuggested Additions\nThis is a report.",
    standardsUsed,
    structure
  });

  assert.equal(checks.find((check) => check.id === "no_student_data_detected")?.passed, false);
  assert.equal(checks.find((check) => check.id === "no_five_section_report")?.passed, false);
  assert.equal(checks.find((check) => check.id === "eld_bundle_complete")?.passed, false);
});

test("quality checks allow useful short-lesson additions without treating them as a rewrite", () => {
  const originalText = `Objective
Students will identify the central idea.

Activity
Students discuss details with a partner.

Exit Ticket
Students write one supporting detail.`;
  const structure = analyzeLessonStructure(originalText);
  const bundle = retrieveEldBundle({
    gradeSpan: "6-8",
    proficiency: "mixed",
    mode: "collaborative",
    languageFunction: "explain_with_evidence"
  });
  const alignedText = `${originalText}

Language Objective
Students explain the central idea with evidence and build on a partner's idea.

Student Language Supports
- The central idea is ___ because ___.
- The detail ___ supports it because ___.

ELPAC 1 Support
Students use a visual, word bank, and partner rehearsal before sharing the same content idea.

ELPAC 3 Support
Students extend their explanation with because, for example, and this shows.

Teacher Feedback Move
Ask: What evidence in the text makes you think that?`;

  const checks = checkAlignmentQuality({
    originalText,
    alignedText,
    standardsUsed: flattenStandardsUsed(bundle),
    structure
  });

  assert.equal(checks.find((check) => check.id === "no_full_rewrite")?.passed, true);
});

test("quality checks still reject oversized outputs that do not preserve the lesson", () => {
  const originalText = `Objective
Students will identify the central idea.

Activity
Students discuss details with a partner.`;
  const structure = analyzeLessonStructure(originalText);
  const bundle = retrieveEldBundle({
    gradeSpan: "6-8",
    proficiency: "mixed",
    mode: "collaborative",
    languageFunction: "explain_with_evidence"
  });
  const alignedText = `New Lesson Plan
${"Students complete a redesigned activity with many unrelated steps. ".repeat(90)}`;

  const checks = checkAlignmentQuality({
    originalText,
    alignedText,
    standardsUsed: flattenStandardsUsed(bundle),
    structure
  });

  assert.equal(checks.find((check) => check.id === "no_full_rewrite")?.passed, false);
});

test("SME rubric and eval set cover required review dimensions", () => {
  const categories = SME_RUBRIC.map((category) => category.id);

  assert.deepEqual(categories, [
    "standards_accuracy",
    "eld_integrity",
    "language_demand_quality",
    "teacher_usability",
    "format_preservation",
    "intervention_quality",
    "access_without_lowered_demand",
    "student_facing_clarity",
    "feedback_usefulness",
    "safety_privacy"
  ]);
  assert.ok(examples.length >= 12);
  assert.ok(examples.some((example) => example.format === "table"));
  assert.ok(examples.some((example) => example.gradeBand === "9-12"));
});
