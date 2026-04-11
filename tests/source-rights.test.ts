import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import standards from "../data/ca-eld/standards.json";

function walkFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      return walkFiles(path);
    }

    return [path];
  });
}

test("official CA ELD standards import preserves required source metadata", () => {
  const records = standards;
  const partICount = records.filter((record) => record.part === "Part I").length;
  const partIICount = records.filter((record) => record.part === "Part II").length;

  assert.equal(partICount, 507);
  assert.equal(partIICount, 264);

  for (const record of records) {
    assert.ok(record.id);
    assert.ok(record.standardText);
    assert.equal(record.descriptor, record.standardText);
    assert.ok(record.teacherFriendlySummary);
    assert.ok(record.sourceName);
    assert.ok(record.sourceUrl.startsWith("https://www2.cde.ca.gov/cacs/eld"));
    assert.equal(record.copyrightOwner, "California Department of Education");
    assert.ok(record.importedAt);
  }
});

test("CDE attribution appears in the teacher-facing app", () => {
  const page = readFileSync("app/page.tsx", "utf8");

  assert.ok(page.includes("This free beta uses California English Language Development Standards"));
  assert.ok(/not affiliated with,\s*sponsored by,\s*or endorsed\s*by CDE/.test(page));
});

test("app does not include CDE logo or seal assets", () => {
  const appFiles = walkFiles("app").filter((path) => /\.(tsx|ts|css|svg|png|jpg|jpeg|webp)$/i.test(path));
  const combined = appFiles.map((path) => readFileSync(path, "utf8")).join("\n");

  assert.equal(/cdeLogo|CDE logo|CDE seal|California Department of Education Logo/i.test(combined), false);
});
