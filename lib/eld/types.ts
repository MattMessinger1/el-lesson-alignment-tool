export type GradeSpan = "K-2" | "3-5" | "6-8" | "9-12";

export type EldPart = "Part I" | "Part II" | "PLD";

export type EldMode = "collaborative" | "interpretive" | "productive";

export type EldProficiency = "emerging" | "expanding" | "bridging" | "mixed" | "unknown";

export type EldStandardRecord = {
  id: string;
  gradeSpan: GradeSpan;
  gradeRange?: string;
  minGrade?: number;
  maxGrade?: number;
  part: EldPart;
  mode: EldMode | "language_resources" | "proficiency";
  proficiencyLevel: EldProficiency;
  descriptor: string;
  standardText: string;
  cluster?: string;
  contentStrand?: string;
  languageFunction: string;
  languageResources: string[];
  teacherFriendlySummary: string;
  pairedStandards: string[];
  sourceName: string;
  sourceUrl: string;
  copyrightOwner: string;
  importedAt: string;
  isApplicable: boolean;
  reviewStatus: "draft_seed" | "sme_reviewed" | "official_cde_import" | "source_summary";
};

export type EldBundle = {
  partI: EldStandardRecord[];
  partII: EldStandardRecord[];
  pld: EldStandardRecord[];
};

export type AlignmentRequest = {
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
  standardText: string;
  sourceName: string;
  sourceUrl: string;
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

export type AlignmentErrorCode =
  | "PII_DETECTED"
  | "PROMPT_INJECTION_DETECTED"
  | "INPUT_TOO_LARGE"
  | "UNSUPPORTED_FILE_TEXT"
  | "MODEL_CONFIG_MISSING"
  | "ALIGNMENT_FAILED";

export type SafetyCheck = {
  id:
    | "pii_input"
    | "prompt_injection_input"
    | "output_schema"
    | "standards_allowlist"
    | "format_preserved"
    | "no_full_rewrite"
    | "output_dlp";
  label: string;
  passed: boolean;
  detail: string;
  categories?: string[];
};

export type AlignmentMode = "deterministic" | "llm";

export type ChangeNote = {
  anchor: string;
  note: string;
  standardIds: string[];
  changeType: "addition" | "light_revision" | "format_preservation";
};

export type LessonLanguageFocus = {
  contentGoal: string;
  languageDemand: string;
  studentEvidence: string;
};

export type AcademicLanguageSupports = {
  vocabulary: string[];
  languageFunctions: string[];
  languageFeatures: string[];
  sentenceFrames: string[];
  discussionOrWritingStems: string[];
  originalModelLanguage: string[];
};

export type ElpacSupport = {
  level: "1" | "3";
  proficiencyBand: "Emerging" | "Expanding";
  supports: string[];
  cognitiveDemandNote: string;
};

export type AlignmentResponse = {
  alignedText: string;
  lessonLanguageFocus: LessonLanguageFocus;
  studentEvidence: string[];
  academicLanguageSupports: AcademicLanguageSupports;
  elpacSupports: ElpacSupport[];
  studentFriendlySuccessCriteria: string[];
  teacherFeedbackMoves: string[];
  briefAlignmentNotes: string[];
  standardsUsed: StandardUsed[];
  qualityChecks: QualityCheck[];
  safetyChecks: SafetyCheck[];
  changeNotes: ChangeNote[];
  traceId?: string;
  alignmentMode: AlignmentMode;
};
