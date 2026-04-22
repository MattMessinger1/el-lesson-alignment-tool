import { NextResponse } from "next/server";
import {
  DEFAULT_IMAGE_MODEL,
  generateVisualPacket,
  VISUAL_PACKET_PROMPT_VERSION,
  VisualPacketError
} from "../../../lib/eld/visual-packet";
import type { AlignmentResponse } from "../../../lib/eld/types";

type VisualPacketRequest = {
  alignment?: AlignmentResponse;
  gradeBand?: unknown;
  contentArea?: unknown;
  lessonGoal?: unknown;
  title?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function configuredImageModel() {
  return process.env.ELD_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
}

export async function POST(request: Request) {
  let body: VisualPacketRequest;

  try {
    body = (await request.json()) as VisualPacketRequest;
  } catch {
    return NextResponse.json(
      {
        visualPacketImages: [],
        visualPacketPromptVersion: VISUAL_PACKET_PROMPT_VERSION,
        visualPacketStatus: "failed",
        model: configuredImageModel(),
        error: "Invalid JSON body."
      },
      { status: 400 },
    );
  }

  if (process.env.ELD_USE_IMAGEGEN !== "true") {
    return NextResponse.json({
      visualPacketImages: [],
      visualPacketPromptVersion: VISUAL_PACKET_PROMPT_VERSION,
      visualPacketStatus: "disabled",
      model: configuredImageModel()
    });
  }

  if (!body.alignment) {
    return NextResponse.json(
      {
        visualPacketImages: [],
        visualPacketPromptVersion: VISUAL_PACKET_PROMPT_VERSION,
        visualPacketStatus: "failed",
        model: configuredImageModel(),
        error: "A checked alignment response is required."
      },
      { status: 400 },
    );
  }

  try {
    const visualPacket = await generateVisualPacket({
      alignment: body.alignment,
      options: {
        gradeBand: cleanString(body.gradeBand),
        contentArea: cleanString(body.contentArea),
        lessonGoal: cleanString(body.lessonGoal),
        title: cleanString(body.title)
      }
    });

    return NextResponse.json(visualPacket);
  } catch (caughtError) {
    const status = caughtError instanceof VisualPacketError ? 400 : 500;
    console.warn(
      "EL lesson visual packet failed safely",
      caughtError instanceof Error ? `${caughtError.name}: ${caughtError.message}` : "unknown_error",
    );

    return NextResponse.json(
      {
        visualPacketImages: [],
        visualPacketPromptVersion: VISUAL_PACKET_PROMPT_VERSION,
        visualPacketStatus: "failed",
        model: configuredImageModel(),
        traceId: body.alignment.traceId,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Visual packet generation failed."
      },
      { status },
    );
  }
}
