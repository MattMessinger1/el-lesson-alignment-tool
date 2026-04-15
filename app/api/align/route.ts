import { NextResponse } from "next/server";
import {
  alignLessonWithOrchestrator,
  sanitizeAlignmentRequest
} from "../../../lib/eld/orchestrator";
import {
  alignLessonWithLlm,
  AlignmentGenerationError,
  ModelConfigMissingError
} from "../../../lib/eld/llm";
import {
  evaluateOutputSafety,
  MAX_INPUT_CHARACTERS,
  safetyMessageForCode,
  scanInputSafety
} from "../../../lib/eld/safety";
import type { AlignmentRequest } from "../../../lib/eld/types";

function logAlignmentFailure(reason: string, checks?: Array<{ id: string; passed: boolean }>) {
  console.warn("EL lesson alignment failed safely", {
    reason,
    failedChecks: checks?.filter((check) => !check.passed).map((check) => check.id) ?? []
  });
}

export async function POST(request: Request) {
  let body: AlignmentRequest;

  try {
    body = (await request.json()) as AlignmentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = sanitizeAlignmentRequest(body);

  if (input.lessonText.length > MAX_INPUT_CHARACTERS) {
    return NextResponse.json(
      { error: safetyMessageForCode("INPUT_TOO_LARGE"), code: "INPUT_TOO_LARGE" },
      { status: 413 }
    );
  }

  if (input.lessonText.length < 20) {
    return NextResponse.json(
      { error: "Add a little more lesson text before aligning.", code: "ALIGNMENT_FAILED" },
      { status: 400 }
    );
  }

  if (!input.gradeBand) {
    return NextResponse.json({ error: "Choose a grade or grade band.", code: "ALIGNMENT_FAILED" }, { status: 400 });
  }

  if (!input.contentArea) {
    return NextResponse.json({ error: "Choose a content area.", code: "ALIGNMENT_FAILED" }, { status: 400 });
  }

  const inputSafety = scanInputSafety(
    [input.lessonText, input.lessonGoal, input.contentArea, input.contentExpectations, input.teacherNote].join("\n")
  );

  if (inputSafety.blockedCode) {
    return NextResponse.json(
      {
        error: safetyMessageForCode(inputSafety.blockedCode),
        code: inputSafety.blockedCode,
        categories: inputSafety.categories,
        safetyChecks: inputSafety.checks
      },
      { status: 400 }
    );
  }

  try {
    if (process.env.ELD_USE_LLM === "true") {
      const alignment = await alignLessonWithLlm(input, {
        inputSafetyChecks: inputSafety.checks
      });

      return NextResponse.json(alignment);
    }

    const alignment = alignLessonWithOrchestrator(input);
    const formatCheck = alignment.qualityChecks.find((check) => check.id === "format_preserved");
    const rewriteCheck = alignment.qualityChecks.find((check) => check.id === "no_full_rewrite");
    const allowedStandardIds = alignment.standardsUsed.map((standard) => standard.id);
    const outputSafety = evaluateOutputSafety({
      alignedText: alignment.alignedText,
      briefAlignmentNotes: alignment.briefAlignmentNotes,
      additionalOutputText: [
        alignment.lessonLanguageFocus.contentGoal,
        alignment.lessonLanguageFocus.languageDemand,
        alignment.lessonLanguageFocus.studentEvidence,
        ...alignment.studentEvidence,
        ...alignment.academicLanguageSupports.vocabulary,
        ...alignment.academicLanguageSupports.languageFunctions,
        ...alignment.academicLanguageSupports.languageFeatures,
        ...alignment.academicLanguageSupports.sentenceFrames,
        ...alignment.academicLanguageSupports.discussionOrWritingStems,
        ...alignment.academicLanguageSupports.originalModelLanguage,
        ...alignment.elpacSupports.flatMap((support) => [
          support.cognitiveDemandNote,
          ...support.supports
        ]),
        ...alignment.studentFriendlySuccessCriteria,
        ...alignment.teacherFeedbackMoves
      ],
      standardsUsed: alignment.standardsUsed,
      allowedStandardIds,
      schemaValid:
        typeof alignment.alignedText === "string" &&
        typeof alignment.lessonLanguageFocus?.contentGoal === "string" &&
        Array.isArray(alignment.studentEvidence) &&
        Array.isArray(alignment.academicLanguageSupports?.sentenceFrames) &&
        Array.isArray(alignment.elpacSupports) &&
        Array.isArray(alignment.studentFriendlySuccessCriteria) &&
        Array.isArray(alignment.teacherFeedbackMoves) &&
        Array.isArray(alignment.briefAlignmentNotes) &&
        Array.isArray(alignment.standardsUsed) &&
        Array.isArray(alignment.qualityChecks) &&
        Array.isArray(alignment.changeNotes),
      formatPreserved: Boolean(formatCheck?.passed),
      noFullRewrite: Boolean(rewriteCheck?.passed)
    });
    const safetyChecks = [...inputSafety.checks, ...outputSafety];

    if (outputSafety.some((check) => !check.passed)) {
      logAlignmentFailure("deterministic_output_safety", safetyChecks);

      return NextResponse.json(
        {
          error: safetyMessageForCode("ALIGNMENT_FAILED"),
          code: "ALIGNMENT_FAILED",
          safetyChecks
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...alignment,
      safetyChecks
    });
  } catch (caughtError) {
    if (caughtError instanceof ModelConfigMissingError) {
      return NextResponse.json(
        { error: safetyMessageForCode("MODEL_CONFIG_MISSING"), code: "MODEL_CONFIG_MISSING" },
        { status: 503 }
      );
    }

    if (caughtError instanceof AlignmentGenerationError) {
      logAlignmentFailure(caughtError.message, caughtError.safetyChecks);

      return NextResponse.json(
        {
          error: safetyMessageForCode("ALIGNMENT_FAILED"),
          code: "ALIGNMENT_FAILED",
          safetyChecks: caughtError.safetyChecks
        },
        { status: 500 }
      );
    }

    logAlignmentFailure(
      caughtError instanceof Error ? `${caughtError.name}: ${caughtError.message}` : "unknown_error"
    );

    return NextResponse.json(
      { error: safetyMessageForCode("ALIGNMENT_FAILED"), code: "ALIGNMENT_FAILED" },
      { status: 500 }
    );
  }
}
