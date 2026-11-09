# Codebase Review & Improvement Roadmap

This document contains a comprehensive review of the `awmt-chord-formatter` codebase, detailing identified bugs, code quality improvements, testing and CI/CD enhancements, UX suggestions, and estimated effort for each task.

---

## 1. Critical & Functional Bugs

### 1.1 Negative Transpose Modulo Bug
- **Location:** [`src/features/chordProcessing/chordOperations.js`](src/features/chordProcessing/chordOperations.js#L138)
- **Effort:** Low (~15 minutes)
- **Problem:**
  The `transposeSingleChord` function calculates the transposed note index as:
  ```javascript
  const newIndex = (currentIndex + steps + output_scale.length) % output_scale.length;
  ```
  If `steps` is negative and `< -output_scale.length` (such as `-13` down to `-24`, which is allowed by configuration input validation), JavaScript's `%` operator yields a negative number. This results in accessing `output_scale[negativeIndex]`, which evaluates to `undefined`, replacing the chord with the string `"undefined"`.
- **Solution:**
  Use mathematical modulo:
  ```javascript
  const newIndex = ((currentIndex + steps) % output_scale.length + output_scale.length) % output_scale.length;
  ```

---

### 1.2 Module-Level State & Out-of-Sync Content Flags
- **Location:** [`src/features/chordProcessing/chordContentProcessor.js`](src/features/chordProcessing/chordContentProcessor.js#L3-L4)
- **Effort:** Medium (~2–3 hours)
- **Problem:**
  `chordsMarked` and `chordsNested` are global module-level booleans:
  - If a user types, pastes, or undoes content in the editor, these booleans remain at their previous state.
  - Calling `autoBreakContent()` mutates `chordsNested` during DOCX export.
  - If the user already clicked "Nest Chords" before clicking "Generate Word ZIP", `transposeInContent()` is skipped completely (`if (!chordsNested)` returns untransposed text).
- **Solution:**
  Make transformation functions pure. Detect whether content currently contains nested markers (`{...}`) directly from the content string itself (e.g. `/{.*?}/.test(content)`) rather than relying on stateful global variables.

---

### 1.3 Loss of Empty Lines in DOCX Export
- **Location:** [`src/features/docx/docxGen.js`](src/features/docx/docxGen.js#L29)
- **Effort:** Low (~30 minutes)
- **Problem:**
  When generating DOCX paragraphs:
  ```javascript
  if (preservedLine.trim() === '') {
    return;
  }
  ```
  Empty lines are completely stripped, causing verses, choruses, and song sections to collapse together with no separation.
- **Solution:**
  Preserve paragraph breaks by pushing an empty paragraph:
  ```javascript
  if (preservedLine.trim() === '') {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: '', font: 'Courier New', size: Number(fontSize) * 2 })],
      spacing: { line: Number(fontSize) * 20, lineRule: LineRuleType.EXACT },
    }));
    return;
  }
  ```
  Also remove the invalid `\n` in the TextRun header on line 61 (`${fileName.toUpperCase()}  /  ${configName}\n`).

---

### 1.4 Incomplete Font Size Coverage in `autoBreakContent` & Word Wrapping Glitch
- **Location:** [`src/features/chordProcessing/chordContentProcessor.js`](src/features/chordProcessing/chordContentProcessor.js#L153-L179, #L202)
- **Effort:** Low–Medium (~1–2 hours)
- **Problem:**
  - `fontSizeLookup` only lists 12 hardcoded even font sizes (8 through 30). For any odd font size (e.g. 11, 13) or size > 30 (the configuration UI allows up to 72), `maxLength` evaluates to 0 and `autoBreakContent` silently does nothing.
  - `let testLine = currentLine + ' ' + words[i];` prepends a leading space to the first word of newly wrapped lines.
- **Solution:**
  - Fall back to an inverse scale formula (e.g. `Math.floor(880 / fontSize)`) when a font size is not explicitly defined in the lookup table.
  - Avoid leading spaces when `currentLine` is empty (`currentLine ? `${currentLine} ${words[i]}` : words[i]`).

---

## 2. Code Quality & Maintenance

### 2.1 Leftover Debug Logging
- **Location:** [`src/features/chordProcessing/chordOperations.js`](src/features/chordProcessing/chordOperations.js#L33), [`src/features/chordProcessing/chordContentProcessor.js`](src/features/chordProcessing/chordContentProcessor.js#L203-L210)
- **Effort:** Low (~10 minutes)
- **Problem:**
  Top-level console logging (`console.log("formattedAllOptions: %s", formattedAllOptions)`) runs on every test suite and production load. Debug logs (`console.log("testLine")`, `console.log("HERE PUSHING")`) are present inside `autoBreakContent`.
- **Solution:**
  Remove debug `console.log` statements.

---

### 2.2 Duplicate Configuration JSON Files
- **Location:** [`src/data/config.json`](src/data/config.json) & [`src/data/default-configs.json`](src/data/default-configs.json)
- **Effort:** Low (~15 minutes)
- **Problem:**
  Both files are identical copies. `src/pages/config.js` imports `config.json` as fallback while `src/pages/main.js` imports `default-configs.json`.
- **Solution:**
  Consolidate into a single canonical `default-configs.json` and remove `config.json`.

---

### 2.3 Duplicate Tokens in Chord Regex
- **Location:** [`src/features/chordProcessing/chordOperations.js`](src/features/chordProcessing/chordOperations.js#L14-L18)
- **Effort:** Low (~15 minutes)
- **Problem:**
  Capitalized items are concatenated to `types`, and `typesUpper` is mapped from the concatenated array. As a result, uppercase variants (`MAJOR`, `MINOR`, `MAJMIN`, etc.) are duplicated in the final regular expression.
- **Solution:**
  Deduplicate types using `Set`:
  ```javascript
  const baseTypes = ['major', 'minor', 'majmin', 'minmaj', 'maj', 'min', 'aug', 'dim', 'sus'];
  const capitalizedTypes = baseTypes.map(item => item.charAt(0).toUpperCase() + item.slice(1));
  const upperTypes = baseTypes.map(item => item.toUpperCase());
  const typesList = [...new Set([...baseTypes, ...capitalizedTypes, ...upperTypes, 'm', 'M'])];
  ```

---

### 2.4 Fragile Array Coercion
- **Location:** [`src/features/chordProcessing/chordContentProcessor.js`](src/features/chordProcessing/chordContentProcessor.js#L47)
- **Effort:** Low (~10 minutes)
- **Problem:**
  `getChords(lines[n+1]) == 0` relies on JavaScript type coercion (`[] == 0` is `true`).
- **Solution:**
  Use explicit length check: `getChords(lines[n+1]).length === 0`.

---

### 2.5 Unused CSS Rule
- **Location:** [`src/styles/styles.css`](src/styles/styles.css#L123)
- **Effort:** Low (~5 minutes)
- **Problem:**
  `.highlighted-chord` is styled in CSS but never generated in markup or scripts.
- **Solution:**
  Either implement inline visual highlighting for chords in the editor or remove the unused selector.

---

## 3. Testing, Tooling & CI/CD

### 3.1 Missing Test Suites for Core Modules
- **Location:** [`tests/`](tests/)
- **Effort:** Medium (~3–5 hours)
- **Problem:**
  Only `chordOperations.js` (detect and transpose) has unit tests. The following critical modules have 0 unit tests:
  - `src/features/chordProcessing/chordContentProcessor.js` (nesting, unnesting, marking, unmarking, blank lines, autoBreak)
  - `src/features/config/configuration.js` (validation, normalization, storage serialization/parsing)
  - `src/features/docx/docxGen.js` (document paragraph and ZIP generation)
- **Solution:**
  Add comprehensive unit test suites for each module.

---

### 3.2 Production Deployment Skips Unit Tests
- **Location:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **Effort:** Low (~15 minutes)
- **Problem:**
  `deploy.yml` builds and deploys directly on push to `main` without running tests. Broken commits pushed or merged to `main` can deploy to production.
- **Solution:**
  Add a `Run unit tests` step (`npm test`) before the `Build` step in `deploy.yml`.

---

### 3.3 Migrate from Jest to Vitest
- **Location:** [`package.json`](package.json)
- **Effort:** Low–Medium (~1 hour)
- **Problem:**
  Jest currently relies on `NODE_OPTIONS=--experimental-vm-modules` for ESM support.
- **Solution:**
  Migrate to `vitest`, which natively integrates with Vite, requires no experimental flags, runs faster, and shares the same `describe`/`test`/`expect` API.

---

### 3.4 Linter & Formatter Setup
- **Location:** Repository root
- **Effort:** Low (~30 minutes)
- **Problem:**
  No linter or code formatting configuration exists. Code style varies between snake_case, camelCase, semicolon styles, and whitespace.
- **Solution:**
  Add ESLint and Prettier configs with npm scripts (`npm run lint`, `npm run format`).

---

## 4. User Experience & Architecture

### 4.1 Redo Support in Editor
- **Location:** [`src/pages/main.js`](src/pages/main.js#L58-L105)
- **Effort:** Low (~1 hour)
- **Problem:**
  The editor maintains an `undoHistory` stack and handles `Ctrl+Z`, but has no `redoHistory` stack (`Ctrl+Y` or `Cmd+Shift+Z`). Undoing an action cannot be reversed.
- **Solution:**
  Implement a paired `redoHistory` stack that clears on new user edits and allows redoing undone changes.

---

### 4.2 PWA Caching Strategy & Service Worker Revisioning
- **Location:** [`public/sw.js`](public/sw.js)
- **Effort:** Medium (~2–3 hours)
- **Problem:**
  The service worker uses runtime caching without build asset manifests or versioned precaching. When new production builds are deployed with hashed filenames, clients can get stuck on cached versions of `index.html`.
- **Solution:**
  Adopt `vite-plugin-pwa` with Workbox for automatic asset precaching, background sync, and update notification banners.

---

### 4.3 Visual Chord Highlighting
- **Location:** [`src/pages/main.js`](src/pages/main.js), [`src/styles/styles.css`](src/styles/styles.css)
- **Effort:** Medium–High (~4–6 hours)
- **Problem:**
  "Mark Chords" surrounds chords in literal `{}` characters.
- **Solution:**
  Provide visual badge styling in the editor or an optional preview pane using `.highlighted-chord`.

---

## Summary of Estimated Effort

| Priority Phase | Tasks | Total Estimated Effort |
| :--- | :--- | :--- |
| **Phase 1: Quick Fixes** | Bug fixes (transpose modulo, empty lines in DOCX, auto-break space), log cleanup, duplicate config deduplication, deploy CI test step | ~1.5 hours |
| **Phase 2: Core Refactor & Tests** | Pure content processor refactor, test coverage for all modules, Jest to Vitest migration | ~5–7 hours |
| **Phase 3: Tooling & PWA** | ESLint + Prettier, Redo stack, `vite-plugin-pwa` integration | ~3–4 hours |
| **Phase 4: UX Features** | Visual chord badges / split preview | ~4–6 hours |
