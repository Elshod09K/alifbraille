# AlifBraille (SXSW EDU Student Impact Challenge)

**Live app:** https://braille.elshod.xyz · **Pitch materials:** https://braille.elshod.xyz/pitch/ · **Code:** https://github.com/Elshod09K/alifbraille


AlifBraille is an open-source, client-side educational bridge utility engineered for visually impaired students in Central Asia. It provides deterministic Latin-to-Braille transliteration from modern Uzbek Latin text into standardized 6-dot tactile Braille (Unicode range U+2800..U+283F), calibrated vector tactile SVG generation, interactive accessible web matrix visualizer, and synchronized auditory verification for sighted teachers.

## Architecture & Module Organization

The project is structured into modular TypeScript components targeting ES2022 / NodeNext:

### Core Transliteration Engine (M1)
- `src/types.ts`: Shared domain interfaces including `UzbekToken` and token type definitions.
- `src/normalizer.ts`: Deterministic Uzbek Latin orthography normalizer standardizing Unicode apostrophe variants for `o‘` / `g‘` and tokenizer for digraphs (`sh`, `ch`, `ng`).
- `src/braille.ts`: Official Uzbek Latin-to-Braille mapping table, numeral sign prefixing (`⠼` / U+283C), and letter context resumption.
- `src/index.ts`: Top-level library entry point re-exporting normalizer, braille transliteration, and shared UI types.
- `test/normalizer.test.ts`: Test suite verifying apostrophe normalization, digraph recognition, and whitespace preservation.
- `test/transliteration.test.ts`: Test suite verifying Braille Unicode transliteration across 25 official Uzbek vocabulary words and multi-digit number prefixing.
- `test/integration.test.ts`: End-to-end integration test suite verifying index re-exports, multi-digit numbers, apostrophe variations, digraphs, and mixed alphanumeric exam strings.

### Accessible Web Interface & Visual Tactile Grid (M2)
- `src/ui/types.ts`: Shared UI interface definitions (`BrailleCellVisualData`, `PresetItem`, `UIState`, `AppInstance`, `TactileGridItem`).
- `src/ui/tactile-cell.ts`: 6-dot Braille tactile cell visualizer component, bitmask dot decoder (`decodeBrailleDots`), and DOM grid renderer (`renderBrailleGrid`).
- `src/ui/presets.ts`: Curated educational presets for the Uzbek National Anthem, High School History/Constitution State Exam questions, and orthography drills.
- `src/ui/styles.css`: Strict WCAG 2.1 AAA high-contrast layout styles (minimum 7:1 contrast ratio) with `.alif-high-contrast`, `.tactile-grid`, and `.tactile-dot--active`.
- `src/ui/app.ts`: Accessible interface controller managing input synchronization (<50ms latency), keyboard navigation, and ARIA live announcements.
- `index.html` & `public/index.html`: Web entry points linking to `src/ui/app.ts` and `src/ui/styles.css`.
- `test/tactile-cell.test.ts`: Unit tests verifying correct 6-dot boolean activation for letters, digraphs, numerals, and semantic DOM creation.
- `test/presets.test.ts`: Verifies presence and integrity of Uzbek National Anthem and High School History Exam Question presets.
- `test/ui-a11y.test.ts`: Accessibility and performance tests verifying Tab/Shift-Tab keyboard traversal, <50ms transliteration latency, WCAG AAA color contrast ratios (>= 7:1), and ARIA live region announcements.

