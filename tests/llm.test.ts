import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/align/route";
import {
  alignLessonWithLlm,
  buildLlmAlignmentPrompt,
  LLM_ALIGNMENT_OUTPUT_SCHEMA,
  validateLlmAlignmentOutput
} from "../lib/eld/llm";
import { analyzeLessonStructure, inferLessonContext } from "../lib/eld/orchestrator";
import { retrieveEldBundle } from "../lib/eld/standards";

const safeLesson = `Objective
Students will explain the central idea with evidence.

Activity
Students discuss details with a partner.`;

function completeLlmOutput(overrides = {}) {
  return {
    alignedText: `Objective
Students will explain the central idea with evidence.
Language Objective: Students will discuss details using evidence and build on a partner's idea.

Activity
Students discuss details with a partner using: "The text says ___, which shows ___."`,
    lessonLanguageFocus: {
      contentGoal: "central idea",
      languageDemand: "explain ideas with evidence through collaborative discussion",
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
        level: "1" as const,
        proficiencyBand: "Emerging" as const,
        supports: ["Preview key vocabulary with visuals.", "Provide a sentence frame before partner talk."],
        cognitiveDemandNote: "ELPAC 1 students still explain the central idea with evidence."
      },
      {
        level: "3" as const,
        proficiencyBand: "Expanding" as const,
        supports: ["Ask students to add because and evidence phrases.", "Fade frames into transition-word choices."],
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
      "CA ELD Part I, Part II, and PLD expectations were applied together.",
      "Language demand: students explain with evidence through collaborative discussion."
    ],
    changeNotes: [
      {
        anchor: "Objective",
        note: "Added a focused language objective.",
        standardIds: ["ELD.PI.3.1.Ex", "ELD.PII.3.1.Ex", "CA.ELD.PLD.3-5.EXPANDING"],
        changeType: "addition" as const
      }
    ],
    ...overrides
  };
}

test("LLM prompt builder uses delimited blocks and retrieved standards", () => {
  const structure = analyzeLessonStructure(safeLesson);
  const context = inferLessonContext({
    lessonText: safeLesson,
    gradeBand: "3-5",
    proficiency: "expanding",
    contentArea: "ELA"
  });
  const bundle = retrieveEldBundle({
    gradeSpan: context.gradeSpan,
    proficiency: context.proficiency,
    mode: context.communicationMode,
    languageFunction: context.languageFunction
  });
  const prompt = buildLlmAlignmentPrompt({
    originalLesson: safeLesson,
    structure,
    context,
    bundle,
    teacherOptions: {
      gradeBand: "3-5",
      proficiency: "expanding",
      lessonGoal: "central idea",
      contentArea: "ELA",
      teacherNote: ""
    }
  });

  assert.match(prompt, /<ORIGINAL_LESSON>/);
  assert.match(prompt, /<LESSON_STRUCTURE>/);
  assert.match(prompt, /<INFERRED_CONTEXT>/);
  assert.match(prompt, /<RETRIEVED_CA_ELD_BUNDLE>/);
  assert.match(prompt, /<TEACHER_OPTIONS>/);
  assert.match(prompt, /<OUTPUT_REQUIREMENTS>/);
  assert.ok(prompt.includes(bundle.partI[0].id));
  assert.ok(!prompt.includes("call tools"));
});

test("LLM schema rejects missing alignedText", () => {
  const result = LLM_ALIGNMENT_OUTPUT_SCHEMA.safeParse({
    briefAlignmentNotes: ["Used the retrieved bundle."],
    changeNotes: [
      {
        anchor: "Objective",
        note: "Added a language objective.",
        standardIds: ["ELD.PI.3-5.1"],
        changeType: "addition"
      }
    ]
  });

  assert.equal(result.success, false);
});

test("LLM validation rejects invented standards and report output", () => {
  assert.throws(() =>
    validateLlmAlignmentOutput({
      output: completeLlmOutput({
        alignedText: "Objective\nStudents explain ideas.\nWhat Needs Work\nThis is a report.",
        changeNotes: [
          {
            anchor: "Objective",
            note: "Added language support.",
            standardIds: ["ELD.PI.9-12.fake"],
            changeType: "addition"
          }
        ]
      }),
      allowedStandardIds: ["ELD.PI.3-5.1", "ELD.PII.3-5.1", "ELD.PLD.3-5.expanding"]
    })
  );
});

test("LLM schema requires lesson-focused teacher supports", () => {
  const result = LLM_ALIGNMENT_OUTPUT_SCHEMA.safeParse({
    alignedText: "Objective\nStudents explain the central idea with evidence.",
    briefAlignmentNotes: ["Used the retrieved bundle."],
    changeNotes: [
      {
        anchor: "Objective",
        note: "Added a language objective.",
        standardIds: ["ELD.PI.3.1.Ex"],
        changeType: "addition"
      }
    ]
  });

  assert.equal(result.success, false);
});

test("mocked LLM pipeline returns llm mode with safety checks", async () => {
  const response = await alignLessonWithLlm(
    {
      lessonText: safeLesson,
      gradeBand: "3-5",
      proficiency: "expanding",
      lessonGoal: "central idea",
      contentArea: "ELA",
      teacherNote: ""
    },
    {
      logger: null,
      inputSafetyChecks: [
        {
          id: "pii_input",
          label: "No student-identifiable data",
          passed: true,
          detail: "No common student-identifiable data patterns were detected."
        },
        {
          id: "prompt_injection_input",
          label: "No prompt injection",
          passed: true,
          detail: "No common prompt-injection patterns were detected."
        }
      ],
      generateAlignment: async ({ prompt }) => {
        assert.match(prompt, /<ORIGINAL_LESSON>/);

        return completeLlmOutput();
      }
    }
  );

  assert.equal(response.alignmentMode, "llm");
  assert.ok(response.alignedText.startsWith("Objective"));
  assert.ok(response.safetyChecks.every((check) => check.passed));
  assert.ok(response.changeNotes.length > 0);
  assert.ok(response.studentEvidence.length > 0);
  assert.ok(response.elpacSupports.some((support) => support.level === "1"));
  assert.ok(response.elpacSupports.some((support) => support.level === "3"));
  assert.ok(response.teacherFeedbackMoves.length > 0);
});

test("API returns MODEL_CONFIG_MISSING when LLM is enabled without Braintrust key", async () => {
  const previousUseLlm = process.env.ELD_USE_LLM;
  const previousKey = process.env.BRAINTRUST_API_KEY;
  process.env.ELD_USE_LLM = "true";
  delete process.env.BRAINTRUST_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/align", {
        method: "POST",
        body: JSON.stringify({
          lessonText: safeLesson,
          gradeBand: "3-5",
          proficiency: "expanding",
          lessonGoal: "central idea",
          contentArea: "ELA",
          teacherNote: ""
        })
      })
    );
    const data = await response.json();

    assert.equal(response.status, 503);
    assert.equal(data.code, "MODEL_CONFIG_MISSING");
  } finally {
    if (previousUseLlm === undefined) {
      delete process.env.ELD_USE_LLM;
    } else {
      process.env.ELD_USE_LLM = previousUseLlm;
    }

    if (previousKey === undefined) {
      delete process.env.BRAINTRUST_API_KEY;
    } else {
      process.env.BRAINTRUST_API_KEY = previousKey;
    }
  }
});
