import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  DocumentUploadError,
  extractTextFromDocxArrayBuffer,
  extractTextFromLessonFile,
  extractTextFromPdfArrayBuffer,
  getLessonFileKind,
  MAX_UPLOAD_FILE_BYTES,
  PDF_MAX_PAGES
} from "../lib/eld/document-upload";
import { MAX_INPUT_CHARACTERS, scanInputSafety } from "../lib/eld/safety";

function assertDocumentUploadError(error: unknown, code: string) {
  assert.ok(error instanceof DocumentUploadError);
  assert.equal(error.code, code);
}

function fileLike({
  name,
  size = 100,
  text = "Objective\nStudents explain the central idea with evidence.",
  arrayBuffer = new ArrayBuffer(0),
  type = ""
}: {
  name: string;
  size?: number;
  text?: string;
  arrayBuffer?: ArrayBuffer;
  type?: string;
}) {
  return {
    name,
    size,
    type,
    text: async () => text,
    arrayBuffer: async () => arrayBuffer
  };
}

function xmlEscape(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function createDocxFixture(paragraphs: string[]) {
  const zip = new JSZip();
  const paragraphXml = paragraphs
    .map((paragraph) => `<w:p><w:r><w:t>${xmlEscape(paragraph)}</w:t></w:r></w:p>`)
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphXml}<w:sectPr/></w:body>
</w:document>`
  );
  zip.folder("word")?.folder("_rels")?.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  );

  return zip.generateAsync({ type: "arraybuffer" });
}

function fakePdfModule({
  pages,
  rejectWith
}: {
  pages?: string[][];
  rejectWith?: Error;
}) {
  return {
    getDocument: () => ({
      promise: rejectWith
        ? Promise.reject(rejectWith)
        : Promise.resolve({
            numPages: pages?.length ?? 0,
            getPage: async (pageNumber: number) => ({
              getTextContent: async () => ({
                items: (pages?.[pageNumber - 1] ?? []).map((str) => ({ str }))
              })
            }),
            destroy: async () => undefined
          }),
      destroy: async () => undefined
    })
  };
}

test("lesson file kind supports text, DOCX, and PDF while rejecting legacy DOC", () => {
  assert.equal(getLessonFileKind("lesson.txt"), "text");
  assert.equal(getLessonFileKind("lesson.md"), "text");
  assert.equal(getLessonFileKind("lesson.csv"), "text");
  assert.equal(getLessonFileKind("lesson.docx"), "docx");
  assert.equal(getLessonFileKind("lesson.pdf"), "pdf");
  assert.equal(getLessonFileKind("lesson.doc"), "legacy_doc");
  assert.equal(getLessonFileKind("lesson.png"), "unsupported");
});

test("plain text uploads still extract text", async () => {
  const text = await extractTextFromLessonFile(
    fileLike({
      name: "lesson.txt",
      text: "Objective\r\nStudents explain the central idea with evidence."
    })
  );

  assert.equal(text, "Objective\nStudents explain the central idea with evidence.");
});

test("unsupported, legacy, and oversized files are rejected before parsing", async () => {
  await assert.rejects(
    () => extractTextFromLessonFile(fileLike({ name: "lesson.png" })),
    (error) => {
      assertDocumentUploadError(error, "unsupported_file");
      return true;
    }
  );
  await assert.rejects(
    () => extractTextFromLessonFile(fileLike({ name: "lesson.doc" })),
    (error) => {
      assertDocumentUploadError(error, "legacy_doc");
      return true;
    }
  );
  await assert.rejects(
    () =>
      extractTextFromLessonFile(
        fileLike({
          name: "lesson.txt",
          size: MAX_UPLOAD_FILE_BYTES + 1
        })
      ),
    (error) => {
      assertDocumentUploadError(error, "file_too_large");
      return true;
    }
  );
});

test("extracted text length is checked before alignment", async () => {
  await assert.rejects(
    () =>
      extractTextFromLessonFile(
        fileLike({
          name: "lesson.txt",
          text: "A".repeat(MAX_INPUT_CHARACTERS + 1)
        })
      ),
    (error) => {
      assertDocumentUploadError(error, "extracted_text_too_large");
      return true;
    }
  );
});

test("DOCX uploads extract lesson paragraphs and then use existing safety scans", async () => {
  const arrayBuffer = await createDocxFixture([
    "Objective",
    "Students explain the central idea with evidence.",
    "Activity",
    "Students discuss which detail is strongest and why."
  ]);
  const text = await extractTextFromDocxArrayBuffer(arrayBuffer);

  assert.match(text, /Objective/);
  assert.match(text, /Students explain the central idea/);
  assert.match(text, /Activity/);
  assert.equal(scanInputSafety(text).blockedCode, undefined);

  const piiDocx = await createDocxFixture([
    "Objective",
    "Student ID 123456 will receive an accommodation."
  ]);
  const piiText = await extractTextFromDocxArrayBuffer(piiDocx);

  assert.equal(scanInputSafety(piiText).blockedCode, "PII_DETECTED");
});

test("PDF uploads extract selectable text from pages", async () => {
  const text = await extractTextFromPdfArrayBuffer(
    new ArrayBuffer(0),
    fakePdfModule({
      pages: [
        ["Objective", "Students explain the central idea."],
        ["Exit Ticket", "Students write one evidence sentence."]
      ]
    })
  );

  assert.match(text, /Objective Students explain the central idea/);
  assert.match(text, /Exit Ticket Students write one evidence sentence/);
});

test("PDF uploads reject scanned, encrypted, and too-long PDFs", async () => {
  await assert.rejects(
    () => extractTextFromPdfArrayBuffer(new ArrayBuffer(0), fakePdfModule({ pages: [[]] })),
    (error) => {
      assertDocumentUploadError(error, "pdf_no_selectable_text");
      return true;
    }
  );

  const passwordError = Object.assign(new Error("Password required"), {
    name: "PasswordException"
  });
  await assert.rejects(
    () =>
      extractTextFromPdfArrayBuffer(
        new ArrayBuffer(0),
        fakePdfModule({
          rejectWith: passwordError
        })
      ),
    (error) => {
      assertDocumentUploadError(error, "encrypted_pdf");
      return true;
    }
  );

  await assert.rejects(
    () =>
      extractTextFromPdfArrayBuffer(
        new ArrayBuffer(0),
        fakePdfModule({
          pages: Array.from({ length: PDF_MAX_PAGES + 1 }, () => ["Objective"])
        })
      ),
    (error) => {
      assertDocumentUploadError(error, "pdf_too_many_pages");
      return true;
    }
  );
});
