import standards from "../../data/ca-eld/standards.json";
import plds from "../../data/ca-eld/plds.json";
import type {
  EldBundle,
  EldMode,
  EldProficiency,
  EldStandardRecord,
  GradeSpan,
  StandardUsed
} from "./types";

const ELD_STANDARDS = standards as EldStandardRecord[];
const ELD_PLDS = plds as EldStandardRecord[];

export function normalizeGradeSpan(input: string): GradeSpan {
  const value = input.trim().toLowerCase();

  if (value.includes("k") || value.includes("1") || value.includes("2")) {
    return "K-2";
  }

  if (value.includes("3") || value.includes("4") || value.includes("5")) {
    return "3-5";
  }

  if (value.includes("6") || value.includes("7") || value.includes("8")) {
    return "6-8";
  }

  return "9-12";
}

export function normalizeProficiency(input: string): EldProficiency {
  const value = input.trim().toLowerCase();

  if (value === "emerging" || value === "expanding" || value === "bridging") {
    return value;
  }

  if (value.includes("emerging") || value.includes("expanding") || value.includes("bridging")) {
    return "mixed";
  }

  if (value === "mixed") {
    return "mixed";
  }

  return "unknown";
}

function recordsForGrade(gradeSpan: GradeSpan) {
  return ELD_STANDARDS.filter((record) => record.gradeSpan === gradeSpan && record.isApplicable);
}

function proficiencyMatches(record: EldStandardRecord, proficiency: EldProficiency) {
  return (
    proficiency === "mixed" ||
    proficiency === "unknown" ||
    record.proficiencyLevel === proficiency ||
    record.proficiencyLevel === "mixed"
  );
}

function choosePartI(
  records: EldStandardRecord[],
  mode: EldMode,
  languageFunction: string,
  proficiency: EldProficiency
) {
  return (
    records.find(
      (record) =>
        record.part === "Part I" &&
        record.mode === mode &&
        record.languageFunction === languageFunction &&
        proficiencyMatches(record, proficiency)
    ) ??
    records.find(
      (record) =>
        record.part === "Part I" &&
        record.languageFunction === languageFunction &&
        proficiencyMatches(record, proficiency)
    ) ??
    records.find(
      (record) =>
        record.part === "Part I" && record.mode === mode && proficiencyMatches(record, proficiency)
    ) ??
    records.find((record) => record.part === "Part I" && proficiencyMatches(record, proficiency)) ??
    records.find((record) => record.part === "Part I")
  );
}

function choosePartII(
  records: EldStandardRecord[],
  languageFunction: string,
  pairedIds: string[],
  proficiency: EldProficiency
) {
  return (
    records.find((record) => record.part === "Part II" && pairedIds.includes(record.id)) ??
    records.find(
      (record) =>
        record.part === "Part II" &&
        record.languageFunction === languageFunction &&
        proficiencyMatches(record, proficiency)
    ) ??
    records.find((record) => record.part === "Part II" && proficiencyMatches(record, proficiency)) ??
    records.find((record) => record.part === "Part II")
  );
}

function choosePld(gradeSpan: GradeSpan, proficiency: EldProficiency, pairedIds: string[]) {
  const records = ELD_PLDS.filter((record) => record.gradeSpan === gradeSpan && record.isApplicable);

  return (
    records.find(
      (record) =>
        record.part === "PLD" &&
        pairedIds.includes(record.id) &&
        (record.proficiencyLevel === proficiency || record.proficiencyLevel === "mixed")
    ) ??
    records.find(
      (record) =>
        record.part === "PLD" &&
        (record.proficiencyLevel === proficiency || record.proficiencyLevel === "mixed")
    ) ??
    records.find((record) => record.part === "PLD")
  );
}

export function retrieveEldBundle({
  gradeSpan,
  proficiency,
  mode,
  languageFunction
}: {
  gradeSpan: GradeSpan;
  proficiency: EldProficiency;
  mode: EldMode;
  languageFunction: string;
}): EldBundle {
  const records = recordsForGrade(gradeSpan);
  const partI = choosePartI(records, mode, languageFunction, proficiency);

  if (!partI) {
    throw new Error(`No Part I CA ELD record found for grade span ${gradeSpan}.`);
  }

  const partII = choosePartII(records, languageFunction, partI.pairedStandards, proficiency);
  const pld = choosePld(gradeSpan, proficiency, partI.pairedStandards);

  if (!partII || !pld) {
    throw new Error(`Incomplete CA ELD bundle for ${partI.id}.`);
  }

  return {
    partI: [partI],
    partII: [partII],
    pld: [pld]
  };
}

export function flattenStandardsUsed(bundle: EldBundle): StandardUsed[] {
  return [...bundle.partI, ...bundle.partII, ...bundle.pld].map((record) => ({
    id: record.id,
    gradeSpan: record.gradeSpan,
    part: record.part,
    mode: record.mode,
    proficiencyLevel: record.proficiencyLevel,
    languageFunction: record.languageFunction,
    teacherFriendlySummary: record.teacherFriendlySummary,
    descriptor: record.descriptor,
    standardText: record.standardText,
    sourceName: record.sourceName,
    sourceUrl: record.sourceUrl
  }));
}
