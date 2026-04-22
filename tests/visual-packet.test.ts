import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVisualPacketPrompts,
  buildVisualPacketSpec,
  DEFAULT_IMAGE_MODEL,
  generateVisualPacket,
  VISUAL_PACKET_PROMPT_VERSION
} from "../lib/eld/visual-packet";
import type { AlignmentResponse, StandardUsed } from "../lib/eld/types";

function standard(part: StandardUsed["part"], id: string): StandardUsed {
  return {
    id,
    gradeSpan: "3-5",
    part,
    mode: part === "PLD" ? "proficiency" : part === "Part II" ? "language_resources" : "collaborative",
    proficiencyLevel: "expanding",
    languageFunction: "explain_with_evidence",
    teacherFriendlySummary: `${part} summary for explaining ideas with evidence.`,
    descriptor: `${part} descriptor`,
    standardText: `${part} official standard text`,
    sourceName: "California English Language Development Standards",
    sourceUrl: "https://www.cde.ca.gov/",
    copyrightOwner: "California Department of Education"
  };
}

function alignment(overrides: Partial<AlignmentResponse> = {}): AlignmentResponse {
  return {
    alignedText: `Objective
Students explain a central idea with evidence.

Activity
Students discuss details with a partner.`,
    lessonLanguageFocus: {
      contentGoal: "central idea",
      languageDemand: "explain ideas with evidence and build on a partner response",
      studentEvidence: "Students discuss and write evidence-based explanations."
    },
    studentEvidence: [
      "Students say an evidence-based idea to a partner.",
      "Students write one sentence explaining how evidence supports the central idea."
    ],
    academicLanguageSupports: {
      vocabulary: ["central idea", "evidence", "support"],
      languageFunctions: ["explain with evidence"],
      languageFeatures: ["because statements", "evidence phrases"],
      sentenceFrames: ["The central idea is ___ because ___."],
      discussionOrWritingStems: ["The text says ___, which shows ___."],
      originalModelLanguage: ["The central idea is that communities solve problems because the text says ___."]
    },
    elpacSupports: [
      {
        level: "1",
        proficiencyBand: "Emerging",
        supports: ["Use visuals.", "Rehearse with a partner."],
        cognitiveDemandNote: "ELPAC 1 students still explain the central idea with evidence."
      },
      {
        level: "3",
        proficiencyBand: "Expanding",
        supports: ["Add because and evidence phrases.", "Compare two details."],
        cognitiveDemandNote: "ELPAC 3 students still explain the central idea with more precise language."
      }
    ],
    studentFriendlySuccessCriteria: [
      "I can explain the central idea.",
      "I can use evidence to support my thinking."
    ],
    teacherFeedbackMoves: [
      "Ask: What evidence makes you think that?",
      "Recast the student's idea with the academic word added."
    ],
    briefAlignmentNotes: [
      "CA ELD Part I, Part II, and PLD expectations were applied together."
    ],
    standardsUsed: [
      standard("Part I", "ELD.PI.3.1.Ex"),
      standard("Part II", "ELD.PII.3.1.Ex"),
      standard("PLD", "CA.ELD.PLD.3-5.EXPANDING")
    ],
    qualityChecks: [
      { id: "format_preserved", label: "Format preserved", passed: true, detail: "ok" },
      { id: "no_full_rewrite", label: "No full rewrite", passed: true, detail: "ok" },
      { id: "eld_bundle_complete", label: "ELD bundle complete", passed: true, detail: "ok" },
      { id: "no_student_data_detected", label: "No student data", passed: true, detail: "ok" },
      { id: "no_five_section_report", label: "No report", passed: true, detail: "ok" }
    ],
    safetyChecks: [
      { id: "pii_input", label: "No PII", passed: true, detail: "ok" },
      { id: "prompt_injection_input", label: "No prompt injection", passed: true, detail: "ok" },
      { id: "output_schema", label: "Schema", passed: true, detail: "ok" },
      { id: "standards_allowlist", label: "Standards allowlist", passed: true, detail: "ok" },
      { id: "format_preserved", label: "Format", passed: true, detail: "ok" },
      { id: "no_full_rewrite", label: "No rewrite", passed: true, detail: "ok" },
      { id: "output_dlp", label: "Output DLP", passed: true, detail: "ok" }
    ],
    changeNotes: [
      {
        anchor: "Objective",
        note: "Added a language objective.",
        standardIds: ["ELD.PI.3.1.Ex", "ELD.PII.3.1.Ex", "CA.ELD.PLD.3-5.EXPANDING"],
        changeType: "addition"
      }
    ],
    traceId: "run-123",
    alignmentMode: "llm",
    ...overrides
  };
}

