import { NextResponse } from "next/server";
import {
  alignLessonWithOrchestrator,
  sanitizeAlignmentRequest
} from "../../../lib/eld/orchestrator";
import {
  evaluateOutputSafety,
  MAX_INPUT_CHARACTERS,
  safetyMessageForCode,
  scanInputSafety
} from "../../../lib/eld/safety";
import type { AlignmentRequest } from "../../../lib/eld/types";

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
      { error: "Add a little more lesson, unit, or task text before aligning.", code: "ALIGNMENT_FAILED" },
      { status: 400 }
    );
  }

  if (!input.gradeBand) {
    return NextResponse.json({ error: "Choose a grade band.", code: "ALIGNMENT_FAILED" }, { status: 400 });
  }

  const inputSafety = scanInputSafety(
    [input.lessonText, input.lessonGoal, input.contentArea, input.teacherNote].join("\n")
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
    const alignment = alignLessonWithOrchestrator(input);
    const formatCheck = alignment.qualityChecks.find((check) => check.id === "format_preserved");
    const rewriteCheck = alignment.qualityChecks.find((check) => check.id === "no_full_rewrite");
    const allowedStandardIds = alignment.standardsUsed.map((standard) => standard.id);
    const outputSafety = evaluateOutputSafety({
      alignedText: alignment.alignedText,
      briefAlignmentNotes: alignment.briefAlignmentNotes,
      standardsUsed: alignment.standardsUsed,
      allowedStandardIds,
      schemaValid:
        typeof alignment.alignedText === "string" &&
        Array.isArray(alignment.briefAlignmentNotes) &&
        Array.isArray(alignment.standardsUsed) &&
        Array.isArray(alignment.qualityChecks),
      formatPreserved: Boolean(formatCheck?.passed),
      noFullRewrite: Boolean(rewriteCheck?.passed)
    });
    const safetyChecks = [...inputSafety.checks, ...outputSafety];

    if (outputSafety.some((check) => !check.passed)) {
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
  } catch {
    return NextResponse.json(
      { error: safetyMessageForCode("ALIGNMENT_FAILED"), code: "ALIGNMENT_FAILED" },
      { status: 500 }
    );
  }
}
