export const ELD_ORCHESTRATOR_SYSTEM_PROMPT = `You are the CA ELD lesson alignment orchestrator for EL Lesson Alignment Tool.

Your job is to return the teacher's lesson, unit, or task in the same format with light CA ELD alignment additions.

Non-negotiable rules:
- Preserve the teacher's submitted format, headings, order, tables, bullets, numbering, and wording whenever possible.
- Add or lightly revise only what is needed to align the material to the retrieved CA ELD bundle.
- Do not create a separate report as the main output.
- Never cite or imply a CA ELD standard that was not returned by retrieve_eld_bundle.
- Never cite Part I without paired Part II and PLD context.
- Keep Brief Alignment Notes short and secondary.
- Return structured JSON with alignedText, briefAlignmentNotes, standardsUsed, and qualityChecks.`;

export const ELD_ORCHESTRATOR_TOOLS = [
  {
    name: "analyze_lesson_structure",
    description:
      "Analyze the submitted lesson text so the aligned output can preserve headings, tables, section order, and likely insertion points.",
    inputSchema: {
      type: "object",
      properties: {
        lessonText: { type: "string" }
      },
      required: ["lessonText"]
    },
    outputSchema: {
      type: "object",
      properties: {
        hasTableLikeStructure: { type: "boolean" },
        headings: { type: "array", items: { type: "string" } },
        sectionCount: { type: "number" },
        likelyInsertionIndex: { type: "number" }
      },
      required: ["hasTableLikeStructure", "headings", "sectionCount", "likelyInsertionIndex"]
    }
  },
  {
    name: "retrieve_eld_bundle",
    description:
      "Retrieve a paired CA ELD bundle. Part I, Part II, and PLD records must always be returned together.",
    inputSchema: {
      type: "object",
      properties: {
        gradeSpan: { type: "string", enum: ["K-2", "3-5", "6-8", "9-12"] },
        proficiency: {
          type: "string",
          enum: ["emerging", "expanding", "bridging", "mixed", "unknown"]
        },
        mode: { type: "string", enum: ["collaborative", "interpretive", "productive"] },
        languageFunction: { type: "string" }
      },
      required: ["gradeSpan", "proficiency", "mode", "languageFunction"]
    },
    outputSchema: {
      type: "object",
      properties: {
        partI: { type: "array" },
        partII: { type: "array" },
        pld: { type: "array" }
      },
      required: ["partI", "partII", "pld"]
    }
  },
  {
    name: "check_alignment_quality",
    description:
      "Check whether aligned output preserves format, avoids full rewrite, uses a complete ELD bundle, avoids student data, and does not return a report as the main output.",
    inputSchema: {
      type: "object",
      properties: {
        originalText: { type: "string" },
        alignedText: { type: "string" },
        standardsUsed: { type: "array" }
      },
      required: ["originalText", "alignedText", "standardsUsed"]
    },
    outputSchema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          passed: { type: "boolean" },
          detail: { type: "string" }
        },
        required: ["id", "label", "passed", "detail"]
      }
    }
  }
] as const;
