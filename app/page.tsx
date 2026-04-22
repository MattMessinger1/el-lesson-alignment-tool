"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  MAX_INPUT_CHARACTERS,
  safetyMessageForCode,
  scanInputSafety
} from "../lib/eld/safety";
import {
  DocumentUploadError,
  documentUploadMessageForCode,
  extractTextFromLessonFile
} from "../lib/eld/document-upload";
import type {
  AlignmentErrorCode,
  AlignmentResponse,
  SafetyCheck,
  VisualPacketImage,
  VisualPacketResponse
} from "../lib/eld/types";

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

const alignmentStages = [
  { label: "Analyzing lesson", thresholdMs: 0 },
  { label: "Aligning to CA ELD", thresholdMs: 3500 },
  { label: "Checking output", thresholdMs: 12000 },
  { label: "Designing teacher packet", thresholdMs: 18000 }
];

type AlignmentApiResponse = Partial<AlignmentResponse> & {
  error?: string;
  code?: AlignmentErrorCode;
  categories?: string[];
};

type ResultTab = "visual" | "lesson" | "rationale";

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="buttonIcon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function WandIcon() {
  return (
    <SvgIcon>
      <path
        d="M14.5 4.5 19.5 9.5M3.8 20.2 17.9 6.1a1.8 1.8 0 0 1 2.5 2.5L6.3 22.7H3.8v-2.5ZM5 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm13 10 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

function CopyIcon() {
  return (
    <SvgIcon>
      <path
        d="M8 8h10v12H8zM6 16H4V4h12v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

function DownloadIcon() {
  return (
    <SvgIcon>
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4M5 18v2h14v-2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

function ResetIcon() {
  return (
    <SvgIcon>
      <path
        d="M4 12a8 8 0 1 0 2.34-5.66L4 8.68M4 4v4.68h4.68"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

function UploadIcon() {
  return (
    <SvgIcon>
      <path
        d="M12 16V4m0 0 4 4m-4-4L8 8M5 16v3h14v-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

function imageSrc(image: VisualPacketImage) {
  return `data:image/png;base64,${image.b64Json}`;
}

function downloadImage(image: VisualPacketImage, title: string) {
  const link = document.createElement("a");
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  link.href = imageSrc(image);
  link.download = `${safeTitle || "el-lesson-alignment"}-visual-page-${image.pageNumber}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function Home() {
  const [lessonText, setLessonText] = useState(sampleLesson);
  const [gradeBand, setGradeBand] = useState("3-5");
  const [elpacLevels, setElpacLevels] = useState("1,3");
  const [proficiency, setProficiency] = useState("mixed");
  const [lessonGoal, setLessonGoal] = useState("central idea");
  const [contentArea, setContentArea] = useState("ELA");
  const [contentExpectations, setContentExpectations] = useState("");
  const [teacherNote, setTeacherNote] = useState("");
  const [alignment, setAlignment] = useState<AlignmentResponse | null>(null);
  const [visualPacketImages, setVisualPacketImages] = useState<VisualPacketImage[]>([]);
  const [visualPacketStatus, setVisualPacketStatus] = useState<VisualPacketResponse["visualPacketStatus"] | "idle">("idle");
  const [visualPacketError, setVisualPacketError] = useState("");
  const [visualPacketModel, setVisualPacketModel] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("visual");
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState("");
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [progressElapsedMs, setProgressElapsedMs] = useState(0);
  const [copyLabel, setCopyLabel] = useState("Copy lesson");
  const [runIdLabel, setRunIdLabel] = useState("Copy Run ID");

  const canAlign = useMemo(
    () =>
      lessonText.trim().length >= 20 &&
      gradeBand.trim().length > 0 &&
      contentArea.trim().length > 0 &&
      !isParsingFile &&
      !isLoading,
    [contentArea, gradeBand, isLoading, isParsingFile, lessonText]
  );
  const allSafetyChecksPass = safetyChecks.length === 0 || safetyChecks.every((check) => check.passed);
  const progressPercent = Math.min(96, Math.round((1 - Math.exp(-progressElapsedMs / 15000)) * 100));
  const progressStage =
    alignmentStages.findLast((stage) => progressElapsedMs >= stage.thresholdMs) ?? alignmentStages[0];
  const traceId = alignment?.traceId ?? "";
  const packetTitle = alignment?.lessonLanguageFocus.contentGoal || lessonGoal || "CA ELD Lesson Alignment";

  useEffect(() => {
    if (!isLoading || !loadingStartedAt) {
      return;
    }

    setProgressElapsedMs(Date.now() - loadingStartedAt);
    const interval = window.setInterval(() => {
      setProgressElapsedMs(Date.now() - loadingStartedAt);
    }, 500);

    return () => window.clearInterval(interval);
  }, [isLoading, loadingStartedAt]);

  async function requestVisualPacket(nextAlignment: AlignmentResponse) {
    setIsGeneratingPacket(true);
    setVisualPacketStatus("idle");
    setVisualPacketError("");
    setVisualPacketImages([]);

    try {
      const response = await fetch("/api/visual-packet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          alignment: nextAlignment,
          gradeBand,
          contentArea,
          lessonGoal
        })
      });
      const data = (await response.json()) as VisualPacketResponse;

      setVisualPacketStatus(data.visualPacketStatus);
      setVisualPacketImages(data.visualPacketImages ?? []);
      setVisualPacketModel(data.model);
      if (!response.ok || data.visualPacketStatus === "failed") {
        setVisualPacketError(data.error || "Visual packet generation failed. The aligned lesson is still ready.");
      }
    } catch (caughtError) {
      setVisualPacketStatus("failed");
      setVisualPacketError(
        caughtError instanceof Error
          ? caughtError.message
          : "Visual packet generation failed. The aligned lesson is still ready."
      );
    } finally {
      setIsGeneratingPacket(false);
    }
  }

  async function handleAlign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFileStatus("");
    setIsLoading(true);
    setLoadingStartedAt(Date.now());
    setProgressElapsedMs(0);
    setCopyLabel("Copy lesson");
    setRunIdLabel("Copy Run ID");
    setSafetyChecks([]);
    setAlignment(null);
    setVisualPacketImages([]);
    setVisualPacketStatus("idle");
    setVisualPacketError("");
    setActiveTab("visual");

    if (lessonText.length > MAX_INPUT_CHARACTERS) {
      setError(safetyMessageForCode("INPUT_TOO_LARGE"));
      setIsLoading(false);
      return;
    }

    const clientSafety = scanInputSafety(
      [lessonText, lessonGoal, contentArea, contentExpectations, teacherNote].join("\n")
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
          elpacLevels: elpacLevels.split(",").map((level) => level.trim()).filter(Boolean),
          proficiency,
          lessonGoal,
          contentArea,
          contentExpectations,
          teacherNote
        })
      });
      const data = (await response.json()) as AlignmentApiResponse;

      if (!response.ok || data.error || !data.alignedText) {
        setSafetyChecks(data.safetyChecks ?? []);
        throw new Error(data.error || "Alignment failed.");
      }

      const checkedAlignment = data as AlignmentResponse;
      setAlignment(checkedAlignment);
      setSafetyChecks(checkedAlignment.safetyChecks ?? []);
      void requestVisualPacket(checkedAlignment);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Alignment failed.");
    } finally {
      setIsLoading(false);
      setLoadingStartedAt(null);
    }
  }

  async function handleCopyLesson() {
    if (!alignment?.alignedText || !allSafetyChecksPass) {
      return;
    }

    await navigator.clipboard.writeText(alignment.alignedText);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy lesson"), 1600);
  }

  async function handleCopyRunId() {
    if (!traceId) {
      return;
    }

    await navigator.clipboard.writeText(traceId);
    setRunIdLabel("Copied");
    window.setTimeout(() => setRunIdLabel("Copy Run ID"), 1600);
  }

  async function handleRegenerateVisualPacket() {
    if (!alignment || isGeneratingPacket) {
      return;
    }

    await requestVisualPacket(alignment);
    setActiveTab("visual");
  }

  function handleDownloadPacket() {
    visualPacketImages.forEach((image) => downloadImage(image, packetTitle));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (isLoading) {
      event.target.value = "";
      return;
    }

    setError("");
    setFileStatus("Reading lesson file...");
    setIsParsingFile(true);

    try {
      const text = await extractTextFromLessonFile(file);
      setLessonText(text);
      setFileStatus("Lesson text extracted. Review it before aligning.");
    } catch (caughtError) {
      setFileStatus("");
      setError(
        caughtError instanceof DocumentUploadError
          ? documentUploadMessageForCode(caughtError.code)
          : documentUploadMessageForCode("unreadable_file")
      );
    } finally {
      setIsParsingFile(false);
      event.target.value = "";
    }
  }

  function handleReset() {
    setLessonText("");
    setLessonGoal("");
    setContentExpectations("");
    setTeacherNote("");
    setAlignment(null);
    setVisualPacketImages([]);
    setVisualPacketStatus("idle");
    setVisualPacketError("");
    setVisualPacketModel("");
    setActiveTab("visual");
    setSafetyChecks([]);
    setError("");
    setFileStatus("");
    setIsParsingFile(false);
    setLoadingStartedAt(null);
    setProgressElapsedMs(0);
    setCopyLabel("Copy lesson");
    setRunIdLabel("Copy Run ID");
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brand">
          <div className="brandMark">EL</div>
          <div className="brandText">
            <strong>EL Lesson Alignment Tool</strong>
            <span>CA K-12 academic language alignment</span>
          </div>
        </div>
        <div className="topBadges">
          <span>CA ELD Part I + II + PLD</span>
          <span>Teacher visual packet</span>
        </div>
      </header>

      <section className="heroBand">
        <div>
          <p className="eyebrow">Lesson-only beta for content teachers</p>
          <h1>Turn one lesson into a visual CA ELD alignment packet.</h1>
          <p>
            The tool analyzes what students are doing with language, identifies the language
            resources they need, and turns the checked alignment into a readable 1-2 page teacher packet.
          </p>
        </div>
        <div className="methodRail" aria-label="Alignment method">
          <span>1. Lesson task</span>
          <span>2. Language demand</span>
          <span>3. CA ELD rationale</span>
          <span>4. Visual packet</span>
        </div>
      </section>

      <div className="workspace">
        <section className="inputPane" aria-label="Lesson input">
          <div className="panel inputPanel">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Teacher input</p>
                <h2>Paste or upload one lesson</h2>
              </div>
              <label className="fileButton" htmlFor="lessonFile">
                <UploadIcon />
                {isParsingFile ? "Reading file" : "Upload file"}
              </label>
              <input
                className="fileInput"
                id="lessonFile"
                type="file"
                accept=".txt,.md,.csv,.docx,.pdf,text/plain,text/markdown,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                onChange={handleFile}
              />
            </div>

            <form className="form" onSubmit={handleAlign}>
              <div className="field">
                <label htmlFor="lessonText">Lesson text</label>
                <textarea
                  id="lessonText"
                  value={lessonText}
                  onChange={(event) => setLessonText(event.target.value)}
                  placeholder="Paste the teacher-created lesson here."
                />
              </div>

              <div className="controlsGrid">
                <div className="field">
                  <label htmlFor="gradeBand">Grade</label>
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
                  <label htmlFor="contentArea">Content area</label>
                  <input
                    id="contentArea"
                    value={contentArea}
                    onChange={(event) => setContentArea(event.target.value)}
                    placeholder="ELA, math, science..."
                  />
                </div>
              </div>

              <div className="controlsGrid">
                <div className="field">
                  <label htmlFor="proficiency">ELPAC focus</label>
                  <select
                    id="proficiency"
                    value={elpacLevels}
                    onChange={(event) => {
                      setElpacLevels(event.target.value);
                      setProficiency("mixed");
                    }}
                  >
                    <option value="1,3">Levels 1 and 3</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="lessonGoal">Lesson goal</label>
                  <input
                    id="lessonGoal"
                    value={lessonGoal}
                    onChange={(event) => setLessonGoal(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contentExpectations">Content expectations or standards</label>
                <textarea
                  className="smallTextarea"
                  id="contentExpectations"
                  value={contentExpectations}
                  onChange={(event) => setContentExpectations(event.target.value)}
                  placeholder="Optional: paste the standard, objective, or success criteria your curriculum expects."
                />
              </div>

              <div className="field">
                <label htmlFor="teacherNote">Teacher note</label>
                <input
                  id="teacherNote"
                  value={teacherNote}
                  onChange={(event) => setTeacherNote(event.target.value)}
                  placeholder="Optional: focus on discussion, writing, vocabulary..."
                />
              </div>

              {error ? <div className="error">{error}</div> : null}
              {fileStatus ? <div className="fileStatus">{fileStatus}</div> : null}

              {isLoading ? (
                <div className="progressPanel" aria-live="polite">
                  <div className="progressMeta">
                    <span>{progressStage.label}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div
                    className="progressTrack"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPercent}
                    aria-label="Alignment progress"
                  >
                    <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="actions">
                <button className="primaryButton" type="submit" disabled={!canAlign}>
                  <WandIcon />
                  {isLoading ? "Aligning" : "Align Lesson"}
                </button>
                <button className="secondaryButton" type="button" onClick={handleReset}>
                  <ResetIcon />
                  Clear
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="resultPane" aria-label="Alignment output">
          <div className="panel resultPanel">
            <div className="sectionHeader resultHeader">
              <div>
                <p className="eyebrow">Teacher output</p>
                <h2>Visual Packet</h2>
              </div>
              <div className="resultActions">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={handleCopyLesson}
                  disabled={!alignment?.alignedText || !allSafetyChecksPass}
                >
                  <CopyIcon />
                  {copyLabel}
                </button>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={handleDownloadPacket}
                  disabled={!visualPacketImages.length}
                >
                  <DownloadIcon />
                  Download visual packet
                </button>
              </div>
            </div>

            {traceId ? (
              <div className="runInfo" aria-live="polite">
                <span>Run ID</span>
                <code>{traceId}</code>
                <button className="textButton" type="button" onClick={handleCopyRunId}>
                  {runIdLabel}
                </button>
              </div>
            ) : null}

            <div className="tabList" role="tablist" aria-label="Output views">
              {[
                ["visual", "Visual Packet"],
                ["lesson", "Aligned Lesson"],
                ["rationale", "Rationale"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={activeTab === id ? "tabButton active" : "tabButton"}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => setActiveTab(id as ResultTab)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="resultBody">
              {activeTab === "visual" ? (
                <section className="visualPacketView" aria-label="Teacher visual packet">
                  {!alignment ? (
                    <div className="emptyState">
                      <strong>The generated packet will appear here.</strong>
                      <span>
                        It will visualize language demand, CA ELD rationale, ELPAC supports,
                        success criteria, and teacher moves after alignment passes safety checks.
                      </span>
                    </div>
                  ) : null}

                  {alignment ? (
                    <div className="packetNotice">
                      <strong>Review before classroom use.</strong>
                      <span>
                        Visual packet is generated from the checked alignment output. The aligned text remains the source of truth.
                      </span>
                    </div>
                  ) : null}

                  {isGeneratingPacket ? (
                    <div className="packetLoading" aria-live="polite">
                      <div className="loaderBar" />
                      <strong>Designing teacher packet</strong>
                      <span>Creating readable visual pages from the checked alignment, not the raw upload.</span>
                    </div>
                  ) : null}

                  {visualPacketStatus === "disabled" ? (
                    <div className="packetWarning">
                      Image generation is disabled in this environment. The aligned lesson and rationale are ready.
                    </div>
                  ) : null}

                  {visualPacketError ? <div className="packetWarning">{visualPacketError}</div> : null}

                  {visualPacketImages.length ? (
                    <>
                      <div className="packetMeta">
                        <span>Generated with {visualPacketModel || "image model"}</span>
                        <button
                          className="textButton"
                          type="button"
                          onClick={handleRegenerateVisualPacket}
                          disabled={isGeneratingPacket}
                        >
                          Regenerate visual packet
                        </button>
                      </div>
                      <div className="packetGrid">
                        {visualPacketImages.map((image) => (
                          <figure className="packetPage" key={image.pageNumber}>
                            <img src={imageSrc(image)} alt={image.altText} />
                            <figcaption>Page {image.pageNumber}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              ) : null}

              {activeTab === "lesson" ? (
                <section aria-label="Aligned lesson">
                  <div className={alignment?.alignedText ? "outputBox" : "outputBox placeholder"}>
                    {alignment?.alignedText ||
                      "The aligned lesson will keep the submitted format and add academic language support directly into the material."}
                  </div>
                </section>
              ) : null}

              {activeTab === "rationale" ? (
                <section className="rationaleView" aria-label="Alignment rationale">
                  {alignment?.lessonLanguageFocus ? (
                    <div className="languageDemandPanel">
                      <p className="eyebrow">What students do with language</p>
                      <h3>{alignment.lessonLanguageFocus.contentGoal}</h3>
                      <p>{alignment.lessonLanguageFocus.languageDemand}</p>
                      <strong>{alignment.lessonLanguageFocus.studentEvidence}</strong>
                    </div>
                  ) : (
                    <div className="emptyState">
                      <strong>Rationale will appear after alignment.</strong>
                      <span>Part I, Part II, and PLD will be shown together with visible rationale.</span>
                    </div>
                  )}

                  {alignment ? (
                    <div className="evidenceGrid" aria-label="Alignment evidence">
                      <section className="evidencePanel accentA">
                        <h3>Student Evidence</h3>
                        <ul>
                          {alignment.studentEvidence.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="evidencePanel accentB">
                        <h3>Academic Language</h3>
                        <ul>
                          <li>
                            <strong>Vocabulary</strong>
                            <span>{alignment.academicLanguageSupports.vocabulary.join(", ")}</span>
                          </li>
                          <li>
                            <strong>Functions</strong>
                            <span>{alignment.academicLanguageSupports.languageFunctions.join(", ")}</span>
                          </li>
                          <li>
                            <strong>Frames and stems</strong>
                            <span>
                              {[
                                ...alignment.academicLanguageSupports.sentenceFrames,
                                ...alignment.academicLanguageSupports.discussionOrWritingStems
                              ].join(" ")}
                            </span>
                          </li>
                        </ul>
                      </section>

                      <section className="evidencePanel accentC">
                        <h3>ELPAC Supports</h3>
                        <ul>
                          {alignment.elpacSupports.map((support) => (
                            <li key={support.level}>
                              <strong>Level {support.level}: {support.proficiencyBand}</strong>
                              <span>{support.cognitiveDemandNote}</span>
                              <span>{support.supports.join(" ")}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="evidencePanel accentD">
                        <h3>Success Criteria</h3>
                        <ul>
                          {alignment.studentFriendlySuccessCriteria.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="evidencePanel accentE">
                        <h3>Teacher Moves</h3>
                        <ul>
                          {alignment.teacherFeedbackMoves.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </section>

                      <section className="evidencePanel standardsPanel">
                        <h3>CA ELD Rationale</h3>
                        <div className="standardsStack">
                          {["Part I", "Part II", "PLD"].map((part) => {
                            const standards = alignment.standardsUsed.filter((standard) => standard.part === part);
                            return (
                              <div className="standardCard" key={part}>
                                <strong>{part}</strong>
                                <span>{standards.map((standard) => standard.id).join(", ")}</span>
                                <p>
                                  {standards
                                    .map((standard) => standard.teacherFriendlySummary)
                                    .filter(Boolean)
                                    .join(" ")}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>

          <div className="guardrailStrip">
            <span>Student-identifiable data should not be pasted into the tool.</span>
            <span>Uploads are parsed in the browser; checked text is used for alignment.</span>
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
