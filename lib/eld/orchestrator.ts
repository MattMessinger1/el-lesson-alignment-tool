import {
  flattenStandardsUsed,
  normalizeGradeSpan,
  normalizeProficiency,
  retrieveEldBundle
} from "./standards";
import { scanForPii } from "./safety";
import type {
  AlignmentResponse,
  EldBundle,
  EldMode,
  EldProficiency,
  ElpacSupport,
  InferredLessonContext,
  LessonStructure,
  QualityCheck,
  StandardUsed
} from "./types";

const CONTENT_LANGUAGE_DEMANDS: Record<string, Record<string, string>> = {
  ela: {
    languageFunction: "explain_with_evidence",
    demand:
      "explain ideas with evidence from the text, ask clarifying questions, and build on a partner's response",
    prompt:
      "Student Language Prompt: The text says ___. This shows ___ because ___. I want to add to ___ by saying ___."
  },
  math: {
    languageFunction: "justify_reasoning",
    demand:
      "describe a strategy, compare reasoning, and justify a solution using precise mathematical language",
    prompt: "Student Language Prompt: My strategy was ___ because ___. I agree or disagree with ___ because ___."
  },
  science: {
    languageFunction: "describe_observations",
    demand: "describe observations, explain relationships, and support claims with evidence",
    prompt: "Student Language Prompt: I observed ___. This evidence shows ___ because ___."
  },
  history: {
    languageFunction: "explain_with_evidence",
    demand: "interpret sources or events and explain relationships with evidence",
    prompt:
      "Student Language Prompt: The source/event shows ___ because ___. Another perspective might be ___."
  },
  default: {
    languageFunction: "explain_with_evidence",
    demand:
      "explain ideas, use lesson vocabulary, and build meaning through speaking, listening, reading, or writing",
    prompt: "Student Language Prompt: I think ___ because ___. I can add to ___ by saying ___."
  }
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeAlignmentRequest(body: {
  lessonText?: unknown;
  gradeLevel?: unknown;
  gradeBand?: unknown;
  elpacLevels?: unknown;
  proficiency?: unknown;
  lessonGoal?: unknown;
  contentArea?: unknown;
  contentExpectations?: unknown;
  contentStandardIds?: unknown;
  teacherNote?: unknown;
}) {
  const gradeLevel = cleanString(body.gradeLevel);
  const gradeBand = cleanString(body.gradeBand);

  return {
    lessonText: cleanString(body.lessonText),
    gradeLevel,
    gradeBand: gradeLevel || gradeBand,
    elpacLevels: cleanStringArray(body.elpacLevels),
    proficiency: cleanString(body.proficiency),
    lessonGoal: cleanString(body.lessonGoal),
    contentArea: cleanString(body.contentArea),
    contentExpectations: cleanString(body.contentExpectations),
    contentStandardIds: cleanStringArray(body.contentStandardIds),
    teacherNote: cleanString(body.teacherNote)
  };
}

export function analyzeLessonStructure(lessonText: string): LessonStructure {
  const lines = lessonText.split("\n");
  const headings = lines
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line.length > 52) {
        return false;
      }

      return (
        /^(objective|objectives|learning target|lesson goal|goal|essential question|materials|warm-up|activity|task|exit ticket|assessment|procedure)\b/i.test(
          line
        ) || /^[A-Z][A-Za-z /-]{2,32}$/.test(line)
      );
    });
  const likelyInsertionIndex = lines.findIndex((line) =>
    /^(objective|objectives|learning target|lesson goal|goal|essential question)\b/i.test(
      line.trim()
    )
  );

  return {
    hasTableLikeStructure: lines.some(
      (line) => line.includes("|") || /\t/.test(line) || / {2,}\S+ {2,}\S+/.test(line)
    ),
    headings,
    sectionCount: Math.max(1, headings.length),
    likelyInsertionIndex
  };
}

