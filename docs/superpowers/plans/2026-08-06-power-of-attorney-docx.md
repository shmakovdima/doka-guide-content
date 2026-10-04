# Power of Attorney DOCX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an editable DOCX that preserves the source trust text and formatting while inserting only the user-provided requisites.

**Architecture:** Author a focused RTF document because the available macOS `textutil` utility can convert RTF into DOCX without an additional package. Use paragraph alignment, first-line indentation, and font settings in RTF to reproduce the supplied document structure, then convert it to a DOCX in `output/`.

**Tech Stack:** RTF 1.7, macOS `textutil`, shell validation.

## Global Constraints

- Preserve the supplied source wording, punctuation, paragraph order, and layout.
- Replace only personal requisites with user-provided values.
- Do not include any personal data from the source document.
- Use ordinary hyphen-minus characters only.

---

### Task 1: Author the formatted RTF source

**Files:**

- Create: `legal-docs/power-of-attorney.rtf`

**Interfaces:**

- Consumes: User-provided city, dates, identities, passport information, addresses, and validity date.
- Produces: An RTF document with centered title, aligned city and date line, standard body paragraphs, and an indented representative block.

- [ ] **Step 1: Create the RTF document header and typography**

Use Times New Roman at 12 pt, A4 paper dimensions, 2 cm margins, and a centered bold title paragraph.

- [ ] **Step 2: Insert the exact source text and updated requisites**

Keep fixed paragraphs literal. Format the city and date as a two-column tabbed line, apply spacing after logical blocks, and retain the original first-line indentation for the authority paragraphs.

- [ ] **Step 3: Inspect the source for accidental source data and typography violations**

Run: `rg -n 'Дмитрук|Ерохин|Садовая|Мусы|\\x{2014}|\\x{2013}' legal-docs/power-of-attorney.rtf`

Expected: no output.

### Task 2: Convert and validate the DOCX

**Files:**

- Create: `output/power-of-attorney.docx`
- Test: `output/power-of-attorney.docx`

**Interfaces:**

- Consumes: `legal-docs/power-of-attorney.rtf`
- Produces: An editable Microsoft Word document.

- [ ] **Step 1: Convert the RTF source into DOCX**

Run: `mkdir -p output && textutil -convert docx -output output/power-of-attorney.docx legal-docs/power-of-attorney.rtf`

Expected: `output/power-of-attorney.docx` exists and is non-empty.

- [ ] **Step 2: Extract the converted text for content verification**

Run: `textutil -convert txt -stdout output/power-of-attorney.docx`

Expected: the extracted text contains the fixed source wording and the new requisites.

- [ ] **Step 3: Inspect the resulting document metadata**

Run: `file output/power-of-attorney.docx`

Expected: reports a Microsoft Word document or Office Open XML container.