test("visual packet spec uses checked alignment summary instead of raw aligned lesson text", () => {
  const response = alignment({
    alignedText: "RAW SECRET LESSON BODY SHOULD NOT BE SENT TO IMAGEGEN"
  });
  const spec = buildVisualPacketSpec(response, {
    gradeBand: "3-5",
    contentArea: "ELA",
    lessonGoal: "central idea"
  });

  assert.equal(spec.gradeBand, "3-5");
  assert.equal(spec.contentArea, "ELA");
  assert.equal(spec.runId, "run-123");
  assert.ok(!JSON.stringify(spec).includes("RAW SECRET LESSON BODY"));
});

test("visual packet prompts keep Part I, Part II, and PLD together and ban branding", () => {
  const prompts = buildVisualPacketPrompts(buildVisualPacketSpec(alignment()));
  const pageOnePrompt = prompts[0];

  assert.match(pageOnePrompt, /Part I/);
  assert.match(pageOnePrompt, /Part II/);
  assert.match(pageOnePrompt, /PLD/);
  assert.match(pageOnePrompt, /Do not include CDE, school, district, or product branding marks/);
  assert.match(pageOnePrompt, /Do not invent standards/);
});

test("visual packet generation stops before imagegen when safety fails", async () => {
  let called = false;

  await assert.rejects(
    () =>
      generateVisualPacket({
        alignment: alignment({
          safetyChecks: [
            { id: "pii_input", label: "PII", passed: false, detail: "blocked" }
          ]
        }),
        generateImage: async () => {
          called = true;
          return "image";
        }
      }),
    /passing alignment safety checks/,
  );

  assert.equal(called, false);
});

test("visual packet generation defaults to GPT Image 2", async () => {
  const previousModel = process.env.ELD_IMAGE_MODEL;
  delete process.env.ELD_IMAGE_MODEL;

  try {
    const result = await generateVisualPacket({
      alignment: alignment(),
      generateImage: async () => "image-b64"
    });

    assert.equal(DEFAULT_IMAGE_MODEL, "gpt-image-2");
    assert.equal(result.model, "gpt-image-2");
  } finally {
    if (previousModel !== undefined) {
      process.env.ELD_IMAGE_MODEL = previousModel;
    }
  }
});

test("visual packet generation returns page images and metadata with mocked imagegen", async () => {
  const previousModel = process.env.ELD_IMAGE_MODEL;
  process.env.ELD_IMAGE_MODEL = "gpt-image-2";

  try {
    const prompts: string[] = [];
    const result = await generateVisualPacket({
      alignment: alignment(),
      generateImage: async ({ prompt, pageNumber }) => {
        prompts.push(prompt);
        return `page-${pageNumber}-b64`;
      }
    });

    assert.equal(result.visualPacketStatus, "ready");
    assert.equal(result.visualPacketPromptVersion, VISUAL_PACKET_PROMPT_VERSION);
    assert.equal(result.model, "gpt-image-2");
    assert.equal(result.traceId, "run-123");
    assert.deepEqual(
      result.visualPacketImages.map((image) => image.b64Json),
      ["page-1-b64", "page-2-b64"],
    );
    assert.equal(prompts.length, 2);
  } finally {
    if (previousModel === undefined) {
      delete process.env.ELD_IMAGE_MODEL;
    } else {
      process.env.ELD_IMAGE_MODEL = previousModel;
    }
  }
});