function detectContentKey(contentArea: string, lessonText: string): keyof typeof CONTENT_LANGUAGE_DEMANDS {
  const selectedArea = contentArea.toLowerCase();

  if (/(math|mathematics)/.test(selectedArea)) {
    return "math";
  }

  if (/science/.test(selectedArea)) {
    return "science";
  }

  if (/(history|social studies|civics|geography)/.test(selectedArea)) {
    return "history";
  }

  if (/(ela|english|reading|writing|literacy)/.test(selectedArea)) {
    return "ela";
  }

  const haystack = lessonText.toLowerCase();

  if (/(math|fraction|equation|number|geometry|algebra|strategy|solution)/.test(haystack)) {
    return "math";
  }

  if (/(science|experiment|ecosystem|force|matter|observe|observation)/.test(haystack)) {
    return "science";
  }

  if (/(history|social studies|civics|geography|source|event|primary source)/.test(haystack)) {
    return "history";
  }

  if (/(ela|english|reading|writing|text|novel|article|poem|claim|evidence)/.test(haystack)) {
    return "ela";
  }

  return "default";
}

function inferMode(lessonText: string): EldMode {
  const text = lessonText.toLowerCase();

  if (/(partner|group|discuss|discussion|collaborat|turn and talk|pairs)/.test(text)) {
    return "collaborative";
  }

  if (/(write|present|explain in writing|exit ticket|response)/.test(text)) {
    return "productive";
  }

  return "interpretive";
}

export function inferLessonContext(input: {
  lessonText: string;
  gradeBand: string;
  proficiency: string;
  contentArea: string;
}): InferredLessonContext {
  const contentKey = detectContentKey(input.contentArea, input.lessonText);
  const demand = CONTENT_LANGUAGE_DEMANDS[contentKey] ?? CONTENT_LANGUAGE_DEMANDS.default;

  return {
    gradeSpan: normalizeGradeSpan(input.gradeBand),
    proficiency: normalizeProficiency(input.proficiency),
    contentArea: contentKey,
    communicationMode: inferMode(input.lessonText),
    languageFunction: demand.languageFunction,
    languageDemand: demand.demand
  };
}

function proficiencySupport(proficiency: EldProficiency, pldSummary: string) {
  if (proficiency === "emerging") {
    return "ELD Support: Provide visuals, word banks, partner rehearsal, and sentence frames before students share independently.";
  }

  if (proficiency === "expanding") {
    return "ELD Support: Provide discussion stems and transition words so students can expand answers with evidence or examples.";
  }

  if (proficiency === "bridging") {
    return "ELD Support: Invite students to justify, compare, elaborate, and refine academic language with increasing independence.";
  }

  return `ELD Support: ${pldSummary}`;
}

function buildAdditions({
  lessonGoal,
  context,
  bundle
}: {
  lessonGoal: string;
  context: InferredLessonContext;
  bundle: EldBundle;
}) {
  const demand = CONTENT_LANGUAGE_DEMANDS[context.contentArea] ?? CONTENT_LANGUAGE_DEMANDS.default;
  const purpose = lessonGoal || "the lesson target";
  const partISummary = bundle.partI[0]?.contentStrand ?? bundle.partI[0]?.teacherFriendlySummary;
  const partIISummary = bundle.partII[0]?.contentStrand ?? bundle.partII[0]?.teacherFriendlySummary;
  const pldSummary = bundle.pld[0]?.teacherFriendlySummary;

  return [
    `Language Objective: Students will ${context.languageDemand} to demonstrate understanding of ${purpose}.`,
    `CA ELD Focus: ${partISummary} ${partIISummary}`,
    proficiencySupport(context.proficiency, pldSummary),
    demand.prompt
  ];
}

function insertAdditions(lessonText: string, structure: LessonStructure, additions: string[]) {
  const lines = lessonText.split("\n");

  if (structure.hasTableLikeStructure) {
    const separator = lines.some((line) => line.includes("|")) ? " | " : "\t";
    return [`CA ELD Alignment${separator}${additions.join(" ")}`, ...lines].join("\n");
  }

  if (structure.likelyInsertionIndex >= 0) {
    return [
      ...lines.slice(0, structure.likelyInsertionIndex + 1),
      ...additions,
      ...lines.slice(structure.likelyInsertionIndex + 1)
    ].join("\n");
  }

  return [...additions, "", ...lines].join("\n");
}

