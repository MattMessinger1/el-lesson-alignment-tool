import { NextResponse } from "next/server";
import {
  alignLessonWithOrchestrator,
  sanitizeAlignmentRequest
} from "../../../lib/eld/orchestrator";
import type { AlignmentRequest } from "../../../lib/eld/types";

export async function POST(request: Request) {
  let body: AlignmentRequest;

  try {
    body = (await request.json()) as AlignmentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = sanitizeAlignmentRequest(body);

  if (input.lessonText.length < 20) {
    return NextResponse.json(
      { error: "Add a little more lesson, unit, or task text before aligning." },
      { status: 400 }
    );
  }

  if (!input.gradeBand) {
    return NextResponse.json({ error: "Choose a grade band." }, { status: 400 });
  }

  return NextResponse.json(alignLessonWithOrchestrator(input));
}
