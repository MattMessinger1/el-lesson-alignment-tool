import OpenAI from "openai";
import { scanInputSafety } from "./safety";
import type {
  AlignmentResponse,
  EldPart,
  StandardUsed,
  VisualPacketImage,
  VisualPacketResponse,
  VisualPacketSpec
} from "./types";

export const VISUAL_PACKET_PROMPT_VERSION = "teacher-visual-packet-v1";
export const DEFAULT_IMAGE_MODEL = "gpt-image-2";
export const DEFAULT_IMAGE_QUALITY = "medium";

type VisualPacketOptions = {
  gradeBand?: string;
  contentArea?: string;
  lessonGoal?: string;
  title?: string;
};

type GenerateImageInput = {
  prompt: string;
  model: string;
  quality: "low" | "medium" | "high" | "auto";
  pageNumber: number;
};

type GenerateImage = (input: GenerateImageInput) => Promise<string>;

export class VisualPacketError extends Error {
  constructor(
    message: string,
    public readonly code = "VISUAL_PACKET_FAILED",
  ) {
    super(message);
    this.name = "VisualPacketError";
  }
}

function compactText(value: string, maxLength = 220) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function compactList(values: string[], maxItems: number, maxLength = 160) {
  return values.filter(Boolean).slice(0, maxItems).map((value) => compactText(value, maxLength));
}

function rationaleForPart(standards: StandardUsed[], part: EldPart) {
  const partStandards = standards.filter((standard) => standard.part === part);
  const summaries = partStandards.map((standard) => standard.teacherFriendlySummary).filter(Boolean);

  return {
    part,
    standardIds: partStandards.map((standard) => standard.id),
    summary: compactText(summaries.join(" "), 360)
  };
}

export function buildVisualPacketSpec(
  alignment: AlignmentResponse,
  options: VisualPacketOptions = {},
): VisualPacketSpec {
  return {
    title: compactText(
      options.title ||
        options.lessonGoal ||
        alignment.lessonLanguageFocus.contentGoal ||
        "CA ELD Lesson Alignment",
      90,
    ),
    gradeBand: compactText(options.gradeBand || "Grade band not provided", 40),
    contentArea: compactText(options.contentArea || alignment.lessonLanguageFocus.contentGoal || "Content", 50),
    languageDemand: compactText(alignment.lessonLanguageFocus.languageDemand, 340),
    studentEvidence: compactList(
      alignment.studentEvidence.length
        ? alignment.studentEvidence
        : [alignment.lessonLanguageFocus.studentEvidence],
      4,
      180,
    ),
    eldRationale: [
      rationaleForPart(alignment.standardsUsed, "Part I"),
      rationaleForPart(alignment.standardsUsed, "Part II"),
      rationaleForPart(alignment.standardsUsed, "PLD")
    ],
    elpacSupports: alignment.elpacSupports.map((support) => ({
      ...support,
      cognitiveDemandNote: compactText(support.cognitiveDemandNote, 170),
      supports: compactList(support.supports, 4, 150)
    })),
    sentenceFrames: compactList(
      [
        ...alignment.academicLanguageSupports.sentenceFrames,
        ...alignment.academicLanguageSupports.discussionOrWritingStems
      ],
      5,
      150,
    ),
    successCriteria: compactList(alignment.studentFriendlySuccessCriteria, 5, 150),
    teacherFeedbackMoves: compactList(alignment.teacherFeedbackMoves, 5, 150),
    runId: alignment.traceId
  };
}

export function validateVisualPacketSpec(spec: VisualPacketSpec) {
  const parts = new Set(spec.eldRationale.map((item) => item.part));
  if (!parts.has("Part I") || !parts.has("Part II") || !parts.has("PLD")) {
    throw new VisualPacketError("Visual packet requires Part I, Part II, and PLD rationale.");
  }

  const safetyText = JSON.stringify(spec);
  const safety = scanInputSafety(safetyText);
  if (safety.blockedCode) {
    throw new VisualPacketError("Visual packet content did not pass safety checks.", safety.blockedCode);
  }
}

function packetRules() {
  return [
    "Create a clean portrait teacher handout page for a CA ELD lesson alignment tool.",
    "Use only the supplied packet text. Do not invent standards, claims, examples, school names, logos, seals, endorsements, or student details.",
    "Use high contrast, large readable text, short bullets, generous margins, and simple section dividers.",
    "Do not include CDE, school, district, or product branding marks. Plain text attribution labels are allowed only if supplied.",
    "Avoid decorative clutter, tiny text, fake QR codes, signatures, stamps, watermarks, or badges.",
    "Use a restrained professional classroom style with calm green, teal, ink, and white."
  ].join(" ");
}