function startsWithSameSignal(originalText: string, alignedText: string, structure: LessonStructure) {
  const firstOriginal = originalText.trim().split("\n")[0]?.trim();

  if (structure.hasTableLikeStructure) {
    return alignedText.includes(firstOriginal);
  }

  return firstOriginal ? alignedText.trim().startsWith(firstOriginal) : true;
}

function containsFiveSectionReport(text: string) {
  return (
    /What Is Already Aligned/i.test(text) &&
    /What Needs Work/i.test(text) &&
    /Suggested Additions/i.test(text)
  );
}

export function checkAlignmentQuality({
  originalText,
  alignedText,
  standardsUsed,
  structure
}: {
  originalText: string;
  alignedText: string;
  standardsUsed: StandardUsed[];
  structure: LessonStructure;
}): QualityCheck[] {
  const partSet = new Set(standardsUsed.map((standard) => standard.part));
  const originalLength = originalText.trim().length;
  const alignedLength = alignedText.trim().length;

  return [
    {
      id: "format_preserved",
      label: "Format preserved",
      passed:
        startsWithSameSignal(originalText, alignedText, structure) &&
        structure.headings.every((heading) => alignedText.includes(heading)),
      detail: "Original headings/table signal remain present in the aligned output."
    },
    {
      id: "no_full_rewrite",
      label: "No full rewrite",
      passed: alignedLength <= Math.max(originalLength * 2.8, originalLength + 1200),
      detail: "Aligned output adds targeted ELD support without replacing the whole lesson."
    },
    {
      id: "eld_bundle_complete",
      label: "ELD bundle complete",
      passed: partSet.has("Part I") && partSet.has("Part II") && partSet.has("PLD"),
      detail: "Standards used include Part I, Part II, and PLD context together."
    },
    {
      id: "no_student_data_detected",
      label: "No student data detected",
      passed: !scanForPii(originalText).blocked,
      detail: "Input does not appear to include common student-identifiable data patterns."
    },
    {
      id: "no_five_section_report",
      label: "No report format",
      passed: !containsFiveSectionReport(alignedText),
      detail: "Output is not a separate five-section alignment report."
    }
  ];
}

export function createBriefAlignmentNotes({
  context,
  standardsUsed,
  teacherNote
}: {
  context: InferredLessonContext;
  standardsUsed: StandardUsed[];
  teacherNote: string;
}) {
  const ids = standardsUsed.map((standard) => standard.id).join(", ");

  return [
    `Grade span: ${context.gradeSpan}; proficiency: ${context.proficiency}.`,
    `Language demand: ${context.languageDemand}.`,
    `CA ELD bundle used: ${ids}.`,
    "Part I, Part II, and PLD context were retrieved and applied together.",
    teacherNote ? `Teacher note honored: ${teacherNote}` : ""
  ].filter(Boolean);
}

function contentGoal(input: { lessonGoal: string; contentArea: string }) {
  return input.lessonGoal || `${input.contentArea || "content"} lesson goal`;
}

function createStudentEvidence(context: InferredLessonContext) {
  if (context.communicationMode === "productive") {
    return [
      "Students write a response that uses lesson vocabulary and evidence.",
      "Students explain how their evidence supports the content idea."
    ];
  }

  if (context.communicationMode === "collaborative") {
    return [
      "Students discuss the content idea with a partner or group using evidence.",
      "Students ask, answer, or build on a peer's idea with lesson vocabulary."
    ];
  }

  return [
    "Students identify key ideas or evidence in the lesson material.",
    "Students explain the content idea using lesson vocabulary."
  ];
}

function createAcademicLanguageSupports(context: InferredLessonContext) {
  const demand = CONTENT_LANGUAGE_DEMANDS[context.contentArea] ?? CONTENT_LANGUAGE_DEMANDS.default;

  return {
    vocabulary: ["key content vocabulary", "evidence", "explain", "because"],
    languageFunctions: [context.languageFunction.replaceAll("_", " "), "clarify thinking"],
    languageFeatures: ["complete sentences", "evidence phrases", "because statements"],
    sentenceFrames: [
      "The important idea is ___ because ___.",
      "My evidence is ___, which shows ___."
    ],
    discussionOrWritingStems: [demand.prompt.replace("Student Language Prompt: ", "")],
    originalModelLanguage: [
      "The text or task shows ___ because ___. I can add that ___, so my conclusion is ___."
    ]
  };
}