### Calibrated Tactile SVG Generator & Print Engine (M3)
- `src/types.ts`: Shared physical tactile layout definitions (`BrailleCell`, `TactileDimensions`, `SvgExportOptions`).
- `src/svg/constants.ts`: Marburg tactile physical specifications (2.5mm dot pitch, 6.0mm cell height, 0.75mm dot radius, 10.0mm line pitch) and paper standards (A4, Letter).
- `src/svg/generator.ts`: Millimeter-calibrated vector SVG generator producing printable A4 tactile Braille sheets adhering to Marburg standards with automatic line wrapping (~28 cells per line).
- `src/svg/index.ts`: SVG engine module entry point re-exporting constants and `generateTactileSvg`.
- `src/ui/export.ts`: Single-click SVG file download (`downloadTactileSvgFile`), swell-paper browser print trigger (`triggerPrintDialog`), and export controls binder (`setupExportControls`).
- `src/ui/print.css`: Dedicated `@media print` stylesheet with `@page { size: A4 portrait; margin: 15mm; }`, hiding UI navigation/editors and rendering high-contrast pure black dots on white for swell-paper heating.
- `test/svg-generator.test.ts`: Unit test suite verifying physical millimeter coordinates, 2.5mm dot spacing, 10.0mm line pitch, and valid SVG XML output.
- `test/print-export.test.ts`: Unit test suite verifying SVG blob generation with MIME type `image/svg+xml;charset=utf-8`, browser print dialog triggering, and `@media print` CSS rules.

### Sighted-Teacher Auditory Verification & Speech Sync (M4)
- `src/audio/types.ts`: Shared audio interfaces (`AudioPlaybackState`, `SpeechBoundaryEvent`, `ISpeechController`).
- `src/audio/phonetics.ts`: Uzbek Latin phonetic fallback converter mapping orthographic digraphs and modified letters (`o‘`, `g‘`, `sh`, `ch`, `ng`) when native `uz-UZ` voice is missing.
- `src/audio/synthesizer.ts`: Speech synthesis engine wrapper and boundary event dispatcher.
- `src/audio/index.ts`: Controller class `SpeechController implements ISpeechController` managing voice detection, playback lifecycle, and timing fallback.
- `src/ui/audio-controls.ts`: Audio controls binder (`initAudioControls`) providing accessible 'Tinglash' / 'To‘xtatish' buttons and live ARIA announcements.
- `src/ui/speech-highlighter.ts`: Real-time visual highlighter (`highlightBrailleCell`, `clearSpeechHighlights`) applying `.cell-speaking` and `data-active-speech="true"` glow.
- `test/mocks/speech-synthesis.mock.ts`: Deterministic Web Speech API test doubles (`MockSpeechSynthesis`, `MockSpeechSynthesisUtterance`, `MockSpeechSynthesisVoice`).
- `test/audio-phonetics.test.ts`: Unit tests for phonetic transliteration rules and diacritic fallbacks.
- `test/audio-synthesizer.test.ts`: Unit tests for voice lifecycle transitions, boundary events, and Web Speech API synthesis.
- `test/speech-sync-ui.test.ts`: Unit tests for audio controls UI state transitions, live status updates, and visual cell highlighting.

### Reverse Quiz & Teacher Verification Engine (M5)
- `src/ui/quiz.ts`: Reverse reading and verification lab (`initBrailleQuizModal`, `decodeDotsToChar`, `QUIZ_FLASHCARDS`, `REVERSE_BRAILLE_MAP`). Features pedagogical flashcards and interactive 6-dot matrix inspector decoding Braille dots to Uzbek Latin letters in real time.
- `test/quiz.test.ts`: Test suite verifying 6-dot bitmask decoding (letters, `o‘`, `g‘`, `sh`, `ch`, `’`, `#`), flashcard pool validity, and interactive inspector UI.

## Quickstart & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
Run the entire Vitest suite (393 unit, integration, SVG, print export, audio phonetics, speech sync, quiz and accessibility tests across 14 test suites):
```bash
npm test
```

Run specific test suites:
```bash
# Core Transliteration Engine (M1)
npm test -- test/normalizer.test.ts
npm test -- test/transliteration.test.ts
npm test -- test/integration.test.ts

# Visual Tactile Grid & Presets (M2)
npm test -- test/tactile-cell.test.ts
npm test -- test/presets.test.ts

# Accessible UI & A11y Verification (M2)
npm test -- test/ui-a11y.test.ts

# Calibrated Tactile SVG Generator (M3)
npm test -- test/svg-generator.test.ts

# Swell-Paper Print & Export UX (M3)
npm test -- test/print-export.test.ts

# Sighted-Teacher Auditory Verification & Speech Sync (M4)
npm test -- test/audio-phonetics.test.ts
npm test -- test/audio-synthesizer.test.ts
npm test -- test/speech-sync-ui.test.ts
```

