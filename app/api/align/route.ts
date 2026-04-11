import { NextResponse } from "next/server";

type AlignmentRequest = {
  lessonText?: unknown;
  gradeBand?: unknown;
  proficiency?: unknown;
  lessonGoal?: unknown;
  contentArea?: unknown;
  teacherNote?: unknown;
};

const PROFICIENCY_LABELS: Record<string, string> = {
  emerging: "Emerging",
  expanding: "Expanding",
  bridging: "Bridging",
  mixed: "Emerging-Expanding-Bridging",
  unknown: "Not specified"
};

const LANGUAGE_MOVES: Record<string, string> = {
  english: "explain ideas with evidence from the text, ask clarifying questions, and build on a partner's response",
  ela: "explain ideas with evidence from the text, ask clarifying questions, and build on a partner's response",
  math: "describe a strategy, compare reasoning, and justify a solution using precise mathematical language",
  science: "describe observations, explain cause-and-effect relationships, and support claims with evidence",
  history: "recount events, explain relationships among ideas, and support interpretations with evidence",
  social: "recount events, explain relationships among ideas, and support interpretations with evidence",
  default: "explain ideas, use lesson vocabulary, and build meaning through speaking, listening, reading, or writing"
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function detectContentKey(contentArea: string, lessonText: string): string {
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

  if (/(math|fraction|equation|number|geometry|algebra)/.test(haystack)) {
    return "math";
  }

  if (/(science|claim|evidence|experiment|ecosystem|force|matter)/.test(haystack)) {
    return "science";
  }

  if (/(history|social studies|civics|geography|source|event)/.test(haystack)) {
    return "history";
  }

  if (/(ela|english|reading|writing|text|novel|article|poem)/.test(haystack)) {
    return "ela";
  }

  return "default";
}

function inferLanguageObjective(contentArea: string, lessonText: string, lessonGoal: string): string {
  const contentKey = detectContentKey(contentArea, `${lessonGoal} ${lessonText}`);
  const move = LANGUAGE_MOVES[contentKey] ?? LANGUAGE_MOVES.default;
  const purpose = lessonGoal || "the lesson target";

  return `Language Objective: Students will ${move} to demonstrate understanding of ${purpose}.`;
}

function inferSupport(proficiency: string): string {
  const label = PROFICIENCY_LABELS[proficiency] ?? PROFICIENCY_LABELS.unknown;

  if (proficiency === "emerging") {
    return "ELD Support: Provide word banks, sentence frames, partner rehearsal, visuals, and modeled examples before students share independently.";
  }

  if (proficiency === "expanding") {
    return "ELD Support: Provide discussion stems, transition words, and opportunities to expand responses with evidence or examples.";
  }

  if (proficiency === "bridging") {
    return "ELD Support: Invite students to justify, compare, elaborate, and refine academic language with increasing independence.";
  }

  if (proficiency === "mixed") {
    return "ELD Support: Offer tiered frames: name or point to an idea, explain the idea with evidence, then extend or justify the idea independently.";
  }

  return `ELD Support: Add language scaffolds appropriate for the selected grade band and proficiency range (${label}).`;
}

function inferPrompt(contentArea: string, lessonText: string): string {
  const contentKey = detectContentKey(contentArea, lessonText);

  if (contentKey === "math") {
    return "Student Language Prompt: My strategy was ___ because ___. I agree or disagree with ___ because ___.";
  }

  if (contentKey === "science") {
    return "Student Language Prompt: I observed ___. This evidence shows ___ because ___.";
  }

  if (contentKey === "history") {
    return "Student Language Prompt: The source/event shows ___ because ___. Another perspective might be ___.";
  }

  if (contentKey === "ela") {
    return "Student Language Prompt: The text says ___. This shows ___ because ___. I want to add to ___ by saying ___.";
  }

  return "Student Language Prompt: I think ___ because ___. I can add to ___ by saying ___.";
}

function hasTableLikeStructure(text: string): boolean {
  return text
    .split("\n")
    .some((line) => line.includes("|") || /\t/.test(line) || / {2,}\S+ {2,}\S+/.test(line));
}

function insertAfterLikelyObjective(lines: string[], additions: string[]): string[] {
  const objectiveIndex = lines.findIndex((line) =>
    /^(objective|objectives|learning target|lesson goal|goal|essential question|unit goal)\b/i.test(
      line.trim()
    )
  );

  if (objectiveIndex >= 0) {
    return [
      ...lines.slice(0, objectiveIndex + 1),
      ...additions,
      ...lines.slice(objectiveIndex + 1)
    ];
  }

  return [...additions, "", ...lines];
}

function alignTableLikeText(lessonText: string, additions: string[]): string {
  const lines = lessonText.split("\n");
  const separator = lines.some((line) => line.includes("|")) ? " | " : "\t";
  const alignedRows = [
    `CA ELD Alignment${separator}${additions.join(" ")}`,
    ...lines
  ];

  return alignedRows.join("\n");
}

function alignLesson({
  lessonText,
  gradeBand,
  proficiency,
  lessonGoal,
  contentArea,
  teacherNote
}: {
  lessonText: string;
  gradeBand: string;
  proficiency: string;
  lessonGoal: string;
  contentArea: string;
  teacherNote: string;
}): string {
  const languageObjective = inferLanguageObjective(contentArea, lessonText, lessonGoal);
  const support = inferSupport(proficiency);
  const prompt = inferPrompt(contentArea, lessonText);
  const additions = [languageObjective, support, prompt];
  const alignedBody = hasTableLikeStructure(lessonText)
    ? alignTableLikeText(lessonText, additions)
    : insertAfterLikelyObjective(lessonText.split("\n"), additions).join("\n");

  const label = PROFICIENCY_LABELS[proficiency] ?? PROFICIENCY_LABELS.unknown;
  const noteDetails = [
    `Grade band: ${gradeBand || "Not specified"}`,
    `ELD proficiency range: ${label}`,
    `Primary CA ELD focus: Part I language use in collaborative, interpretive, and productive modes; Part II language resources; PLD-aware support.`,
    `Language demand: ${LANGUAGE_MOVES[detectContentKey(contentArea, lessonText)] ?? LANGUAGE_MOVES.default}.`,
    teacherNote ? `Teacher note honored: ${teacherNote}` : ""
  ].filter(Boolean);

  return `${alignedBody.trim()}\n\n---\nBrief Alignment Notes\n${noteDetails
    .map((item) => `- ${item}`)
    .join("\n")}`;
}

export async function POST(request: Request) {
  let body: AlignmentRequest;

  try {
    body = (await request.json()) as AlignmentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lessonText = cleanString(body.lessonText);
  const gradeBand = cleanString(body.gradeBand);
  const rawProficiency = cleanString(body.proficiency).toLowerCase() || "unknown";
  const proficiency = rawProficiency in PROFICIENCY_LABELS ? rawProficiency : "unknown";
  const lessonGoal = cleanString(body.lessonGoal);
  const contentArea = cleanString(body.contentArea);
  const teacherNote = cleanString(body.teacherNote);

  if (lessonText.length < 20) {
    return NextResponse.json(
      { error: "Add a little more lesson, unit, or task text before aligning." },
      { status: 400 }
    );
  }

  if (!gradeBand) {
    return NextResponse.json({ error: "Choose a grade band." }, { status: 400 });
  }

  return NextResponse.json({
    alignedText: alignLesson({
      lessonText,
      gradeBand,
      proficiency,
      lessonGoal,
      contentArea,
      teacherNote
    })
  });
}
