import type { AlignmentErrorCode, SafetyCheck, StandardUsed } from "./types";

export type SafetyFinding = {
  category: string;
  label: string;
  severity: "medium" | "high";
};

export type SafetyScanResult = {
  blocked: boolean;
  findings: SafetyFinding[];
};

type PatternRule = {
  category: string;
  label: string;
  severity: "medium" | "high";
  pattern: RegExp;
};

const STUDENT_RECORD_TERMS =
  "(?:IEP|iep|504|ELPAC|Elpac|elpac|score|Score|gradebook|Gradebook|reading\\s*level|Reading\\s*level|discipline|Discipline|behavior|Behavior|health|Health|accommodation|Accommodation)";

const PII_RULES: PatternRule[] = [
  {
    category: "student_id",
    label: "student ID or SSID",
    severity: "high",
    pattern: /\b(student\s*(id|number)|ssid|local\s*id|state\s*id)\b\s*[:#-]?\s*[A-Za-z0-9-]{3,}/i
  },
  {
    category: "date_of_birth",
    label: "date of birth",
    severity: "high",
    pattern: /\b(date\s*of\s*birth|dob)\b\s*[:#-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
  },
  {
    category: "ssn",
    label: "social security number",
    severity: "high",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/
  },
  {
    category: "contact",
    label: "student or family email",
    severity: "medium",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  },
  {
    category: "contact",
    label: "student or family phone number",
    severity: "medium",
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/
  },
  {
    category: "address",
    label: "home address",
    severity: "medium",
    pattern: /\b\d{2,6}\s+[A-Z][A-Za-z0-9.'-]*(?:\s+[A-Z][A-Za-z0-9.'-]*){0,4}\s+(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Court|Ct\.?)\b/i
  },
  {
    category: "student_record",
    label: "named student record",
    severity: "high",
    pattern: new RegExp(
      `\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b.{0,60}\\b${STUDENT_RECORD_TERMS}\\b`
    )
  },
  {
    category: "student_record",
    label: "named student record",
    severity: "high",
    pattern: new RegExp(
      `\\b${STUDENT_RECORD_TERMS}\\b.{0,60}\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2}\\b`
    )
  },
  {
    category: "roster",
    label: "class roster or gradebook",
    severity: "medium",
    pattern: /\b(roster|gradebook|student\s*list|class\s*list)\b/i
  },
  {
    category: "roster",
    label: "student table with private columns",
    severity: "medium",
    pattern: /\b(student\s*name|name)\b\s*[,|\t].{0,80}\b(score|IEP|504|ELPAC|DOB|SSID|student\s*id|reading\s*level)\b/i
  },
  {
    category: "family_identifier",
    label: "parent or guardian identifier",
    severity: "medium",
    pattern: /\b(parent|guardian|mother|father|caregiver)\b.{0,40}\b(email|phone|address|contact|name)\b/i
  }
];

const PROMPT_INJECTION_RULES: PatternRule[] = [
  {
    category: "instruction_override",
    label: "instruction override",
    severity: "high",
    pattern: /\b(ignore|forget|disregard|override)\b.{0,40}\b(previous|above|prior|system|developer)\b.{0,30}\b(instruction|prompt|message|rule)s?\b/i
  },
  {
    category: "prompt_exfiltration",
    label: "prompt exfiltration request",
    severity: "high",
    pattern: /\b(reveal|show|print|display|output|leak)\b.{0,50}\b(system\s*prompt|developer\s*message|hidden\s*instruction|internal\s*policy|secret)\b/i
  },
  {
    category: "tool_hijack",
    label: "tool hijack request",
    severity: "high",
    pattern: /\b(call|invoke|use|run)\b.{0,30}\b(tool|function|api|retrieval|database|browser|shell|terminal)\b/i
  },
  {
    category: "role_hijack",
    label: "role hijack request",
    severity: "medium",
    pattern: /\b(you are now|act as|switch roles|new role|developer mode|jailbreak|DAN)\b/i
  },
  {
    category: "hidden_instruction",
    label: "hidden or embedded instruction",
    severity: "high",
    pattern: /<!--[\s\S]{0,500}-->|<script\b|<iframe\b|display\s*:\s*none|white-space\s*:\s*pre|hidden\s*prompt/i
  },
  {
    category: "encoded_payload",
    label: "encoded instruction payload",
    severity: "medium",
    pattern: /\b(base64|rot13|decode\s+this|encoded\s+instruction)\b|[A-Za-z0-9+/]{120,}={0,2}/i
  }
];

const OUTPUT_RISK_PATTERNS = [
  /\bsystem\s*prompt\b/i,
  /\bdeveloper\s*message\b/i,
  /\bhidden\s*instruction/i,
  /\bapi[_-]?key\b/i,
  /\bhttps?:\/\/\S+/i
];

export const SAFE_PII_MESSAGE =
  "This looks like it may include student-identifiable information. Please remove names, IDs, scores, IEP/504 details, or private student information and try again.";

export const SAFE_PROMPT_INJECTION_MESSAGE =
  "This looks like it may include instructions meant to override the alignment system. Please remove those instructions and try again.";

export const MAX_INPUT_CHARACTERS = 15000;

function uniqueFindings(findings: SafetyFinding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.category}:${finding.label}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function scanWithRules(text: string, rules: PatternRule[]): SafetyScanResult {
  const findings = uniqueFindings(
    rules
      .filter((rule) => rule.pattern.test(text))
      .map((rule) => ({
        category: rule.category,
        label: rule.label,
        severity: rule.severity
      }))
  );

  return {
    blocked: findings.some((finding) => finding.severity === "high" || finding.severity === "medium"),
    findings
  };
}

export function scanForPii(text: string): SafetyScanResult {
  return scanWithRules(text, PII_RULES);
}

export function scanForPromptInjection(text: string): SafetyScanResult {
  return scanWithRules(text, PROMPT_INJECTION_RULES);
}

export function scanInputSafety(text: string): {
  blockedCode?: AlignmentErrorCode;
  checks: SafetyCheck[];
  categories: string[];
} {
  const pii = scanForPii(text);
  const promptInjection = scanForPromptInjection(text);

  const checks: SafetyCheck[] = [
    {
      id: "pii_input",
      label: "No student-identifiable data",
      passed: !pii.blocked,
      detail: pii.blocked
        ? "Potential student-identifiable data was detected and blocked before alignment."
        : "No common student-identifiable data patterns were detected.",
      categories: pii.findings.map((finding) => finding.category)
    },
    {
      id: "prompt_injection_input",
      label: "No prompt injection",
      passed: !promptInjection.blocked,
      detail: promptInjection.blocked
        ? "Instruction-like content that could override the alignment system was detected and blocked."
        : "No common prompt-injection patterns were detected.",
      categories: promptInjection.findings.map((finding) => finding.category)
    }
  ];

  return {
    blockedCode: pii.blocked
      ? "PII_DETECTED"
      : promptInjection.blocked
        ? "PROMPT_INJECTION_DETECTED"
        : undefined,
    checks,
    categories: [
      ...new Set([...pii.findings, ...promptInjection.findings].map((finding) => finding.category))
    ]
  };
}

function extractStandardIds(text: string) {
  return [...text.matchAll(/\bELD\.P(?:I|II)\.[A-Za-z0-9.-]+\b/g)].map((match) =>
    match[0].replace(/[.,;:]+$/g, "")
  );
}

export function evaluateOutputSafety({
  alignedText,
  briefAlignmentNotes,
  additionalOutputText = [],
  standardsUsed,
  allowedStandardIds,
  schemaValid,
  formatPreserved,
  noFullRewrite
}: {
  alignedText: string;
  briefAlignmentNotes: string[];
  additionalOutputText?: string[];
  standardsUsed: StandardUsed[];
  allowedStandardIds: string[];
  schemaValid: boolean;
  formatPreserved: boolean;
  noFullRewrite: boolean;
}): SafetyCheck[] {
  const combinedOutput = [alignedText, ...briefAlignmentNotes, ...additionalOutputText].join("\n");
  const outputPii = scanForPii(combinedOutput);
  const riskyOutput = OUTPUT_RISK_PATTERNS.some((pattern) => pattern.test(combinedOutput));
  const allowedIds = new Set(allowedStandardIds);
  const usedIds = new Set(standardsUsed.map((standard) => standard.id));
  const citedIds = extractStandardIds(combinedOutput);
  const inventedIds = citedIds.filter((id) => !allowedIds.has(id) && !usedIds.has(id));

  return [
    {
      id: "output_schema",
      label: "Structured output",
      passed: schemaValid,
      detail: "Alignment response matches the expected structured contract."
    },
    {
      id: "standards_allowlist",
      label: "Standards allowlist",
      passed: inventedIds.length === 0,
      detail:
        inventedIds.length === 0
          ? "All standard IDs in the output come from retrieved records."
          : "The output referenced a standard ID outside the retrieved records."
    },
    {
      id: "format_preserved",
      label: "Format preserved",
      passed: formatPreserved,
      detail: "The aligned output keeps the submitted lesson structure recognizable."
    },
    {
      id: "no_full_rewrite",
      label: "No full rewrite",
      passed: noFullRewrite,
      detail: "The aligned output stays within the targeted-edit length budget."
    },
    {
      id: "output_dlp",
      label: "Output data loss prevention",
      passed: !outputPii.blocked && !riskyOutput,
      detail:
        outputPii.blocked || riskyOutput
          ? "The output may contain sensitive information, prompt leakage, or unsafe external links."
          : "No common sensitive-output or prompt-leakage patterns were detected.",
      categories: outputPii.findings.map((finding) => finding.category)
    }
  ];
}

export function safetyMessageForCode(code: AlignmentErrorCode) {
  if (code === "PII_DETECTED") {
    return SAFE_PII_MESSAGE;
  }

  if (code === "PROMPT_INJECTION_DETECTED") {
    return SAFE_PROMPT_INJECTION_MESSAGE;
  }

  if (code === "INPUT_TOO_LARGE") {
    return "This lesson is too long for the beta. Please shorten it and try again.";
  }

  if (code === "UNSUPPORTED_FILE_TEXT") {
    return "Use a .txt, .md, or .csv file for this beta. PDF, DOCX, and OCR uploads are not enabled yet.";
  }

  if (code === "MODEL_CONFIG_MISSING") {
    return "Alignment is not configured yet. Please try again after the beta setup is complete.";
  }

  return "Alignment failed safely. Please revise the input and try again.";
}