### 3. Build & Typecheck
Compile standalone ES module, bundled web application, and TypeScript declarations to `dist/`:
```bash
npm run build
```

Run TypeScript strict type checking without emitting files:
```bash
npm run type-check
```

### 4. Running the Web Application
Start any local static HTTP server from the project root:
```bash
# Using Python:
python3 -m http.server 8080

# Or using npx:
npx serve .
```
Then navigate in any modern web browser to:
```
http://localhost:8080/index.html
```

### 5. Automated Browser Verification & Screenshots
Run headless Chromium end-to-end acceptance verification (load time, presets, real-time typing, keyboard navigation, SVG file download, swell-paper print styles, and screenshot capture):
```bash
npm run test:browser
```
Screenshots are recorded directly into `.zafar/screens/`:
- `01-initial-state.png`: Initial workspace with plain text editor and tactile grid region.
- `02-preset-anthem.png`: Loaded Uzbek National Anthem preset with live 6-dot Braille cells.
- `03-high-contrast-anthem.png`: WCAG 2.1 AAA high-contrast mode (yellow tactile indicators on true black).
- `04-history-exam-aaa.png`: High school history/constitution exam preset in high-contrast view.
- `05-typing-realtime.png`: 500-character benchmark passage transliterated in sub-50ms latency.
- `06-tactile-cell-focus.png`: Keyboard-highlighted tactile cell with real-time ARIA dot announcements.
- `07-svg-export.png`: Single-click millimeter-accurate SVG download verification adhering to Marburg standards.
- `08-swell-paper-print.png`: Browser print media emulation showing pure black tactile dots on white swell paper with controls and borders hidden.
- `09-audio-verification-sync.png`: Auditory speech verification with active real-time tactile Braille cell glowing highlight.
- `10-english-pitch-mode.png`: English pitch mode active with localized educational labels for SXSW EDU judges.
- `11-creator-impact-dialog.png`: Accessible About the Student Creator dialog (problem, 60-second pitch opener, swell-paper workflow and roadmap).
- `12-swell-simulation-preview.png`: Swell Simulation & Print Preview visual mode showing authentic A4 15mm margins, 3D raised tactile microcapsule relief, and 50mm calibration ruler notch.
- `13-braille-quiz-modal.png`: Interactive Braille Reverse Quiz & Two-Way Dot Inspector dialog empowering sighted teachers to learn and verify 6-dot Braille patterns.

## Keyboard Shortcuts & Accessibility Features

