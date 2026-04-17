import { MAX_INPUT_CHARACTERS } from "./safety";

export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
export const PDF_MAX_PAGES = 25;

export type LessonFileKind = "text" | "docx" | "pdf";

export type DocumentUploadErrorCode =
  | "unsupported_file"
  | "legacy_doc"
  | "file_too_large"
  | "unreadable_file"
  | "encrypted_pdf"
  | "pdf_too_many_pages"
  | "pdf_no_selectable_text"
  | "extracted_text_too_large"
  | "extracted_text_too_short";

export class DocumentUploadError extends Error {
  readonly code: DocumentUploadErrorCode;

  constructor(code: DocumentUploadErrorCode) {
    super(documentUploadMessageForCode(code));
    this.name = "DocumentUploadError";
    this.code = code;
  }
}

type FileLike = Pick<File, "name" | "size" | "type" | "arrayBuffer" | "text">;

type MammothModule = {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
};

type PdfTextItem = {
  str?: string;
};

type PdfPageProxy = {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
  destroy?(): Promise<void> | void;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy?(): Promise<void> | void;
};

type PdfJsModule = {
  GlobalWorkerOptions?: {
    workerSrc?: string;
  };
  getDocument(options: {
    data: Uint8Array;
    isEvalSupported: false;
    useWorkerFetch: false;
    stopAtErrors: false;
  }): PdfLoadingTask;
};

type ExtractDependencies = {
  mammoth?: MammothModule;
  pdfjs?: PdfJsModule;
};

const SUPPORTED_TEXT_EXTENSIONS = new Set(["txt", "md", "csv"]);

export function documentUploadMessageForCode(code: DocumentUploadErrorCode) {
  if (code === "legacy_doc") {
    return "Use a .docx file instead of .doc. Legacy Word files are not supported in this beta.";
  }

  if (code === "file_too_large") {
    return "This file is too large for the beta. Please upload a file under 10 MB.";
  }

  if (code === "encrypted_pdf") {
    return "This PDF appears to be password-protected or encrypted. Please paste the lesson text or use an unlocked PDF.";
  }

  if (code === "pdf_too_many_pages") {
    return `This PDF is too long for the beta. Please use a PDF with ${PDF_MAX_PAGES} pages or fewer.`;
  }

  if (code === "pdf_no_selectable_text") {
    return "This PDF does not appear to contain selectable lesson text. Please paste the lesson text or use a text-based PDF.";
  }

  if (code === "extracted_text_too_large") {
    return "The extracted lesson text is too long for the beta. Please shorten it and try again.";
  }

  if (code === "extracted_text_too_short") {
    return "This file did not contain enough lesson text to align. Please paste the lesson text and try again.";
  }

  if (code === "unreadable_file") {
    return "The file could not be read. Please paste the lesson text or try another file.";
  }

  return "Use a .txt, .md, .csv, .docx, or selectable-text .pdf file for this beta.";
}

function extensionFromName(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

export function getLessonFileKind(fileName: string): LessonFileKind | "legacy_doc" | "unsupported" {
  const extension = extensionFromName(fileName);

  if (SUPPORTED_TEXT_EXTENSIONS.has(extension)) {
    return "text";
  }

  if (extension === "docx") {
    return "docx";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  if (extension === "doc") {
    return "legacy_doc";
  }

  return "unsupported";
}

export function validateLessonFile(file: FileLike): LessonFileKind {
  const fileKind = getLessonFileKind(file.name);

  if (fileKind === "legacy_doc") {
    throw new DocumentUploadError("legacy_doc");
  }

  if (fileKind === "unsupported") {
    throw new DocumentUploadError("unsupported_file");
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new DocumentUploadError("file_too_large");
  }

  return fileKind;
}

export function normalizeExtractedLessonText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function validateExtractedLessonText(text: string) {
  if (text.length > MAX_INPUT_CHARACTERS) {
    throw new DocumentUploadError("extracted_text_too_large");
  }

  if (text.length < 20) {
    throw new DocumentUploadError("extracted_text_too_short");
  }
}

async function loadMammoth() {
  const module = (await import("mammoth/mammoth.browser")) as MammothModule | { default?: MammothModule };

  return "extractRawText" in module ? module : module.default;
}

async function loadPdfJs() {
  const pdfjs = (await import("pdfjs-dist/build/pdf.mjs")) as PdfJsModule;

  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
  }

  return pdfjs;
}

export async function extractTextFromDocxArrayBuffer(
  arrayBuffer: ArrayBuffer,
  mammothModule?: MammothModule
) {
  try {
    const mammoth = mammothModule ?? (await loadMammoth());
    const result = await mammoth?.extractRawText({ arrayBuffer });

    return normalizeExtractedLessonText(result?.value ?? "");
  } catch {
    throw new DocumentUploadError("unreadable_file");
  }
}

function isPdfPasswordError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";

  return /password|encrypt/i.test(`${name} ${message}`);
}

export async function extractTextFromPdfArrayBuffer(arrayBuffer: ArrayBuffer, pdfjsModule?: PdfJsModule) {
  const pdfjs = pdfjsModule ?? (await loadPdfJs());
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false,
    useWorkerFetch: false,
    stopAtErrors: false
  });

  let pdf: PdfDocumentProxy | undefined;

  try {
    pdf = await loadingTask.promise;

    if (pdf.numPages > PDF_MAX_PAGES) {
      throw new DocumentUploadError("pdf_too_many_pages");
    }

    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        pageTexts.push(pageText);
      }
    }

    const text = normalizeExtractedLessonText(pageTexts.join("\n\n"));

    if (!text) {
      throw new DocumentUploadError("pdf_no_selectable_text");
    }

    return text;
  } catch (error) {
    if (error instanceof DocumentUploadError) {
      throw error;
    }

    if (isPdfPasswordError(error)) {
      throw new DocumentUploadError("encrypted_pdf");
    }

    throw new DocumentUploadError("unreadable_file");
  } finally {
    await pdf?.destroy?.();
    await loadingTask.destroy?.();
  }
}

export async function extractTextFromLessonFile(file: FileLike, dependencies: ExtractDependencies = {}) {
  const fileKind = validateLessonFile(file);
  let text = "";

  if (fileKind === "text") {
    text = normalizeExtractedLessonText(await file.text());
  }

  if (fileKind === "docx") {
    text = await extractTextFromDocxArrayBuffer(await file.arrayBuffer(), dependencies.mammoth);
  }

  if (fileKind === "pdf") {
    text = await extractTextFromPdfArrayBuffer(await file.arrayBuffer(), dependencies.pdfjs);
  }

  validateExtractedLessonText(text);

  return text;
}
