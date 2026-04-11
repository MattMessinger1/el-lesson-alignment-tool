# SME Evaluation Guide

SMEs should evaluate the product with a stable rubric and representative examples, not only freeform feedback.

## Rubric

Use a 1-4 score for each category:

- **Standards accuracy:** correct CA ELD match and no invented standard claims.
- **ELD integrity:** Part I, Part II, and PLD context stay connected.
- **Language-demand quality:** output identifies what students do with language.
- **Teacher usability:** output is understandable and copy-ready.
- **Format preservation:** lesson/table/headings remain recognizable.
- **Intervention quality:** additions are light, targeted, and not generic.
- **Safety/privacy:** no student-identifiable data is encouraged or retained.

## Review Set

The starter review set is in `data/evals/sme-examples.json` and includes 12 examples across grade bands, content areas, proficiency ranges, prose lessons, numbered lessons, bullets, and table-style inputs.

Safety eval fixtures live in `data/evals/privacy-cases.json` and `data/evals/prompt-injection-cases.json`. These cases should pass before SMEs review instructional quality so reviewers only see outputs that passed privacy and prompt-injection gates.

## What to Look For

SMEs should focus on whether the aligned output is both standards-faithful and teacher-usable. A technically accurate standards note is not enough if the teacher's original lesson format is lost or the added support feels generic.