AlifBraille is engineered for full screen-reader accessibility and zero mouse dependency:
- **Alt + H**: Toggle WCAG AAA High-Contrast Mode (true black #000000 background, vibrant yellow #ffff00 active dots, cyan #00ffff focus indicators with contrast ratio >= 18:1).
- **Alt + I**: Move focus directly to the Latin input textarea (`#latin-input`).
- **Alt + O**: Move focus directly to the tactile Braille matrix region (`#braille-output`).
- **Alt + P**: Move focus to educational preset selector dropdown (`#preset-select`).
- **Alt + S** (or **Alt + D**): Single-click download of calibrated A4 tactile Braille SVG sheet.
- **Alt + C**: Trigger native browser print dialog for swell-paper microcapsule heating.
- **Alt + L**: Toggle auditory verification speech playback ('Tinglash' / 'To‘xtatish' or 'Listen' / 'Stop').
- **Alt + E** (or **Alt + M**): Toggle International Pitch Mode (English / Uzbek interface).
- **Alt + V**: Toggle Swell Simulation & Print Preview visual mode (A4 15mm margins, 3D tactile microcapsule relief, and 50mm ruler).
- **Alt + Q**: Open Braille Reverse Quiz & Two-Way Dot Inspector learning lab.
- **Alt + A**: Open the About the Student Creator dialog (problem, 60s pitch opener, swell-paper workflow and roadmap).
- **Tab / Shift-Tab**: Smooth cyclic navigation across interactive controls without focus traps.
- **Arrow Keys (Right/Left/Down/Up) & Home/End**: Traverse Braille cells one by one inside `#braille-output`. As each cell is highlighted, the ARIA live region (`#a11y-live-status`) announces the character, Braille character, and active dot numbers (e.g., `"Katakcha 1 / 279: "O‘", Brayl ⠧, 1, 2, 3, 6-nuqtalar."`).
- **Escape**: Return focus from the Braille matrix back to the Latin input editor, or stop active auditory speech playback immediately.

## Shared UI Interfaces (`src/ui/types.ts`)

```ts
export interface BrailleCellVisualData {
  char: string;
  brailleChar: string;
  dots: boolean[];
  index: number;
  activeDots?: number[];
  ariaLabel?: string;
  isSpace?: boolean;
  isDigraph?: boolean;
  isNumber?: boolean;
}

export interface PresetItem {
  id: string;
  title: string;
  text: string;
  description?: string;
  category?: 'anthem' | 'exam' | 'literature' | 'practice';
}

export interface UIState {
  inputText: string;
  brailleText: string;
  selectedPresetId: string | null;
  highContrast: boolean;
  statusMessage: string;
  activeCellIndex: number | null;
  characterCount: number;
  brailleCellCount: number;
}
```

## Tactile Cell Renderer Interface (`src/ui/tactile-cell.ts`)

```ts
export function decodeBrailleDots(brailleChar: string): boolean[];
export function createTactileCellElement(char: string, brailleChar: string, index: number): HTMLElement;
export function renderBrailleGrid(container: HTMLElement, items: TactileGridItem[]): void;
```

## Accessible UI Interface (`src/ui/app.ts`)

```ts
export function initApp(root: HTMLElement): {
  destroy(): void;
  updateText(text: string): void;
};
```

## Tactile SVG Generator Interface (`src/svg/index.ts`)

```ts
export interface SvgExportOptions {
  paperSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  dotRadiusMm?: number;
  dotPitchMm?: number;
  cellHeightMm?: number;
  linePitchMm?: number;
  title?: string;
  includeGuideDots?: boolean;
}

export function generateTactileSvg(
  cells: BrailleCell[] | string,
  options?: SvgExportOptions
): string;
```

## Print & Export UI Interface (`src/ui/export.ts`)

```ts
export function downloadTactileSvgFile(filename: string, svgContent: string): void;
export function triggerPrintDialog(): void;
export function setupExportControls(
  container: HTMLElement,
  getBrailleData: () => BrailleCell[]
): {
  downloadBtn: HTMLButtonElement;
  printBtn: HTMLButtonElement;
};
```

## Shared Audio Interfaces (`src/audio/types.ts`)

```ts
export type AudioPlaybackState = 'idle' | 'playing' | 'paused';

export interface SpeechBoundaryEvent {
  charIndex: number;
  charLength?: number;
  name?: string;
  elapsedTime?: number;
  tokenIndex?: number;
  token?: string;
  word?: string;
}

export interface ISpeechController {
  speak(text: string, onBoundary?: (e: SpeechBoundaryEvent) => void): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  getState(): AudioPlaybackState;
  getVoice(): SpeechSynthesisVoice | null;
  getPhoneticFallbackText(text: string): string;
}
```

## Audio Controls & Speech Highlighter Interfaces (`src/ui/`)

```ts
// src/ui/audio-controls.ts
export function initAudioControls(
  container: HTMLElement,
  controller: ISpeechController,
  getText: () => string
): void;

// src/ui/speech-highlighter.ts
export function highlightBrailleCell(tokenIndex: number | null): void;
export function clearSpeechHighlights(): void;
```


### Sighted Proctor Answer Key & Standardized Testing (M6)
- `src/ui/proctor-key.ts`: Standalone examination proctoring overlay (`initProctorKeyModal`, `generateProctorKeyHtml`, `downloadProctorKeyDocument`, `printProctorKeyDocument`). Cross-references all 10 exam questions: Latin prompt, correct option, Braille cell representation (`⠠⠃⠐`), line and cell indices, and character-by-character dot breakdowns for sighted supervisors without tactile Braille training.
- Accessible hotkey: `Alt+K` toggles proctor overlay; automatic banner prompt displays when 10-Question Standardized State Exam preset is loaded.
- Turnkey offline HTML answer key generation for test coordinator clipboards.

## Project Status: What Is Verified and What Comes Next

**Verified today** (all of it can be checked in this repository):
- **Working open-source app**: TypeScript, 100% client-side, works offline once loaded. No server, no account.
- **393 automated tests passing across 14 test suites** (`npm test`).
- **Measured performance**: typing re-render of 3.6 ms on a 500-character passage; initial load under 500 ms.
- **Marburg Medium geometry**: 2.5 mm dot pitch, 0.75 mm dot radius, 10.0 mm line pitch, 15 mm margins, plus a 50 mm calibration ruler on every sheet so teachers can catch printer auto-scaling (e.g. 94% "Fit to page") before heating swell paper.

**Not done yet**: AlifBraille has not been piloted with blind students or teachers, so there are no reading-speed, error-rate or time-saved results. Those will come from the pilot.

**Roadmap (goals, not results)**:
- **Next step (planned)**: pilot with a specialized school for visually impaired students in Tashkent. Teachers make real worksheets, blind students read the printed sheets, and I measure readability and teacher prep time.
- **Then**: fix what the pilot finds, publish free tactile practice packets, and offer the tool to specialized schools in other regions of Uzbekistan.
- **Later**: ask Braille specialists and education authorities to review the mapping; build tactile packets in the state exam format; add Karakalpak and Kazakh Latin.

Created by Elshod Kenjayev, Grade 11, Presidential School in Tashkent ([github.com/Elshod09K](https://github.com/Elshod09K)).

## Competition Deliverables & Packaging

The official submission package for the **SXSW EDU Student Impact Challenge 2027** is organized in the `submission/` directory:
- `submission/demo.mp4`: Walkthrough video pitch (87.3s, < 3 min limit) with burned-in subtitles, featuring the wow moment in the first 30 seconds.
- `submission/pitch-deck.pdf`: 10-slide pitch deck (title + 9 content slides) built with Marp, for the live pitch and Q&A.
- `submission/pitch-deck.html`: Standalone interactive web pitch deck.
- `submission/student-impact-statement.pdf`: 8-section impact statement (A4).
- `submission/student-impact-statement.md` & `submission/writeup.md`: Full markdown impact statement source text.
- `submission/SUBMISSION.md`: Package overview and form answers.
- `submission/fields.json`: Validated Airtable submission schema for the entry platform.
- `submission/images/`: Screenshots of the app UI (software screenshots, not classroom photos).

## Automated Verification & Test Coverage

- **Vitest Unit & Integration Suites**: **393 / 393 tests passing** (14 test files, 0 failures).
- **Headless Chromium CDP E2E Automation**: **18 / 18 acceptance checks passing** with 0 console errors:
  - Sub-50ms typing benchmark on 500 characters (typing re-render measured at 3.6 ms).
  - WCAG 2.1 AAA color contrast compliance (up to 18:1 ratio).
  - Web Speech synthesis with iOS/Safari AudioContext user-gesture unlock.
  - Marburg Medium tactile geometry: 2.50mm dot pitch, 0.75mm dot radius, 10.0mm line pitch.
  - `@media print` zero-border layout for thermal infrared swell fusers.
