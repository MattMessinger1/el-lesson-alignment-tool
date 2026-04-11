export type GradeSpan = "K-2" | "3-5" | "6-8" | "9-12";

export type EldPart = "Part I" | "Part II" | "PLD";

export type EldMode = "collaborative" | "interpretive" | "productive";

export type EldProficiency = "emerging" | "expanding" | "bridging" | "mixed" | "unknown";

export type EldStandardRecord = {
  id: string;
  gradeSpan: GradeSpan;
  part: EldPart;
  mode: EldMode | "language_resources" | "proficiency";
  proficiencyLevel: EldProficiency;
  descriptor: string;
  languageFunction: string;
  languageResources: string[];
  teacherFriendlySummary: string;
  pairedStandards: string[];
  reviewStatus: "draft_seed" | "sme_reviewed";
};

export type EldBundle = {
  partI: EldStandardRecord[];
  partII: EldStandardRecord[];
  pld: EldStandardRecord[];
};

export type AlignmentRequest = {
  lessonText?: unknown;
  gradeBand?: unknown;
  proficiency?: unknown;
  lessonGoal?: unknown;
  contentArea?: unknown;
  teacherNote?: unknown;
};

export type LessonStructure = {
  hasTableLikeStructure: boolean;
  headings: string[];
  sectionCount: number;
  likelyInsertionIndex: number;
};

export type InferredLessonContext = {
  gradeSpan: GradeSpan;
  proficiency: EldProficiency;
  contentArea: string;
  communicationMode: EldMode;
  languageFunction: string;
  languageDemand: string;
};

export type StandardUsed = {
  id: string;
  gradeSpan: GradeSpan;
  part: EldPart;
  mode: EldStandardRecord["mode"];
  proficiencyLevel: EldProficiency;
  languageFunction: string;
  teacherFriendlySummary: string;
  descriptor: string;
};

export type QualityCheck = {
  id:
    | "format_preserved"
    | "no_full_rewrite"
    | "eld_bundle_complete"
    | "no_student_data_detected"
    | "no_five_section_report";
  label: string;
  passed: boolean;
  detail: string;
};

export type AlignmentResponse = {
  alignedText: string;
  briefAlignmentNotes: string[];
  standardsUsed: StandardUsed[];
  qualityChecks: QualityCheck[];
};