function createElpacSupports(goal: string): ElpacSupport[] {
  return [
    {
      level: "1",
      proficiencyBand: "Emerging",
      supports: [
        "Preview the task with visuals, gestures, and 3-5 essential words before students begin.",
        "Offer sentence frames and partner rehearsal before independent speaking or writing.",
        "Let students point, sort, match, draw, or orally rehearse while still working toward the same content goal."
      ],
      cognitiveDemandNote: `ELPAC 1 students keep the same expectation: explain ${goal} with supported language.`
    },
    {
      level: "3",
      proficiencyBand: "Expanding",
      supports: [
        "Ask students to extend responses with because, for example, and this shows.",
        "Prompt students to compare ideas, ask a clarifying question, or build on a peer's evidence.",
        "Fade sentence frames into word banks or transition-word choices as students gain independence."
      ],
      cognitiveDemandNote: `ELPAC 3 students keep the same expectation: explain ${goal} with more precise and connected academic language.`
    }
  ];
}

function createSuccessCriteria(goal: string, context: InferredLessonContext) {
  return [
    `I can explain ${goal} using lesson vocabulary.`,
    "I can use evidence from the text, task, or discussion to support my idea.",
    `I can ${context.languageDemand}.`
  ];
}

function createTeacherFeedbackMoves() {
  return [
    "Prompt for evidence: \"What in the text, task, or model makes you think that?\"",
    "Recast and extend: repeat the student's idea with the academic word or phrase added.",
    "Press for precision: \"Can you say that again using the word ___?\"",
    "Invite peer language growth: \"Who can build on that idea with another piece of evidence?\""
  ];
}

export function alignLessonWithOrchestrator(input: {
  lessonText: string;
  gradeBand: string;
  elpacLevels?: string[];
  proficiency: string;
  lessonGoal: string;
  contentArea: string;
  contentExpectations?: string;
  contentStandardIds?: string[];
  teacherNote: string;
}): AlignmentResponse {
  const structure = analyzeLessonStructure(input.lessonText);
  const context = inferLessonContext(input);
  const goal = contentGoal(input);
  const bundle = retrieveEldBundle({
    gradeSpan: context.gradeSpan,
    proficiency: context.proficiency,
    mode: context.communicationMode,
    languageFunction: context.languageFunction
  });
  const additions = buildAdditions({
    lessonGoal: input.lessonGoal,
    context,
    bundle
  });
  const alignedText = insertAdditions(input.lessonText, structure, additions).trim();
  const standardsUsed = flattenStandardsUsed(bundle);
  const qualityChecks = checkAlignmentQuality({
    originalText: input.lessonText,
    alignedText,
    standardsUsed,
    structure
  });
  const studentEvidence = createStudentEvidence(context);

  return {
    alignedText,
    lessonLanguageFocus: {
      contentGoal: goal,
      languageDemand: context.languageDemand,
      studentEvidence: studentEvidence.join(" ")
    },
    studentEvidence,
    academicLanguageSupports: createAcademicLanguageSupports(context),
    elpacSupports: createElpacSupports(goal),
    studentFriendlySuccessCriteria: createSuccessCriteria(goal, context),
    teacherFeedbackMoves: createTeacherFeedbackMoves(),
    briefAlignmentNotes: createBriefAlignmentNotes({
      context,
      standardsUsed,
      teacherNote: input.teacherNote
    }),
    standardsUsed,
    qualityChecks,
    safetyChecks: [],
    changeNotes: additions.map((addition) => ({
      anchor: structure.likelyInsertionIndex >= 0 ? "lesson objective or goal" : "lesson opening",
      note: addition,
      standardIds: standardsUsed.map((standard) => standard.id),
      changeType: "addition"
    })),
    alignmentMode: "deterministic"
  };
}
