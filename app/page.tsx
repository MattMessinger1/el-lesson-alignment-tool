"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  MAX_INPUT_CHARACTERS,
  safetyMessageForCode,
  scanInputSafety
} from "../lib/eld/safety";
import type { AlignmentErrorCode, ChangeNote, SafetyCheck } from "../lib/eld/types";

const sampleLesson = `Objective
Students will identify the central idea of an informational text and explain how details support it.

Warm-Up
Students respond: What makes a detail important?

Activity
1. Read the article in pairs.
2. Highlight details that connect to the central idea.
3. Discuss which detail is strongest and why.

Exit Ticket
Write one sentence naming the central idea and one supporting detail.`;

type AlignmentResponse = {
  alignedText?: string;
  briefAlignmentNotes?: string[];
  standardsUsed?: Array<{
    id: string;
    part: string;
    teacherFriendlySummary: string;
  }>;
  qualityChecks?: Array<{
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }>;
  safetyChecks?: SafetyCheck[];
  changeNotes?: ChangeNote[];
  traceId?: string;
  alignmentMode?: "deterministic" | "llm";
  error?: string;
  code?: AlignmentErrorCode;
  categories?: string[];
};

function WandIcon() {
  return (
    <svg className="buttonIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 4.5 19.5 9.5M3.8 20.2 17.9 6.1a1.8 1.8 0 0 1 2.5 2.5L6.3 22.7H3.8v-2.5ZM5 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm13 10 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="buttonIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 8h10v12H8zM6 16H4V4h12v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="buttonIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12a8 8 0 1 0 2.34-5.66L4 8.68M4 4v4.68h4.68"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="buttonIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 16V4m0 0 4 4m-4-4L8 8M5 16v3h14v-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function Home() {
  const [lessonText, setLessonText] = useState(sampleLesson);
  const [gradeBand, setGradeBand] = useState("3-5");
  const [proficiency, setProficiency] = useState("mixed");
  const [lessonGoal, setLessonGoal] = useState("central idea and supporting details");
  const [contentArea, setContentArea] = useState("ELA");
  const [teacherNote, setTeacherNote] = useState("");
  const [alignedText, setAlignedText] = useState("");
  const [briefAlignmentNotes, setBriefAlignmentNotes] = useState<string[]>([]);
  const [standardsUsed, setStandardsUsed] = useState<NonNullable<AlignmentResponse["standardsUsed"]>>([]);
  const [qualityChecks, setQualityChecks] = useState<NonNullable<AlignmentResponse["qualityChecks"]>>([]);
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>([]);
  const [changeNotes, setChangeNotes] = useState<ChangeNote[]>([]);
  const [alignmentMode, setAlignmentMode] = useState<AlignmentResponse["alignmentMode"]>();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  const canAlign = useMemo(
    () => lessonText.trim().length >= 20 && gradeBand.trim().length > 0 && !isLoading,
    [gradeBand, isLoading, lessonText]
  );
  const allSafetyChecksPass = safetyChecks.length === 0 || safetyChecks.every((check) => check.passed);

  async function handleAlign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setCopyLabel("Copy");
    setSafetyChecks([]);

    if (lessonText.length > MAX_INPUT_CHARACTERS) {
      setError(safetyMessageForCode("INPUT_TOO_LARGE"));
      setIsLoading(false);
      return;
    }

    const clientSafety = scanInputSafety(
      [lessonText, lessonGoal, contentArea, teacherNote].join("\n")
    );

    if (clientSafety.blockedCode) {
      setError(safetyMessageForCode(clientSafety.blockedCode));
      setSafetyChecks(clientSafety.checks);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/align", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lessonText,
          gradeBand,
          proficiency,
          lessonGoal,
          contentArea,
          teacherNote
        })
      });
      const data = (await response.json()) as AlignmentResponse;

      if (!response.ok || data.error) {
        setSafetyChecks(data.safetyChecks ?? []);
        throw new Error(data.error || "Alignment failed.");
      }

      setAlignedText(data.alignedText ?? "");
      setBriefAlignmentNotes(data.briefAlignmentNotes ?? []);
      setStandardsUsed(data.standardsUsed ?? []);
      setQualityChecks(data.qualityChecks ?? []);
      setSafetyChecks(data.safetyChecks ?? []);
      setChangeNotes(data.changeNotes ?? []);
      setAlignmentMode(data.alignmentMode);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Alignment failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!alignedText || !allSafetyChecksPass) {
      return;
    }

    await navigator.clipboard.writeText(alignedText);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy"), 1600);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedExtensions = /\.(txt|md|csv)$/i;

    if (!allowedExtensions.test(file.name)) {
      setError(safetyMessageForCode("UNSUPPORTED_FILE_TEXT"));
      event.target.value = "";
      return;
    }

    const text = await file.text();
    setLessonText(text);
    setError("");
  }

  function handleReset() {
    setLessonText("");
    setLessonGoal("");
    setTeacherNote("");
    setAlignedText("");
    setBriefAlignmentNotes([]);
    setStandardsUsed([]);
    setQualityChecks([]);
    setSafetyChecks([]);
    setChangeNotes([]);
    setAlignmentMode(undefined);
    setError("");
    setCopyLabel("Copy");
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brand">
          <div className="brandMark">EL</div>
          <div className="brandText">
            <strong>EL Lesson Alignment Tool</strong>
            <span>v0.4 free beta</span>
          </div>
        </div>
        <div className="statusText">CA ELD alignment with privacy guardrails</div>
      </header>

      <div className="workspace">
        <section className="pane">
          <div className="panel">
            <div className="sectionHeader">
              <h1>Align a lesson</h1>
            </div>

            <form className="form" onSubmit={handleAlign}>
              <div className="field">
                <label htmlFor="lessonText">Lesson, unit, or task</label>
                <label className="fileButton" htmlFor="lessonFile">
                  <UploadIcon />
                  Upload text file
                </label>
                <input
                  className="fileInput"
                  id="lessonFile"
                  type="file"
                  accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
                  onChange={handleFile}
                />
                <textarea
                  id="lessonText"
                  value={lessonText}
                  onChange={(event) => setLessonText(event.target.value)}
                  placeholder="Paste the teacher-created lesson here."
                />
              </div>

              <div className="controlsGrid">
                <div className="field">
                  <label htmlFor="gradeBand">Grade band</label>
                  <select
                    id="gradeBand"
                    value={gradeBand}
                    onChange={(event) => setGradeBand(event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="K-2">K-2</option>
                    <option value="3-5">3-5</option>
                    <option value="6-8">6-8</option>
                    <option value="9-12">9-12</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="proficiency">ELD range</label>
                  <select
                    id="proficiency"
                    value={proficiency}
                    onChange={(event) => setProficiency(event.target.value)}
                  >
                    <option value="mixed">Mixed</option>
                    <option value="emerging">Emerging</option>
                    <option value="expanding">Expanding</option>
                    <option value="bridging">Bridging</option>
                    <option value="unknown">Not sure</option>
                  </select>
                </div>
              </div>

              {error ? <div className="error">{error}</div> : null}

              <div className="actions">
                <button className="primaryButton" type="submit" disabled={!canAlign}>
                  <WandIcon />
                  {isLoading ? "Aligning" : "Align to CA ELD"}
                </button>
                <button className="secondaryButton" type="button" onClick={handleReset}>
                  <ResetIcon />
                  Clear
                </button>
              </div>

              <div className="controlsGrid">
                <div className="field">
                  <label htmlFor="lessonGoal">Lesson goal</label>
                  <input
                    id="lessonGoal"
                    value={lessonGoal}
                    onChange={(event) => setLessonGoal(event.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="field">
                  <label htmlFor="contentArea">Content area</label>
                  <input
                    id="contentArea"
                    value={contentArea}
                    onChange={(event) => setContentArea(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="teacherNote">Teacher note</label>
                <input
                  id="teacherNote"
                  value={teacherNote}
                  onChange={(event) => setTeacherNote(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </form>
          </div>

          <div className="footerBand">
            <div className="miniCard">
              <strong>Format</strong>
              <span>Headings, sequence, bullets, and tables stay recognizable.</span>
            </div>
            <div className="miniCard">
              <strong>Alignment</strong>
              <span>Language goals, prompts, and supports are added where they fit.</span>
            </div>
            <div className="miniCard">
              <strong>Privacy</strong>
              <span>PII-like input is blocked before alignment and nothing is saved by default.</span>
            </div>
          </div>
        </section>

        <section className="pane">
          <div className="panel outputPanel">
            <div className="sectionHeader">
              <h2>Aligned output</h2>
              <div className="outputToolbar">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={handleCopy}
                  disabled={!alignedText || !allSafetyChecksPass}
                >
                  <CopyIcon />
                  {copyLabel}
                </button>
              </div>
            </div>
            <div className="outputBody">
              <div className={alignedText ? "outputBox" : "outputBox placeholder"}>
                {alignedText ||
                  "The aligned lesson will keep the submitted format and add CA ELD language support directly into the material."}
              </div>

              {briefAlignmentNotes.length ||
              standardsUsed.length ||
              changeNotes.length ||
              qualityChecks.length ||
              safetyChecks.length ? (
                <div className="evidenceGrid" aria-label="Alignment evidence">
                  <section className="evidencePanel">
                    <h3>Brief Alignment Notes</h3>
                    <ul>
                      {briefAlignmentNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="evidencePanel">
                    <h3>Change Notes</h3>
                    <ul>
                      {changeNotes.map((note) => (
                        <li key={`${note.anchor}-${note.note}`}>
                          <strong>{note.changeType.replace("_", " ")}</strong>
                          <span>{note.note}</span>
                        </li>
                      ))}
                      {alignmentMode ? (
                        <li>
                          <strong>Mode</strong>
                          <span>{alignmentMode === "llm" ? "LLM alignment with traced review" : "Deterministic local alignment"}</span>
                        </li>
                      ) : null}
                    </ul>
                  </section>

                  <section className="evidencePanel">
                    <h3>Standards Used</h3>
                    <ul>
                      {standardsUsed.map((standard) => (
                        <li key={standard.id}>
                          <strong>{standard.id}</strong>
                          <span>{standard.teacherFriendlySummary}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="evidencePanel">
                    <h3>Quality Checks</h3>
                    <ul>
                      {qualityChecks.map((check) => (
                        <li key={check.id}>
                          <strong>{check.passed ? "Pass" : "Review"}: {check.label}</strong>
                          <span>{check.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="evidencePanel">
                    <h3>Safety Checks</h3>
                    <ul>
                      {safetyChecks.map((check) => (
                        <li key={check.id}>
                          <strong>{check.passed ? "Pass" : "Review"}: {check.label}</strong>
                          <span>{check.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : null}
            </div>
          </div>

          <div className="noteStrip">
            <span aria-hidden="true">●</span>
            <span>
              Student-identifiable data should not be pasted into the tool. Use lesson
              materials without student names, IDs, or private student details.
            </span>
          </div>
          <div className="sourceStrip">
            This free beta uses California English Language Development Standards published
            by the California Department of Education and adopted by the California State
            Board of Education. This tool is not affiliated with, sponsored by, or endorsed
            by CDE.
          </div>
        </section>
      </div>
    </main>
  );
}
