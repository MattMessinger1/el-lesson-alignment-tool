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
import { retrieveEldBundle } from "../lib/eld/standards";

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

test("SME rubric and eval set cover required review dimensions", () => {
  const categories = SME_RUBRIC.map((category) => category.id);

  assert.deepEqual(categories, [
    "standards_accuracy",
    "eld_integrity",
    "language_demand_quality",
    "teacher_usability",
    "format_preservation",
    "intervention_quality",
    "safety_privacy"
  ]);
  assert.ok(examples.length >= 12);
  assert.ok(examples.some((example) => example.format === "table"));
  assert.ok(examples.some((example) => example.gradeBand === "9-12"));
});
