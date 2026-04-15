export type SmeRubricCategory = {
  id:
    | "standards_accuracy"
    | "eld_integrity"
    | "language_demand_quality"
    | "teacher_usability"
    | "format_preservation"
    | "intervention_quality"
    | "access_without_lowered_demand"
    | "student_facing_clarity"
    | "feedback_usefulness"
    | "safety_privacy";
  label: string;
  focus: string;
  evidence: string;
};

export const SME_RUBRIC: SmeRubricCategory[] = [
  {
    id: "standards_accuracy",
    label: "Standards accuracy",
    focus: "Correct CA ELD match and no invented standard claims.",
    evidence: "Standards used must come from the retrieved JSON records."
  },
  {
    id: "eld_integrity",
    label: "ELD integrity",
    focus: "Part I, Part II, and PLD context stay connected.",
    evidence: "Every output with standards notes includes all three parts."
  },
  {
    id: "language_demand_quality",
    label: "Language-demand quality",
    focus: "Output identifies what students do with language in the lesson task.",
    evidence: "Language objective, prompt, or support names a language function tied to the task."
  },
  {
    id: "teacher_usability",
    label: "Teacher usability",
    focus: "Output is understandable, concise, and copy-ready.",
    evidence: "Teacher can use the aligned lesson without translating standards jargon."
  },
  {
    id: "format_preservation",
    label: "Format preservation",
    focus: "Lesson/table/headings remain recognizable.",
    evidence: "Headings, sequence, bullets, and table-like layout are preserved."
  },
  {
    id: "intervention_quality",
    label: "Intervention quality",
    focus: "Additions are light, targeted, and not generic.",
    evidence: "Support is connected to the actual task and proficiency context."
  },
  {
    id: "access_without_lowered_demand",
    label: "Access without lowered demand",
    focus: "ELPAC 1 and 3 supports preserve the same content expectation.",
    evidence: "Scaffolds change access through language supports, not the learning target."
  },
  {
    id: "student_facing_clarity",
    label: "Student-facing clarity",
    focus: "Success criteria combine content and academic language expectations.",
    evidence: "Criteria are copy-ready, student-friendly, and tied to the lesson evidence."
  },
  {
    id: "feedback_usefulness",
    label: "Feedback usefulness",
    focus: "Teacher moves support language growth during the lesson.",
    evidence: "Feedback prompts are specific, actionable, and connected to student language use."
  },
  {
    id: "safety_privacy",
    label: "Safety/privacy",
    focus: "No student-identifiable data is encouraged or retained.",
    evidence: "Input guidance and checks discourage student-specific private details."
  }
];