function pageOnePrompt(spec: VisualPacketSpec) {
  return [
    packetRules(),
    "Page 1 of 2. Layout title: Language Demand + CA ELD Rationale.",
    "Required sections: Lesson Context, Students Use Language To, Student Evidence, CA ELD Rationale.",
    "The CA ELD Rationale section must show Part I, Part II, and PLD together as three connected cards.",
    JSON.stringify({
      title: spec.title,
      gradeBand: spec.gradeBand,
      contentArea: spec.contentArea,
      languageDemand: spec.languageDemand,
      studentEvidence: spec.studentEvidence,
      eldRationale: spec.eldRationale,
      runId: spec.runId
    })
  ].join("\n\n");
}

function pageTwoPrompt(spec: VisualPacketSpec) {
  return [
    packetRules(),
    "Page 2 of 2. Layout title: Supports Teachers Can Use Tomorrow.",
    "Required sections: ELPAC 1 Access, ELPAC 3 Access, Sentence Frames, Success Criteria, Teacher Feedback Moves.",
    "Make the Level 1 and Level 3 supports visibly different while keeping the same cognitive demand.",
    JSON.stringify({
      title: spec.title,
      gradeBand: spec.gradeBand,
      contentArea: spec.contentArea,
      elpacSupports: spec.elpacSupports,
      sentenceFrames: spec.sentenceFrames,
      successCriteria: spec.successCriteria,
      teacherFeedbackMoves: spec.teacherFeedbackMoves,
      runId: spec.runId
    })
  ].join("\n\n");
}

export function buildVisualPacketPrompts(spec: VisualPacketSpec) {
  validateVisualPacketSpec(spec);
  return [pageOnePrompt(spec), pageTwoPrompt(spec)];
}

function configuredImageModel() {
  return process.env.ELD_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
}

function configuredImageQuality(): "low" | "medium" | "high" | "auto" {
  const value = process.env.ELD_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
  return value === "low" || value === "medium" || value === "high" || value === "auto"
    ? value
    : DEFAULT_IMAGE_QUALITY;
}

async function generateOpenAiImage({ prompt, model, quality }: GenerateImageInput) {
  if (!process.env.OPENAI_API_KEY) {
    throw new VisualPacketError("OPENAI_API_KEY is required for visual packet generation.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({
    model,
    prompt,
    size: "1024x1536",
    quality,
    output_format: "png",
    background: "opaque"
  });
  const b64Json = response.data?.[0]?.b64_json;

  if (!b64Json) {
    throw new VisualPacketError("Image generation returned no image data.");
  }

  return b64Json;
}

export async function generateVisualPacket({
  alignment,
  options = {},
  generateImage = generateOpenAiImage
}: {
  alignment: AlignmentResponse;
  options?: VisualPacketOptions;
  generateImage?: GenerateImage;
}): Promise<VisualPacketResponse> {
  if (alignment.safetyChecks.some((check) => !check.passed)) {
    throw new VisualPacketError("Visual packet generation requires passing alignment safety checks.");
  }

  if (alignment.qualityChecks.some((check) => !check.passed)) {
    throw new VisualPacketError("Visual packet generation requires passing alignment quality checks.");
  }

  const spec = buildVisualPacketSpec(alignment, options);
  const prompts = buildVisualPacketPrompts(spec);
  const model = configuredImageModel();
  const quality = configuredImageQuality();
  const visualPacketImages: VisualPacketImage[] = [];

  for (const [index, prompt] of prompts.entries()) {
    const pageNumber = index + 1;
    const b64Json = await generateImage({ prompt, model, quality, pageNumber });
    visualPacketImages.push({
      pageNumber,
      b64Json,
      altText:
        pageNumber === 1
          ? "Teacher visual packet page showing language demand, student evidence, and CA ELD rationale."
          : "Teacher visual packet page showing ELPAC supports, sentence frames, success criteria, and teacher feedback moves."
    });
  }

  return {
    visualPacketImages,
    visualPacketPromptVersion: VISUAL_PACKET_PROMPT_VERSION,
    visualPacketStatus: "ready",
    model,
    traceId: alignment.traceId
  };
}
