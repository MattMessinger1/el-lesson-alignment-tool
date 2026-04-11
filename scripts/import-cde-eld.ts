import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

type CsvRow = Record<string, string>;

const IMPORTED_AT = "2026-04-11";
const COPYRIGHT_OWNER = "California Department of Education";
const SOURCE_NAME = "California Department of Education CA Content Standards";
const PART_I_URL = "https://www2.cde.ca.gov/cacs/eld?c0=1&page=0&perpage=100";
const PART_II_URL = "https://www2.cde.ca.gov/cacs/eld?c0=2&page=0&perpage=100";

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function csvToObjects(csv: string): CsvRow[] {
  const [headerRow, ...dataRows] = parseCsv(csv);
  const headers = headerRow.map((header) => header.trim());

  return dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]))
  );
}

function gradeSpan(minGrade: number, maxGrade: number) {
  const midpoint = Math.round((minGrade + maxGrade) / 2);

  if (midpoint <= 2) {
    return "K-2";
  }

  if (midpoint <= 5) {
    return "3-5";
  }

  if (midpoint <= 8) {
    return "6-8";
  }

  return "9-12";
}

function normalizeProficiency(value: string) {
  const lower = value.toLowerCase();

  if (lower.startsWith("emerg")) {
    return "emerging";
  }

  if (lower.startsWith("expand")) {
    return "expanding";
  }

  if (lower.startsWith("bridg")) {
    return "bridging";
  }

  return "unknown";
}

function inferMode(cluster: string, part: string) {
  if (part === "Part II") {
    return "language_resources";
  }

  const lower = cluster.toLowerCase();

  if (lower.includes("collaborative")) {
    return "collaborative";
  }

  if (lower.includes("interpretive")) {
    return "interpretive";
  }

  return "productive";
}

function inferLanguageFunction(contentStrand: string, cluster: string) {
  const lower = `${contentStrand} ${cluster}`.toLowerCase();

  if (/(justify|argu|opinion|persuad|supporting)/.test(lower)) {
    return "justify_reasoning";
  }

  if (/(reading|viewing|analyz|evaluat|understanding|verbs|nouns|modifying|condensing)/.test(lower)) {
    return "describe_observations";
  }

  return "explain_with_evidence";
}

function languageResourcesFor(contentStrand: string, cluster: string) {
  const lower = `${contentStrand} ${cluster}`.toLowerCase();

  if (lower.includes("cohesion") || lower.includes("connecting")) {
    return ["connecting words", "cohesive devices", "relationship language"];
  }

  if (lower.includes("nouns") || lower.includes("verbs") || lower.includes("modifying")) {
    return ["precise vocabulary", "expanded phrases", "sentence expansion"];
  }

  if (lower.includes("argu") || lower.includes("opinion") || lower.includes("supporting")) {
    return ["claim language", "reasons", "evidence phrases"];
  }

  if (lower.includes("collaborative") || lower.includes("exchanging")) {
    return ["discussion stems", "turn-taking", "clarifying questions"];
  }

  return ["academic vocabulary", "evidence language", "elaboration prompts"];
}

function cleanDescription(description: string) {
  return description.replace(/^Standard:\s*/i, "").trim();
}

async function fetchCsv(url: string) {
  const response = await fetch(`${url}&dl=1`);

  if (!response.ok && response.status !== 404) {
    throw new Error(`CDE export failed with ${response.status}: ${url}`);
  }

  return response.text();
}

async function main() {
  const rows = [
    ...(await fetchCsv(PART_I_URL).then(csvToObjects)),
    ...(await fetchCsv(PART_II_URL).then(csvToObjects))
  ];

  const records = rows.map((row) => {
    const standardText = cleanDescription(row.Description ?? "");
    const part = row["Critical Principle"]?.startsWith("Part II") ? "Part II" : "Part I";
    const minGrade = Number(row["Min Grade"] ?? 0);
    const maxGrade = Number(row["Max Grade"] ?? minGrade);
    const sourceUrl = part === "Part I" ? PART_I_URL : PART_II_URL;

    return {
      id: row["Standard Identifier"],
      gradeRange: row["Grade Range"],
      minGrade,
      maxGrade,
      gradeSpan: gradeSpan(minGrade, maxGrade),
      part,
      mode: inferMode(row.Cluster ?? "", part),
      proficiencyLevel: normalizeProficiency(row["Proficiency Level"] ?? ""),
      descriptor: standardText,
      standardText,
      cluster: row.Cluster,
      contentStrand: row["Content Strand"],
      languageFunction: inferLanguageFunction(row["Content Strand"] ?? "", row.Cluster ?? ""),
      languageResources: languageResourcesFor(row["Content Strand"] ?? "", row.Cluster ?? ""),
      teacherFriendlySummary: `${row["Content Strand"]}: ${standardText}`,
      pairedStandards: [],
      sourceName: SOURCE_NAME,
      sourceUrl,
      copyrightOwner: COPYRIGHT_OWNER,
      importedAt: IMPORTED_AT,
      isApplicable: !/^No standard for kindergarten\.$/i.test(standardText),
      reviewStatus: "official_cde_import"
    };
  });

  const outputPath = "data/ca-eld/standards.json";
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  const partICount = records.filter((record) => record.part === "Part I").length;
  const partIICount = records.filter((record) => record.part === "Part II").length;
  if (partICount !== 507 || partIICount !== 264) {
    throw new Error(`Unexpected CDE import counts: Part I=${partICount}; Part II=${partIICount}`);
  }

  console.log(`Imported ${records.length} CA ELD records from CDE.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
