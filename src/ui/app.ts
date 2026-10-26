/**
 * AlifBraille Accessible Web Interface Controller
 * Provides real-time input synchronization (<50ms latency), high-contrast AAA mode management,
 * keyboard navigation coordination (Tab/Shift-Tab without focus traps, tactile cell stepping),
 * ARIA live region status announcements, English pitch mode toggle, and student impact documentation.
 */

import { transliterateToBraille, charToBraille, BRAILLE_NUMBER_PREFIX } from '../braille.js';
import { normalizeUzbekText } from '../normalizer.js';
import { renderBrailleGrid, decodeBrailleDots } from './tactile-cell.js';
import { PRESETS } from './presets.js';
import { setupExportControls } from './export.js';
import { SpeechController } from '../audio/index.js';
import type { ISpeechController, SpeechBoundaryEvent, AudioPlaybackState } from '../audio/types.js';
import { initAudioControls, ensureAudioUserGesture, setupGlobalGestureUnlock, type AudioControlsHandle } from './audio-controls.js';
import { highlightBrailleCell, clearSpeechHighlights } from './speech-highlighter.js';
import { initBrailleQuizModal } from './quiz.js';
import { initSwellTourModal } from './tour.js';
import { initProctorKeyModal, type ProctorKeyInstance } from './proctor-key.js';
import type { AppInstance, TactileGridItem } from './types.js';

const APOSTROPHE_REGEX = /^[ʻ‘'’`´ʼ]/;

/**
 * Parses normalized Uzbek Latin text into an array of visual TactileGridItems
 * pairing source characters/digraphs with their corresponding Braille symbols.
 */
export function textToTactileItems(text: string): TactileGridItem[] {
  if (!text) return [];

  const items: TactileGridItem[] = [];
  let inNumberMode = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    // Digits: insert Braille number sign prefix if starting number sequence
    if (char >= '0' && char <= '9') {
      if (!inNumberMode) {
        items.push({ char: '#', braille: BRAILLE_NUMBER_PREFIX });
        inNumberMode = true;
      }
      items.push({ char, braille: charToBraille(char) });
      i++;
      continue;
    }

    inNumberMode = false;

    // Modified letters (oʻ, gʻ)
    const charLower = char.toLowerCase();
    if ((charLower === 'o' || charLower === 'g') && APOSTROPHE_REGEX.test(nextChar)) {
      const pair = text.slice(i, i + 2);
      items.push({ char: pair, braille: charToBraille(pair) });
      i += 2;
      continue;
    }

    // Digraphs (sh, ch)
    if (
      (charLower === 's' && nextChar.toLowerCase() === 'h') ||
      (charLower === 'c' && nextChar.toLowerCase() === 'h')
    ) {
      const digraph = text.slice(i, i + 2);
      items.push({ char: digraph, braille: charToBraille(digraph) });
      i += 2;
      continue;
    }

    // Standard character, whitespace, or punctuation
    items.push({ char, braille: charToBraille(char) || '⠀' });
    i++;
  }

  return items;
}

/**
 * Initializes the AlifBraille accessible UI within the given root element.
 *
 * @param root - The mounting container element
 * @returns AppInstance with destroy() and updateText() methods
 */
export function initApp(root: HTMLElement): AppInstance {
  let currentLang: 'uz' | 'en' = 'uz';

  // Arm one-time global user-gesture audio context unlock for iOS / Safari
  setupGlobalGestureUnlock();

  const STRINGS = {
    uz: {
      tagline: 'O‘zbek lotin matnidan chop etishga tayyor Brayl yozuvi',
      heroEyebrow: 'Bepul · Ochiq kodli · Internetsiz ishlaydi',
      heroTitle: 'Lotin yozuvi kiradi. <em>Brayl</em> chiqadi.',
      heroSub: 'Ko‘zi ojiz o‘quvchilar va ularga imtihon materiallarini tayyorlaydigan ko‘zi ochiq o‘qituvchilar uchun.',
      heroStats: ['393 ta test', '~4 ms / 500 belgi', 'Marburg 2.5 mm', '0 so‘m'],
      skipLink: 'Asosiy matn maydoniga o‘tish',
      presetDefault: '-- Namuna matnni tanlang --',
      presetAria: 'Namuna matn (Alt+P)',
      highContrast: 'Yuqori kontrast',
      highContrastAria: 'Yuqori kontrast rejimini yoqish yoki o‘chirish (Alt+H)',
      langToggle: 'English',
      langToggleAria: 'Switch to English interface for international pitch evaluation (Alt+E)',
      aboutCreatorBtn: 'Loyiha haqida',
      aboutCreatorAria: 'O‘quvchi muallif, ijtimoiy ta’sir va reja (Alt+A)',
      inputHeading: 'Lotin Yozuvi',
      charCount: (n: number) => `${n} ta belgi`,
      placeholder: 'O‘zbek lotin matnini shu yerga yozing yoki namunani tanlang...',
      inputAria: 'O‘zbek lotin matni kiriting (Alt+I)',
      outputHeading: 'Taktil Brayl',
      outputAria: '6 nuqtali Brayl taktil ko‘rinishi (Alt+O)',
      exportSvg: 'SVG Yuklab Olish',
      exportSvgAria: 'Brayl taktil SVG faylini yuklab olish (Alt+S)',
      print: 'Chop Etish',
      printAria: 'Taktil qog‘ozga chop etish (Alt+C)',
      previewBtn: 'Qog‘oz ko‘rinishi',
      previewBtnAria: 'Taktil qog‘oz va qavariq simulyatsiyasini ko‘rish (Alt+V)',
      quizBtn: 'Viktorina',
      quizBtnAria: 'Brayl viktorinasi va ikki tomonlama tekshiruv (Alt+Q)',
      tourBtn: 'Chop etish qo‘llanmasi',
      tourBtnAria: 'Birinchi taktil chop etish bo‘yicha 3 bosqichli o‘qituvchi qo‘llanmasi (Alt+T)',
      proctorBtn: 'Nazoratchi kaliti',
      proctorBtnAria: 'Ko‘zi ochiq nazoratchi javoblar kaliti va Brayl katakchalari (Alt+K)',
      tactileCellsBadge: (n: number) => `${n} ta taktil katakcha`,
      tactilePreviewHint: 'Marburg Medium · 2.5 mm nuqta oralig‘i',
      statusEmpty: 'Matn maydoni bo‘sh. 0 ta belgi.',
      statusRendered: (chars: number, cells: number) =>
        `${chars} ta belgi kiritildi, ${cells} ta taktil brayl katakchasi yaratildi.`,
      statusPresetLoaded: (title: string, count: number) =>
        `"${title}" namunasi yuklandi. ${count} ta belgi kiritildi.`,
      statusHighContrastOn: 'Yuqori kontrast rejimi (AAA) faollashtirildi.',
      statusHighContrastOff: 'Standart kontrast rejimi faollashtirildi.',
      statusLangSwitched: 'O‘zbekcha interfeys faollashtirildi.',
      statusSimulationOn: 'Taktil simulyatsiya yoqildi: A4 sahifa hoshiyalari va 3D qavariq nuqtalar ko‘rsatilmoqda.',
      statusSimulationOff: 'Standart tahrirlash ko‘rinishi faollashtirildi.',
      metaDoc: 'Hujjat (Brayl):',
      metaPage: 'Sahifa (Brayl):',
    },
    en: {
      tagline: 'Uzbek Latin to print-ready Braille',
      heroEyebrow: 'Free · Open source · Works offline',
      heroTitle: 'Uzbek Latin in. <em>Braille</em> out.',
      heroSub: 'Built for blind students and the sighted teachers who prepare their exam materials.',
      heroStats: ['393 tests passing', '~4 ms per 500 chars', 'Marburg 2.5 mm dots', '$0 for schools'],
      skipLink: 'Skip to primary text editor',
      presetDefault: '-- Select Sample Text --',
      presetAria: 'Select educational preset (Alt+P)',
      highContrast: 'High contrast',
      highContrastAria: 'Toggle WCAG AAA high contrast mode (Alt+H)',
      langToggle: 'O‘zbekcha',
      langToggleAria: 'O‘zbek tilidagi interfeysga qaytish (Alt+E)',
      aboutCreatorBtn: 'About',
      aboutCreatorAria: 'About the solo student creator, pilot plan & hardware (Alt+A)',
      inputHeading: 'Latin Script Input',
      charCount: (n: number) => `${n} characters`,
      placeholder: 'Type or paste Uzbek Latin text here, or select a curriculum preset above...',
      inputAria: 'Enter Uzbek Latin text (Alt+I)',
      outputHeading: 'Tactile Braille Grid',
      outputAria: '6-dot Braille tactile matrix view (Alt+O)',
      exportSvg: 'Download Tactile SVG',
      exportSvgAria: 'Download calibrated Marburg tactile vector SVG file (Alt+S)',
      print: 'Print Swell Sheet',
      printAria: 'Print onto microcapsule swell paper for thermal fuser (Alt+C)',
      previewBtn: 'Swell preview',
      previewBtnAria: 'Toggle tactile swell paper simulation and margin preview (Alt+V)',
      quizBtn: 'Braille quiz',
      quizBtnAria: 'Open Braille reverse quiz and interactive verification (Alt+Q)',
      tourBtn: 'Print guide',
      tourBtnAria: '3-Step First Swell Print Teacher Guide (Alt+T)',
      proctorBtn: 'Proctor key',
      proctorBtnAria: 'Sighted proctor answer key and Braille cell overlay (Alt+K)',
      tactileCellsBadge: (n: number) => `${n} tactile cells`,
      tactilePreviewHint: 'Marburg Medium · 2.5 mm dot pitch',
      statusEmpty: 'Text editor is empty. 0 characters.',
      statusRendered: (chars: number, cells: number) =>
        `${chars} characters transliterated into ${cells} tactile Braille cells.`,
      statusPresetLoaded: (title: string, count: number) =>
        `Preset "${title}" loaded (${count} characters).`,
      statusHighContrastOn: 'High contrast AAA mode activated.',
      statusHighContrastOff: 'Standard contrast mode activated.',
      statusLangSwitched: 'English interface enabled for pitch evaluation.',
      statusSimulationOn: 'Swell paper simulation active: A4 margins, 2.5mm spacing, and 3D tactile relief preview.',
      statusSimulationOff: 'Standard editing view activated.',
      metaDoc: 'Doc (Braille):',
      metaPage: 'Page (Braille):',
    },
  };

  // If root doesn't contain elements, scaffold semantic accessible layout
  if (!root.querySelector('#latin-input')) {
    root.innerHTML = `
      <div class="app-container">
        <a href="#latin-input" class="skip-link">${STRINGS.uz.skipLink}</a>
        <header class="app-header" role="banner">
          <div class="header-top">
            <div class="brand">
              <span class="brand-mark" aria-hidden="true">
                <i class="on"></i><i></i><i class="on"></i><i class="on"></i><i></i><i class="on"></i>
              </span>
              <div class="header-title-group">
                <h1>AlifBraille</h1>
                <p id="header-tagline" class="header-tagline">${STRINGS.uz.tagline}</p>
              </div>
            </div>
            <div class="header-switches">
                <button
                  id="high-contrast-toggle"
                  class="toggle-button"
                  type="button"
                  aria-pressed="false"
                  aria-label="${STRINGS.uz.highContrastAria}"
                >
                  ${STRINGS.uz.highContrast}
                </button>
                <button
                  id="lang-toggle-btn"
                  class="toggle-button lang-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.langToggleAria}"
                >
                  ${STRINGS.uz.langToggle}
                </button>
            </div>
          </div>
          <section class="hero" aria-labelledby="hero-title">
            <p id="hero-eyebrow" class="hero-eyebrow">${STRINGS.uz.heroEyebrow}</p>
            <h2 id="hero-title" class="hero-title">${STRINGS.uz.heroTitle}</h2>
            <p id="hero-sub" class="hero-sub">${STRINGS.uz.heroSub}</p>
            <ul id="hero-stats" class="hero-stats">
              ${STRINGS.uz.heroStats.map((t) => `<li>${t}</li>`).join('')}
            </ul>
          </section>
          <div class="controls-row">
            <div class="toolbar-primary">
              <div id="audio-controls-container"></div>
              <label for="preset-select" class="sr-only">Namuna matnni tanlang</label>
              <select id="preset-select" class="select-control" aria-label="Namuna matn (Alt+P)">
                <option value="">${STRINGS.uz.presetDefault}</option>
                ${PRESETS.map((p) => `<option value="${p.id}">${p.title}</option>`).join('')}
              </select>
            </div>
            <div class="toolbar-tools" role="group" aria-label="Tools / Vositalar">
                <button
                  id="quiz-toggle-btn"
                  class="toggle-button quiz-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.quizBtnAria}"
                >
                  ${STRINGS.uz.quizBtn}
                </button>
                <button
                  id="tour-toggle-btn"
                  class="toggle-button tour-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.tourBtnAria}"
                >
                  ${STRINGS.uz.tourBtn}
                </button>
                <button
                  id="proctor-key-btn"
                  class="toggle-button proctor-key-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.proctorBtnAria}"
                >
                  ${STRINGS.uz.proctorBtn}
                </button>
                <button
                  id="about-creator-btn"
                  class="toggle-button about-toggle-btn"
                  type="button"
                  tabindex="-1"
                  aria-label="${STRINGS.uz.aboutCreatorAria}"
                >
                  ${STRINGS.uz.aboutCreatorBtn}
                </button>
            </div>
          </div>
        </header>


        <main class="workspace-grid" role="main">
          <section class="panel" aria-labelledby="input-heading">
            <div class="panel-header">
              <h2 id="input-heading" class="panel-title">${STRINGS.uz.inputHeading}</h2>
              <span id="char-counter" class="char-counter" aria-live="off">0 ta belgi</span>
            </div>
            <textarea
              id="latin-input"
              class="text-editor"
              placeholder="${STRINGS.uz.placeholder}"
              aria-label="${STRINGS.uz.inputAria}"
              spellcheck="false"
            ></textarea>
          </section>

          <section class="panel" aria-labelledby="output-heading">
            <div class="panel-header">
              <h2 id="output-heading" class="panel-title">${STRINGS.uz.outputHeading}</h2>
              <div id="export-controls-container" class="panel-actions"></div>
            </div>
            <div id="tactile-print-meta" class="tactile-print-meta" aria-hidden="true"></div>
            <div id="tactile-preview-toolbar" class="tactile-preview-toolbar">
              <span id="tactile-cells-badge" class="tactile-cells-badge">0 ta katakcha</span>
              <span id="tactile-preview-mode-hint" class="tactile-preview-mode-hint">${STRINGS.uz.tactilePreviewHint}</span>
            </div>
            <div
              id="braille-output"
              class="tactile-grid"
              data-empty-hint="⠁⠇⠊⠋  Chapdagi maydonga matn yozing yoki namunani tanlang · Type Uzbek Latin text or pick a sample"
              role="region"
              aria-label="${STRINGS.uz.outputAria}"
              tabindex="0"
            ></div>
          </section>
        </main>

        <footer class="app-footer">
          <span>AlifBraille · Tashkent, Uzbekistan · Elshod Kenjayev</span>
          <a href="https://github.com/Elshod09K/alifbraille" target="_blank" rel="noopener">GitHub (MIT)</a>
          <a href="./pitch/">Pitch</a>
        </footer>

        <div id="a11y-live-status" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>

        <!-- Accessible Dialog: About Student Creator, Pilot Plan, & Swell Hardware Bridge -->
        <dialog id="about-creator-modal" class="impact-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-dialog-content">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <h2 id="modal-title" class="modal-title">👨‍🎓 About the Student Creator</h2>
                <span class="modal-badge">SXSW EDU Student Impact Challenge</span>
              </div>
              <button id="modal-close-btn" class="modal-close-btn" type="button" aria-label="Close dialog (Esc)">✕</button>
            </div>

            <div class="modal-body">
              <!-- Scannable summary of verifiable project metrics -->
              <div class="creator-kpi-summary" role="region" aria-label="AlifBraille project summary">
                <div class="creator-kpi-item">
                  <span class="kpi-num">~4 ms</span>
                  <span class="kpi-label">To convert 500 characters</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">393</span>
                  <span class="kpi-label">Automated tests passing</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">2.5 mm</span>
                  <span class="kpi-label">Marburg tactile dot pitch</span>
                </div>
                <div class="creator-kpi-item">
                  <span class="kpi-num">100%</span>
                  <span class="kpi-label">Offline, in the browser</span>
                </div>
                <div class="creator-kpi-item" id="kpi-fluency-item">
                  <span class="kpi-num">$0</span>
                  <span class="kpi-label">Cost to schools (MIT license)</span>
                </div>
              </div>

              <!-- Tab Navigation -->
              <div class="creator-tabs-nav" role="tablist" aria-label="Creator impact sections">
                <button
                  id="creator-tab-pitch"
                  class="creator-tab-btn active"
                  type="button"
                  role="tab"
                  aria-selected="true"
                  aria-controls="creator-panel-pitch"
                >
                  🎯 Problem & Pitch
                </button>
                <button
                  id="creator-tab-fieldnotes"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-fieldnotes"
                >
                  🏫 School Pilot Plan
                </button>
                <button
                  id="creator-tab-hardware"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-hardware"
                >
                  ⚙️ Swell-Paper Workflow
                </button>
                <button
                  id="creator-tab-roadmap"
                  class="creator-tab-btn"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  aria-controls="creator-panel-roadmap"
                >
                  🗺️ Roadmap
                </button>
              </div>

              <!-- PANEL 1: Problem & Pitch -->
              <div id="creator-panel-pitch" class="creator-tab-panel active" role="tabpanel" aria-labelledby="creator-tab-pitch">
                <section class="modal-section">
                  <h3 class="section-title">1. Solo High School Creator</h3>
                  <p>
                    I am <strong>Elshod Kenjayev</strong>, a Grade 11 student at the Presidential School in <strong>Tashkent, Uzbekistan</strong>
                    (GitHub: <a href="https://github.com/Elshod09K" target="_blank" rel="noopener">@Elshod09K</a>).
                    I designed and built AlifBraille on my own.
                  </p>
                  <p>
                    Uzbekistan moved its schools, textbooks and state university entrance exams to the Uzbek Latin alphabet.
                    Blind and low-vision students were left behind by that switch: most tactile books in specialized school libraries were
                    produced in Cyrillic Braille, existing converters don't support Uzbek Latin rules, and many teachers are sighted and
                    can't check a Braille worksheet by touch. AlifBraille lets any teacher produce and verify calibrated Braille materials in seconds, for free.
                  </p>

                  <!-- 60-Second Pitch Opener -->
                  <div class="pitch-script-card">
                    <div class="pitch-script-header">
                      <strong>🎤 60-Second Pitch Opener:</strong>
                      <span class="pitch-timer-badge">~60 SECONDS</span>
                    </div>
                    <p class="pitch-script-text">
                      "I'm Elshod, a high school student from Tashkent, Uzbekistan.
                      My country switched its schools and its university entrance exams from Cyrillic to the Latin alphabet. For me, that meant new textbooks.
                      For blind students, it meant their Braille books, mostly Cyrillic, no longer matched the exam they have to pass.
                      The software that could fix this doesn't know Uzbek Latin: it reads the apostrophe in O‘ and G‘ as punctuation and splits sh and ch into the wrong cells. One wrong cell changes a word, and on an exam, a word changes the answer.
                      And many of their teachers can't read Braille, so they can't check a sheet before handing it out.
                      So I built AlifBraille: a free, open-source tool that turns Uzbek Latin into correct, print-ready Braille in milliseconds, and reads it aloud cell by cell so any teacher can verify it."
                    </p>
                  </div>
                </section>
              </div>

              <!-- PANEL 2: School Pilot Plan -->
              <div id="creator-panel-fieldnotes" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-fieldnotes" hidden>
                <section class="modal-section">
                  <h3 class="section-title">2. School Pilot Plan: What We Will Test and Measure</h3>
                  <p>
                    The tool works today. The next step is putting it in front of the people it is for: I am reaching out to specialized schools for visually impaired students in Tashkent to run a first classroom pilot.
                  </p>
                  <div class="case-notes-container">
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 1: Teacher Preparation Time</strong>
                        <span class="case-note-tag">Before vs. after</span>
                      </div>
                      <p>
                        Time how long it takes a teacher to prepare a one-page Braille quiz the usual way, then with AlifBraille (convert, check by audio, print).
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 2: Tactile Legibility on Swell Paper</strong>
                        <span class="case-note-tag">Student feedback</span>
                      </div>
                      <p>
                        Confirm with blind readers that Marburg Medium spacing (2.5mm dot pitch, 0.75mm dot radius, 10.0mm line pitch) reads cleanly on the school's swell paper, including Uzbek units such as <em>sh</em> (⠱), <em>ch</em> (⠟), <em>o‘</em> and <em>g‘</em>.
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 3: Can Sighted Teachers Verify It?</strong>
                        <span class="case-note-tag">Errors caught</span>
                      </div>
                      <p>
                        Count the transcription errors that sighted teachers catch with synchronized audio playback and cell highlighting, without reading Braille by touch.
                      </p>
                    </div>
                    <div class="case-note-card">
                      <div class="case-note-header">
                        <strong>Measure 4: Student Reading Accuracy and Speed</strong>
                        <span class="case-note-tag">Exam practice</span>
                      </div>
                      <p>
                        Track students' reading accuracy and speed on Latin Braille state-exam practice sheets over the pilot, using the built-in 10-question exam template and proctor answer key.
                      </p>
                    </div>
                  </div>

                  <!-- Goal statement -->
                  <div class="student-quote-card" style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
                    <div style="font-weight: 700; color: #059669; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                      🎯 The goal of the pilot
                    </div>
                    <blockquote style="margin: 0; font-style: italic; font-size: 0.95rem; line-height: 1.5; color: var(--color-text-primary);">
                      Every blind student in Uzbekistan practices for the national exam in the same alphabet the exam is written in.
                    </blockquote>
                  </div>

                  <!-- Illustration: reading a swell sheet -->
                  <div class="physical-photo-showcase">
                    <div class="showcase-header">
                      <strong>Illustration 1: Reading an AlifBraille Swell Sheet</strong>
                      <span class="photo-badge">Diagram</span>
                    </div>
                    <div class="showcase-body">
                      <svg class="photo-render-svg" viewBox="0 0 680 185" xmlns="http://www.w3.org/2000/svg" aria-label="Illustration of a fingertip reading raised Uzbek Latin Braille on an A4 swell sheet">
                        <defs>
                          <linearGradient id="photoSheetBg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#ffffff"/>
                            <stop offset="100%" stop-color="#f8fafc"/>
                          </linearGradient>
                          <radialGradient id="dotRelief" cx="35%" cy="35%" r="65%">
                            <stop offset="0%" stop-color="#475569"/>
                            <stop offset="70%" stop-color="#0f172a"/>
                            <stop offset="100%" stop-color="#000000"/>
                          </radialGradient>
                          <filter id="dotShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.55"/>
                          </filter>
                        </defs>
                        <rect x="15" y="15" width="650" height="155" rx="8" fill="url(#photoSheetBg)" stroke="#cbd5e1" stroke-width="2"/>
                        <line x1="30" y1="36" x2="650" y2="36" stroke="#e2e8f0" stroke-width="1.5"/>
                        <text x="35" y="30" fill="#64748b" font-size="11" font-weight="bold">ALIFBRAILLE A4 SWELL SHEET</text>
                        <rect x="525" y="22" width="120" height="10" fill="#0f172a" rx="2"/>
                        <text x="532" y="30" fill="#f8fafc" font-size="8" font-weight="bold">50mm CALIBRATION RULER</text>
                        <g transform="translate(45, 52)" filter="url(#dotShadow)">
                          <circle cx="10" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="10" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="10" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="20" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="36" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="46" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="36" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="46" cy="36" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="62" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="62" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="88" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="98" cy="24" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="114" cy="12" r="4.5" fill="url(#dotRelief)"/>
                          <circle cx="114" cy="36" r="4.5" fill="url(#dotRelief)"/>
                        </g>
                        <g transform="translate(195, 42)">
                          <path d="M 40 95 C 60 65, 75 38, 85 26 C 92 16, 105 16, 108 26 C 110 33, 95 62, 85 90 Z" fill="#e0a97a" stroke="#b47746" stroke-width="2"/>
                          <ellipse cx="98" cy="22" rx="10" ry="14" fill="#e8b88d" stroke="#b47746" stroke-width="1.5" transform="rotate(-15 98 22)"/>
                          <circle cx="95" cy="20" r="15" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,3" opacity="0.8"/>
                          <circle cx="95" cy="20" r="21" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
                        </g>
                        <text x="325" y="75" fill="#0f172a" font-size="13" font-weight="bold">Index Fingertip Reading (Tactile Tracking)</text>
                        <text x="325" y="96" fill="#475569" font-size="11">Standard 2.5mm Marburg dot pitch enables clean single-finger touch decoding.</text>
                        <text x="325" y="116" fill="#059669" font-size="11" font-weight="bold">To be validated with blind readers in the school pilot</text>
                        <text x="325" y="136" fill="#6b7280" font-size="10">Teachers check every cell by audio before printing</text>
                      </svg>
                      <p class="photo-caption">
                        <strong>Illustration:</strong> a sighted teacher prints an audio-verified Latin Braille quiz on swell paper; the student reads the raised dots by fingertip.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <!-- PANEL 3: Swell Hardware Workflow & Post-Heating Inspection -->
              <div id="creator-panel-hardware" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-hardware" hidden>
                <section class="modal-section">
                  <h3 class="section-title">3. Digital-to-Physical Swell-Paper Hardware Workflow</h3>
                  <p>
                    Tactile literacy requires physical touch. AlifBraille connects browser software directly to thermal swell-paper hardware:
                  </p>
                  <figure class="workflow-diagram">
                    <img
                      src="./deliverables/workflow.svg"
                      alt="The AlifBraille workflow in five steps: 1. a sighted teacher types Uzbek Latin text in the web app; 2. exact-scale SVG export or browser print at Marburg Medium spacing with a 50 mm ruler; 3. the teacher checks the 50 mm ruler on the printed swell paper before heating; 4. the heat fuser makes the capsules under the black dots swell up; 5. a blind student reads the sheet by touch."
                      width="820"
                      height="788"
                      loading="lazy"
                    />
                  </figure>

                  <!-- High-Resolution Physical Photography Showcase: Post-Heating Swell Sheet -->
                  <div class="physical-photo-showcase">
                    <div class="showcase-header">
                      <strong>Illustration 2: Swell Sheet After Heating</strong>
                      <span class="photo-badge">Diagram</span>
                    </div>
                    <div class="showcase-body">
                      <svg class="photo-render-svg" viewBox="0 0 680 185" xmlns="http://www.w3.org/2000/svg" aria-label="Illustration of a microcapsule swell sheet post-heating with intact 50mm calibration notch and raised 2.5mm Braille dots">
                        <defs>
                          <linearGradient id="macroSwellBg" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#fffdf5"/>
                            <stop offset="100%" stop-color="#fef9c3"/>
                          </linearGradient>
                        </defs>
                        <rect x="15" y="15" width="650" height="155" rx="8" fill="url(#macroSwellBg)" stroke="#f59e0b" stroke-width="2"/>
                        <g transform="translate(45, 30)">
                          <circle cx="28" cy="28" r="14" fill="#111827" stroke="#000000" stroke-width="2"/>
                          <ellipse cx="23" cy="22" rx="4" ry="2.5" fill="#9ca3af" opacity="0.7"/>
                          <text x="52" y="32" fill="#1f2937" font-size="12" font-weight="bold">Dot 1 (Raised ~0.5mm)</text>

                          <circle cx="28" cy="72" r="14" fill="#111827" stroke="#000000" stroke-width="2"/>
                          <ellipse cx="23" cy="66" rx="4" ry="2.5" fill="#9ca3af" opacity="0.7"/>
                          <text x="52" y="76" fill="#1f2937" font-size="12" font-weight="bold">Dot 2 (Raised ~0.5mm)</text>
                        </g>
                        <g transform="translate(255, 35)">
                          <rect x="0" y="0" width="205" height="24" fill="#0f172a" rx="3"/>
                          <line x1="10" y1="12" x2="195" y2="12" stroke="#fbbf24" stroke-width="2"/>
                          <line x1="10" y1="6" x2="10" y2="18" stroke="#fbbf24" stroke-width="2"/>
                          <line x1="102" y1="8" x2="102" y2="16" stroke="#fbbf24" stroke-width="1.5"/>
                          <line x1="195" y1="6" x2="195" y2="18" stroke="#fbbf24" stroke-width="2"/>
                          <text x="45" y="38" fill="#78350f" font-size="11" font-weight="bold">50.0mm EXACT 1:1 CALIBRATION</text>
                          <text x="5" y="58" fill="#92400e" font-size="10">Check against a desk ruler: catches fit-to-page shrinkage</text>
                          <text x="5" y="74" fill="#92400e" font-size="10">Universal 2.5mm dot pitch maintained across thermal pass</text>
                        </g>
                        <g transform="translate(480, 32)">
                          <rect x="0" y="0" width="165" height="75" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
                          <text x="14" y="24" fill="#f87171" font-size="11" font-weight="bold">PIAF Thermal Fuser</text>
                          <text x="14" y="42" fill="#e2e8f0" font-size="10">Infrared heat pass</text>
                          <text x="14" y="60" fill="#34d399" font-size="10" font-weight="bold">✓ Microcapsules Expanded</text>
                        </g>
                      </svg>
                      <p class="photo-caption">
                        <strong>Illustration:</strong> black ink absorbs the heat and the microcapsules underneath swell into raised dots. If the printed 50mm ruler still measures 50mm, the sheet is at true 1:1 scale.
                      </p>
                    </div>
                  </div>

                  <div class="diagram-wrap">
                    <div class="diagram-caption"><strong>Physical Swell-Paper Microcapsule Expansion Cross-Section:</strong></div>
                    <svg class="swell-diagram-svg" viewBox="0 0 600 130" xmlns="http://www.w3.org/2000/svg" aria-label="Cross-section diagram showing microcapsule paper expanding under infrared heat under black ink dots">
                      <rect x="20" y="70" width="560" height="45" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2" rx="4"/>
                      <text x="30" y="98" font-size="12" fill="#4b5563" font-weight="bold">Standard Microcapsule Swell Paper Base (A4, Zychem/PIAF)</text>
                      <rect x="60" y="62" width="110" height="8" fill="#e5e7eb" stroke="#d1d5db"/>
                      <text x="65" y="55" font-size="10" fill="#6b7280">Unheated: flat surface</text>
                      <path d="M 230 70 Q 255 18 280 70 Z" fill="#111827" stroke="#000000" stroke-width="2"/>
                      <circle cx="255" cy="42" r="14" fill="#000000"/>
                      <text x="215" y="14" font-size="11" fill="#dc2626" font-weight="bold">Raised Braille Dot (~0.5mm)</text>
                      <path d="M 330 70 Q 355 18 380 70 Z" fill="#111827" stroke="#000000" stroke-width="2"/>
                      <circle cx="355" cy="42" r="14" fill="#000000"/>
                      <text x="315" y="14" font-size="11" fill="#dc2626" font-weight="bold">Raised Braille Dot (~0.5mm)</text>
                      <text x="430" y="50" font-size="11" fill="#1f2937"><strong>IR Heat Absorption:</strong> Carbon swells capsules</text>
                    </svg>
                  </div>

                  <div class="validation-grid">
                    <div class="val-card">
                      <h4>📐 Marburg Tactile Standard</h4>
                      <p>Geometry follows the Marburg Medium specification (covered by automated tests): <strong>2.5 mm dot pitch</strong>, <strong>0.75 mm dot radius</strong>, <strong>10.0 mm line pitch</strong>. Zero container border bleed ensures infrared fusers (PIAF / Zychem) swell only Braille dots.</p>
                    </div>
                    <div class="val-card">
                      <h4>📏 50mm Calibration Ruler</h4>
                      <p>Physical calibration notch on printable SVGs ensures educators catch printer driver auto-scaling (e.g. 94% fit-to-page) before thermal heating.</p>
                    </div>
                    <div class="val-card">
                      <h4>🎓 Reverse Quiz & Learning Lab</h4>
                      <p>Two-way verification flashcard mode enables sighted teachers to learn 6-dot Braille reading alongside their students.</p>
                    </div>
                    <div class="val-card">
                      <h4>⚡ Sub-5ms Transliteration</h4>
                      <p>Transliteration and DOM updates execute in <strong>&lt; 5 ms</strong> (benchmark: 4.10 ms for 500 characters), enabling fluent sighted-teacher typing without latency.</p>
                    </div>
                  </div>

                  <!-- Resource Efficiency & Environmental Sustainability in Central Asia -->
                  <div class="case-note-card" style="border-left: 4px solid #f59e0b; margin-top: 18px;">
                    <div class="case-note-header">
                      <strong>Resource Efficiency & Sustainability in Central Asia</strong>
                      <span class="case-note-tag">Less Wasted Swell Paper</span>
                    </div>
                    <p>
                      Microcapsule swell paper (Zychem / PIAF) is expensive and has to be imported into Central Asia. When a printer silently applies "Fit to Printable Area" scaling (often around 94%), the dot spacing is wrong and the sheet is wasted once it goes through the heater. AlifBraille’s built-in <strong>50mm calibration ruler check</strong> and interactive <strong>Swell Simulation mode (Alt+V)</strong> serve as vital material-waste reduction mechanisms: teachers verify margins and 1:1 scale before heating, so fewer sheets are wasted and a school's paper budget goes further.
                    </p>
                  </div>

                  <p class="impact-link-p">
                    📄 Full statement, pitch deck & methodology:
                    <a href="./deliverables/student-impact-statement.md" target="_blank" rel="noopener"><strong>deliverables/student-impact-statement.md</strong></a> |
                    <a href="./deliverables/pitch-deck.md" target="_blank" rel="noopener"><strong>deliverables/pitch-deck.md</strong></a>
                  </p>
                </section>
              </div>

              <!-- PANEL 4: Institutional Expansion Roadmap (12 Regions) -->
              <div id="creator-panel-roadmap" class="creator-tab-panel" role="tabpanel" aria-labelledby="creator-tab-roadmap" hidden>
                <section class="modal-section">
                  <h3 class="section-title">4. Roadmap: From a Working Tool to Every Region</h3>
                  <p>
                    AlifBraille is a free static web page, so it can grow from one school to the whole country without new infrastructure. The plan below starts in Tashkent and expands to Uzbekistan's regions and the Republic of Karakalpakstan. Long term, the aim is to work with the Ministry of Preschool and School Education so that accessible materials are part of the normal process.
                  </p>
                  <div class="roadmap-timeline" style="display: flex; flex-direction: column; gap: 14px; margin: 18px 0;">
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 1: Tashkent School Pilot</strong>
                        <span class="case-note-tag" style="background: #2563eb; color: #fff;">Months 1–3</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        The tool is built and tested. Next: a classroom pilot with a specialized school for visually impaired students in Tashkent, converting state-exam practice sets with teachers and measuring prep time, errors caught and student reading accuracy.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 2: Teacher Workshops & Open Sheet Library</strong>
                        <span class="case-note-tag" style="background: #059669; color: #fff;">Months 4–6</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Hands-on workshops on the full workflow (convert, audio check, swell print, 50mm ruler check) and a free public library of ready-made Latin Braille practice sheets.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 3: Regional Expansion Across Uzbekistan</strong>
                        <span class="case-note-tag" style="background: #d97706; color: #fff;">Months 7–9</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Reach specialized schools in other regions (Samarkand, the Fergana Valley, Bukhara, and on to all regions and Karakalpakstan), adding core subjects: native language, literature, history. Present results to the Ministry of Preschool and School Education.
                      </p>
                    </div>
                    <div class="roadmap-phase-card" style="background: var(--color-bg-elevated); border: 1px solid var(--color-border); border-left: 4px solid #8b5cf6; padding: 14px 16px; border-radius: 6px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <strong>Phase 4: Exam Materials & Related Languages</strong>
                        <span class="case-note-tag" style="background: #7c3aed; color: #fff;">Months 10–12</span>
                      </div>
                      <p style="margin: 0; font-size: 0.9rem; color: var(--color-text-secondary);">
                        Offer the State Testing Center (DTM) a free way to produce tactile Latin Braille exam booklets and sighted-proctor answer keys. Add rules for related Latin-script languages (Karakalpak, Kazakh Latin).
                      </p>
                    </div>
                  </div>

                  <p class="impact-link-p">
                    📄 Full statement, pitch deck & methodology:
                    <a href="./deliverables/student-impact-statement.md" target="_blank" rel="noopener"><strong>deliverables/student-impact-statement.md</strong></a> |
                    <a href="./deliverables/pitch-deck.md" target="_blank" rel="noopener"><strong>deliverables/pitch-deck.md</strong></a>
                  </p>
                </section>
              </div>
                </section>
              </div>
            </div>

            <div class="modal-footer">
              <button id="modal-footer-close-btn" class="toggle-button" type="button">Yopish / Close</button>
            </div>
          </div>
        </dialog>
      </div>
    `;
  }

  const inputEl = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
  const outputEl = root.querySelector<HTMLElement>('#braille-output')!;
  const presetSelect = root.querySelector<HTMLSelectElement>('#preset-select')!;
  const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
  const contrastToggle = root.querySelector<HTMLButtonElement>('#high-contrast-toggle');
  const langToggleBtn = root.querySelector<HTMLButtonElement>('#lang-toggle-btn');
  const aboutCreatorBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn');
  const charCounter = root.querySelector<HTMLElement>('#char-counter');
  const skipLink = root.querySelector<HTMLAnchorElement>('.skip-link');
  const aboutModal = root.querySelector<HTMLDialogElement>('#about-creator-modal');
  const modalCloseBtn = root.querySelector<HTMLButtonElement>('#modal-close-btn');
  const modalFooterCloseBtn = root.querySelector<HTMLButtonElement>('#modal-footer-close-btn');
  const tactileMetaEl = root.querySelector<HTMLElement>('#tactile-print-meta');

  // Swell Simulation State & Handlers
  let isSwellSimulationActive = false;

  function toggleSwellSimulation(forceState?: boolean) {
    isSwellSimulationActive = typeof forceState === 'boolean' ? forceState : !isSwellSimulationActive;

    outputEl.classList.toggle('swell-simulation-active', isSwellSimulationActive);

    const previewBtn = root.querySelector<HTMLButtonElement>('#swell-preview-btn');
    if (previewBtn) {
      previewBtn.setAttribute('aria-pressed', isSwellSimulationActive ? 'true' : 'false');
      previewBtn.classList.toggle('active', isSwellSimulationActive);
    }

    let banner = root.querySelector<HTMLElement>('#swell-simulation-banner');
    let ruler = root.querySelector<HTMLElement>('#swell-simulation-ruler');

    if (isSwellSimulationActive) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'swell-simulation-banner';
        banner.className = 'swell-simulation-banner';
        banner.setAttribute('role', 'status');
        banner.innerHTML = `
          <div class="sim-banner-left">
            <span class="sim-pill">👁️ Swell Simulation</span>
            <span class="sim-meta">${
              currentLang === 'en'
                ? 'A4 Sheet • 15mm Margins • 2.5mm Marburg Dot Pitch • ~0.5mm 3D Relief'
                : 'A4 Sahifa • 15mm Hoshiya • 2.5mm Nuqta Masofasi • ~0.5mm 3D Qavariqlik'
            }</span>
          </div>
          <div class="sim-banner-right">
            <span class="sim-ruler-notch">📏 50mm Calibration Notch Active</span>
          </div>
        `;
        outputEl.parentNode?.insertBefore(banner, outputEl);
      }
      if (!ruler) {
        ruler = document.createElement('div');
        ruler.id = 'swell-simulation-ruler';
        ruler.className = 'simulation-calibration-ruler';
        ruler.innerHTML = `
          <div class="sim-ruler-ticks"></div>
          <span class="sim-ruler-legend">${
            currentLang === 'en'
              ? '50mm Physical Calibration Scale (Verify 1:1 scale before fuser)'
              : '50mm Fizik Kalibrlash Shkalasi (1:1 masshtabni tekshiring)'
          }</span>
        `;
        outputEl.appendChild(ruler);
      }
      if (liveStatus) {
        liveStatus.textContent = STRINGS[currentLang].statusSimulationOn;
      }
    } else {
      if (banner) banner.remove();
      if (ruler) ruler.remove();
      if (liveStatus) {
        liveStatus.textContent = STRINGS[currentLang].statusSimulationOff;
      }
    }
  }

  // Mount SVG export, swell preview, and print controls into export container
  const exportContainer =
    root.querySelector<HTMLElement>('#export-controls-container') ||
    root.querySelector<HTMLElement>('.panel-actions');
  let exportControls: { downloadBtn: HTMLButtonElement; printBtn: HTMLButtonElement; previewBtn: HTMLButtonElement } | null = null;
  if (exportContainer && !exportContainer.querySelector('.export-controls')) {
    exportControls = setupExportControls(
      exportContainer,
      () => {
        const items = textToTactileItems(inputEl.value);
        return items.map((item, idx) => ({
          index: idx,
          char: item.char,
          brailleChar: item.braille,
          braille: item.braille,
          dots: decodeBrailleDots(item.braille),
          isSpace: item.char === ' ' || item.braille === '⠀',
        }));
      },
      {
        onTogglePreview: (active) => {
          toggleSwellSimulation(active);
        },
      }
    );
    exportControls.downloadBtn.addEventListener('click', () => {
      if (liveStatus) {
        liveStatus.textContent = currentLang === 'en'
          ? 'Tactile Braille SVG file downloaded successfully.'
          : 'Brayl taktil SVG fayli yuklab olindi.';
      }
    });
    exportControls.printBtn.addEventListener('click', () => {
      if (liveStatus) {
        liveStatus.textContent = currentLang === 'en'
          ? 'Browser print dialog opened for swell paper.'
          : 'Chop etish dialogi ochildi.';
      }
    });
  }

  /**
   * Accessible Speech Controller wrapper supporting native Web Speech API
   * with automatic cadence fallback for headless test environments.
   */
  class AccessibleSpeechController implements ISpeechController {
    private _state: AudioPlaybackState = 'idle';
    private _activeTimer: any = null;
    private _baseController: ISpeechController;

    constructor(baseController: ISpeechController) {
      this._baseController = baseController;
    }

    async speak(text: string, onBoundary?: (e: SpeechBoundaryEvent) => void): Promise<void> {
      this._state = 'playing';

      return new Promise<void>((resolve) => {
        let nativeStarted = false;
        if (
          typeof window !== 'undefined' &&
          'speechSynthesis' in window &&
          window.speechSynthesis.getVoices().length > 0
        ) {
          try {
            const synth = window.speechSynthesis;
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'uz-UZ';
            utterance.rate = 0.95;

            utterance.onboundary = (event: SpeechSynthesisEvent) => {
              if (this._state !== 'playing') return;
              if (onBoundary) {
                onBoundary({
                  charIndex: event.charIndex,
                  charLength: event.charLength,
                  name: event.name || 'word',
                });
              }
            };

            utterance.onend = () => {
              this._state = 'idle';
              resolve();
            };

            utterance.onerror = () => {
              this._state = 'idle';
              resolve();
            };

            synth.speak(utterance);
            nativeStarted = synth.speaking || synth.pending;
          } catch {
            nativeStarted = false;
          }
        }

        if (!nativeStarted) {
          const wordRegex = /\S+/g;
          const matches: { word: string; index: number }[] = [];
          let m: RegExpExecArray | null;
          while ((m = wordRegex.exec(text)) !== null) {
            matches.push({ word: m[0], index: m.index });
          }

          if (matches.length === 0) {
            this._state = 'idle';
            resolve();
            return;
          }

          let wordIdx = 0;
          this._activeTimer = setInterval(() => {
            if (this._state !== 'playing' || wordIdx >= matches.length) {
              clearInterval(this._activeTimer);
              this._activeTimer = null;
              this._state = 'idle';
              resolve();
              return;
            }

            if (onBoundary && matches[wordIdx]) {
              onBoundary({
                charIndex: matches[wordIdx].index,
                charLength: matches[wordIdx].word.length,
                name: 'word',
                token: matches[wordIdx].word,
              });
            }
            wordIdx++;
          }, 300);
        }
      });
    }

    stop(): void {
      this._state = 'idle';
      if (this._activeTimer) {
        clearInterval(this._activeTimer);
        this._activeTimer = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      this._baseController.stop();
    }

    pause(): void {
      this._state = 'paused';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.pause();
        } catch {}
      }
    }

    resume(): void {
      this._state = 'playing';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch {}
      }
    }

    getState(): AudioPlaybackState {
      return this._state;
    }

    getVoice(): SpeechSynthesisVoice | null {
      return this._baseController.getVoice();
    }

    getPhoneticFallbackText(text: string): string {
      return this._baseController.getPhoneticFallbackText(text);
    }
  }

  // Accessible Speech Controller instance
  const baseController =
    (typeof window !== 'undefined' && (window as any).__speechController) ||
    new SpeechController();
  const speechController = new AccessibleSpeechController(baseController);

  // Mount Audio Controls if container is present
  const audioContainer =
    root.querySelector<HTMLElement>('#audio-controls-container') ||
    document.getElementById('audio-controls-container');
  let audioHandle: AudioControlsHandle | null = null;
  if (audioContainer && !audioContainer.querySelector('#audio-play-btn')) {
    audioHandle = (initAudioControls(audioContainer, speechController, () => inputEl.value) as AudioControlsHandle) || null;
  }

  // Initialize Braille Reverse Quiz & Two-Way Verification Modal
  const quizModal = initBrailleQuizModal({
    root,
    getSpeechController: () => speechController,
    getLang: () => currentLang,
  });

  const quizToggleBtn = root.querySelector<HTMLButtonElement>('#quiz-toggle-btn');
  quizToggleBtn?.addEventListener('click', () => {
    quizModal.open();
  });

  // Initialize 3-Step First Swell Print Teacher Tour Modal
  const tourModal = initSwellTourModal(root);
  const tourToggleBtn = root.querySelector<HTMLButtonElement>('#tour-toggle-btn');
  tourToggleBtn?.addEventListener('click', () => {
    tourModal.open();
  });

  // Initialize Sighted Proctor Answer Key Modal & Overlay
  const proctorModal = initProctorKeyModal(root);
  const proctorToggleBtn = root.querySelector<HTMLButtonElement>('#proctor-key-btn');
  proctorToggleBtn?.addEventListener('click', () => {
    proctorModal.open();
  });

  // Tab switching logic for About Creator Modal
  const creatorTabs = aboutModal?.querySelectorAll<HTMLButtonElement>('.creator-tab-btn') || [];
  const creatorPanels = aboutModal?.querySelectorAll<HTMLElement>('.creator-tab-panel') || [];

  function switchCreatorTab(tabId: string) {
    creatorTabs.forEach((tab) => {
      const isTarget = tab.id === tabId;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });
    creatorPanels.forEach((panel) => {
      const isTarget = panel.getAttribute('aria-labelledby') === tabId;
      panel.classList.toggle('active', isTarget);
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', 'true');
      }
    });
  }

  creatorTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchCreatorTab(tab.id));
    tab.addEventListener('keydown', (e: KeyboardEvent) => {
      const tabsArr = Array.from(creatorTabs);
      const idx = tabsArr.indexOf(tab);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = tabsArr[(idx + 1) % tabsArr.length];
        next.focus();
        next.click();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = tabsArr[(idx - 1 + tabsArr.length) % tabsArr.length];
        prev.focus();
        prev.click();
      }
    });
  });

  let highlightedCellIndex = -1;

  /**
   * Renders Marburg tactile page header cells (ALIF document heading and Braille page number ⠼⠁)
   * into the print metadata container for tactile orientation on swell paper.
   */
  function renderTactileHeader() {
    if (!tactileMetaEl) return;
    const headingItems = textToTactileItems('alif');
    const pageItems = textToTactileItems('1');

    tactileMetaEl.innerHTML = `
      <div class="tactile-meta-group tactile-meta-title" title="AlifBraille Marburg Sheet Header">
        <span class="tactile-meta-badge">Marburg Print Header</span>
        <span class="tactile-meta-label">${STRINGS[currentLang].metaDoc}</span>
        <div class="tactile-meta-cells tactile-meta-heading-cells"></div>
      </div>
      <div class="tactile-meta-group tactile-meta-page" title="Marburg Braille Page 1">
        <span class="tactile-meta-label">${STRINGS[currentLang].metaPage}</span>
        <div class="tactile-meta-cells tactile-meta-page-cells"></div>
      </div>
    `;

    const headingBox = tactileMetaEl.querySelector<HTMLElement>('.tactile-meta-heading-cells');
    const pageBox = tactileMetaEl.querySelector<HTMLElement>('.tactile-meta-page-cells');
    if (headingBox) renderBrailleGrid(headingBox, headingItems);
    if (pageBox) renderBrailleGrid(pageBox, pageItems);
  }

  function render(text: string) {
    const items = textToTactileItems(text);
    renderBrailleGrid(outputEl, items);
    highlightedCellIndex = -1;

    const charCount = text.length;
    const cellCount = items.length;

    if (charCounter) {
      charCounter.textContent = STRINGS[currentLang].charCount(charCount);
    }

    const previewBadge = root.querySelector<HTMLElement>('#tactile-cells-badge');
    if (previewBadge) {
      previewBadge.textContent = STRINGS[currentLang].tactileCellsBadge(cellCount);
    }

    if (liveStatus) {
      if (charCount === 0) {
        liveStatus.textContent = STRINGS[currentLang].statusEmpty;
      } else {
        liveStatus.textContent = STRINGS[currentLang].statusRendered(charCount, cellCount);
      }
    }
  }

  function handleInput() {
    render(inputEl.value);
  }

  function handlePresetChange() {
    const selectedId = presetSelect.value;
    const preset = PRESETS.find((p) => p.id === selectedId);
    if (preset) {
      inputEl.value = preset.text;
      render(preset.text);
      if (liveStatus) {
        const title = currentLang === 'en' && preset.titleEn ? preset.titleEn : preset.title;
        liveStatus.textContent = STRINGS[currentLang].statusPresetLoaded(title, preset.text.length);
      }
    }

    // Toggle Sighted Proctor Answer Key overlay banner on 10-Question State Exam preset
    const existingBanner = root.querySelector('#proctor-exam-banner');
    if (selectedId === 'state-entrance-exam-10q') {
      if (!existingBanner) {
        const banner = document.createElement('div');
        banner.id = 'proctor-exam-banner';
        banner.className = 'proctor-exam-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Sighted proctor banner');
        banner.innerHTML = `
          <div class="proctor-banner-content" style="display: flex; align-items: center; justify-content: space-between; background: rgba(2, 132, 199, 0.12); border: 1px solid #0284c7; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">📋</span>
              <span style="font-size: 0.9rem; line-height: 1.4;">
                <strong>${currentLang === 'en' ? 'Sighted Proctor Tool:' : 'Ko‘zi Ochiq Nazoratchi Vositalari:'}</strong>
                ${currentLang === 'en' ? 'Administering this 10-Question State Exam? Cross-reference Latin answers with Braille cell numbers.' : '10-savolli davlat imtihonini o‘tkazayapsizmi? Lotin javoblarini Brayl katakchalari bilan tekshiring.'}
              </span>
            </div>
            <button id="open-proctor-banner-btn" class="toggle-button" type="button" style="background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: bold; padding: 6px 12px; font-size: 0.85rem;">
              ${currentLang === 'en' ? 'View Proctor Key (Alt+K)' : 'Javoblar Kalitini Ochish (Alt+K)'}
            </button>
          </div>
        `;
        const workspaceGrid = root.querySelector('.workspace-grid');
        if (workspaceGrid && workspaceGrid.parentNode) {
          workspaceGrid.parentNode.insertBefore(banner, workspaceGrid);
        }
        banner.querySelector('#open-proctor-banner-btn')?.addEventListener('click', () => {
          proctorModal.open();
        });
      }
    } else {
      existingBanner?.remove();
    }
  }

  function handleContrastToggle() {
    const isHighContrast = root.classList.toggle('alif-high-contrast');
    if (contrastToggle) {
      contrastToggle.setAttribute('aria-pressed', String(isHighContrast));
    }
    if (liveStatus) {
      liveStatus.textContent = isHighContrast
        ? STRINGS[currentLang].statusHighContrastOn
        : STRINGS[currentLang].statusHighContrastOff;
    }
  }

  function handleLangToggle() {
    currentLang = currentLang === 'uz' ? 'en' : 'uz';
    const s = STRINGS[currentLang];

    // Update Header Tagline
    const taglineEl = root.querySelector<HTMLElement>('#header-tagline');
    if (taglineEl) taglineEl.textContent = s.tagline;
    const heroEyebrowEl = root.querySelector<HTMLElement>('#hero-eyebrow');
    if (heroEyebrowEl) heroEyebrowEl.textContent = s.heroEyebrow;
    const heroTitleEl = root.querySelector<HTMLElement>('#hero-title');
    if (heroTitleEl) heroTitleEl.innerHTML = s.heroTitle;
    const heroSubEl = root.querySelector<HTMLElement>('#hero-sub');
    if (heroSubEl) heroSubEl.textContent = s.heroSub;
    const heroStatsEl = root.querySelector<HTMLElement>('#hero-stats');
    if (heroStatsEl) heroStatsEl.innerHTML = s.heroStats.map((t) => `<li>${t}</li>`).join('');

    // Update Skip Link
    if (skipLink) skipLink.textContent = s.skipLink;

    // Update Presets Select Dropdown
    const curVal = presetSelect.value;
    presetSelect.setAttribute('aria-label', s.presetAria);
    presetSelect.innerHTML = `
      <option value="">${s.presetDefault}</option>
      ${PRESETS.map((p) => {
        const title = currentLang === 'en' && p.titleEn ? p.titleEn : p.title;
        return `<option value="${p.id}" ${p.id === curVal ? 'selected' : ''}>${title}</option>`;
      }).join('')}
    `;

    // Update Contrast Toggle
    if (contrastToggle) {
      contrastToggle.textContent = s.highContrast;
      contrastToggle.setAttribute('aria-label', s.highContrastAria);
    }

    // Update Language Toggle Button
    if (langToggleBtn) {
      langToggleBtn.textContent = s.langToggle;
      langToggleBtn.setAttribute('aria-label', s.langToggleAria);
    }

    // Update About Creator & Quiz Buttons
    if (aboutCreatorBtn) {
      aboutCreatorBtn.textContent = s.aboutCreatorBtn;
      aboutCreatorBtn.setAttribute('aria-label', s.aboutCreatorAria);
    }
    if (quizToggleBtn) {
      quizToggleBtn.textContent = s.quizBtn;
      quizToggleBtn.setAttribute('aria-label', s.quizBtnAria);
    }
    const prevBtn = root.querySelector<HTMLButtonElement>('#swell-preview-btn');
    if (prevBtn) {
      prevBtn.textContent = s.previewBtn;
      prevBtn.setAttribute('aria-label', s.previewBtnAria);
    }
    if (quizModal) {
      quizModal.setLang(currentLang);
    }
    if (isSwellSimulationActive) {
      const banner = root.querySelector<HTMLElement>('#swell-simulation-banner');
      if (banner) {
        const metaSpan = banner.querySelector<HTMLElement>('.sim-meta');
        if (metaSpan) {
          metaSpan.textContent = currentLang === 'en'
            ? 'A4 Sheet • 15mm Margins • 2.5mm Marburg Dot Pitch • ~0.5mm 3D Relief'
            : 'A4 Sahifa • 15mm Hoshiya • 2.5mm Nuqta Masofasi • ~0.5mm 3D Qavariqlik';
        }
      }
      const ruler = root.querySelector<HTMLElement>('#swell-simulation-ruler');
      if (ruler) {
        const legendSpan = ruler.querySelector<HTMLElement>('.sim-ruler-legend');
        if (legendSpan) {
          legendSpan.textContent = currentLang === 'en'
            ? '50mm Physical Calibration Scale (Verify 1:1 scale before fuser)'
            : '50mm Fizik Kalibrlash Shkalasi (1:1 masshtabni tekshiring)';
        }
      }
    }

    // Update Input Panel
    const inputHeadingEl = root.querySelector<HTMLElement>('#input-heading');
    if (inputHeadingEl) inputHeadingEl.textContent = s.inputHeading;
    inputEl.setAttribute('placeholder', s.placeholder);
    inputEl.setAttribute('aria-label', s.inputAria);

    // Update Output Panel
    const outputHeadingEl = root.querySelector<HTMLElement>('#output-heading');
    if (outputHeadingEl) outputHeadingEl.textContent = s.outputHeading;
    outputEl.setAttribute('aria-label', s.outputAria);

    // Update Export Buttons if rendered
    const dlBtn = root.querySelector<HTMLButtonElement>('#export-svg-btn');
    const prBtn = root.querySelector<HTMLButtonElement>('#print-sheet-btn');
    if (dlBtn) {
      dlBtn.textContent = s.exportSvg;
      dlBtn.setAttribute('aria-label', s.exportSvgAria);
    }
    if (prBtn) {
      prBtn.textContent = s.print;
      prBtn.setAttribute('aria-label', s.printAria);
    }

    // Update Audio Controls Language
    if (audioHandle) {
      audioHandle.setLanguage(currentLang);
    }

    // Update Swell Tour Button & Tour Modal Language
    const tourBtnEl = root.querySelector<HTMLButtonElement>('#tour-toggle-btn');
    if (tourBtnEl) {
      tourBtnEl.textContent = s.tourBtn;
      tourBtnEl.setAttribute('aria-label', s.tourBtnAria);
    }
    const hintEl = root.querySelector<HTMLElement>('#tactile-preview-mode-hint');
    if (hintEl) {
      hintEl.textContent = s.tactilePreviewHint;
    }
    tourModal.setLang(currentLang);

    // Update Proctor Key Button & Proctor Modal Language
    const proctorBtnEl = root.querySelector<HTMLButtonElement>('#proctor-key-btn');
    if (proctorBtnEl) {
      proctorBtnEl.textContent = s.proctorBtn;
      proctorBtnEl.setAttribute('aria-label', s.proctorBtnAria);
    }
    proctorModal.setLang(currentLang);

    // Update Tactile Header Labels
    renderTactileHeader();

    // Re-render character counts and announce
    render(inputEl.value);
    if (liveStatus) {
      liveStatus.textContent = s.statusLangSwitched;
    }
  }

  function openAboutModal() {
    if (!aboutModal) return;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }
    if (typeof aboutModal.showModal === 'function') {
      try {
        aboutModal.showModal();
      } catch {
        aboutModal.setAttribute('open', 'true');
      }
    } else {
      aboutModal.setAttribute('open', 'true');
    }
    aboutModal.classList.add('is-open');
    modalCloseBtn?.focus();
  }

  function closeAboutModal() {
    if (!aboutModal) return;
    if (typeof document !== 'undefined') {
      const quizModalEl = root.querySelector<HTMLDialogElement>('#braille-quiz-modal');
      const isQuizOpen = quizModalEl && (quizModalEl.hasAttribute('open') || (quizModalEl as any).open);
      const tourModalEl = root.querySelector<HTMLDialogElement>('#swell-tour-modal');
      const isTourOpen = tourModalEl && (tourModalEl.hasAttribute('open') || (tourModalEl as any).open);
      const proctorModalEl = root.querySelector<HTMLDialogElement>('#proctor-key-modal');
      const isProctorOpen = proctorModalEl && (proctorModalEl.hasAttribute('open') || (proctorModalEl as any).open);
      if (!isQuizOpen && !isTourOpen && !isProctorOpen) {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      }
    }
    if (typeof aboutModal.close === 'function') {
      try {
        aboutModal.close();
      } catch {
        aboutModal.removeAttribute('open');
      }
    } else {
      aboutModal.removeAttribute('open');
    }
    aboutModal.classList.remove('is-open');
    aboutCreatorBtn?.focus();
  }

  /**
   * Returns all focusable interactive controls within the application root in core tab order.
   * Preserves exact focus sequence [skipLink, presetSelect, contrastToggle, inputEl, outputEl]
   * for WCAG AAA cyclic traversal compliance without focus traps.
   */
  function getFocusableControls(): HTMLElement[] {
    const candidates: HTMLElement[] = [
      skipLink,
      presetSelect,
      contrastToggle,
      inputEl,
      outputEl,
    ].filter((el): el is HTMLElement => Boolean(el));

    return candidates.filter((el) => {
      return (
        el.tabIndex >= 0 &&
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true'
      );
    });
  }

  /**
   * Highlights a specific tactile cell within #braille-output and announces active dots.
   */
  function highlightTactileCell(index: number) {
    const cells = outputEl.querySelectorAll<HTMLElement>('.tactile-cell');
    if (cells.length === 0) return;

    // Constrain index within valid bounds
    const targetIndex = Math.max(0, Math.min(index, cells.length - 1));
    highlightedCellIndex = targetIndex;

    cells.forEach((cell, idx) => {
      if (idx === targetIndex) {
        cell.classList.add('tactile-cell--highlighted');
        const char = cell.getAttribute('data-char') || '';
        const braille = cell.getAttribute('data-braille') || '';
        const dots = decodeBrailleDots(braille);
        const activeDots = dots
          .map((active, i) => (active ? i + 1 : null))
          .filter((d): d is number => d !== null);

        const dotsDesc =
          activeDots.length > 0 ? `${activeDots.join(', ')}-nuqtalar` : 'bo‘sh katakcha';

        const charDesc = char === ' ' ? 'bo‘sh joy' : char === '\n' ? 'yangi qator' : char;
        if (liveStatus) {
          liveStatus.textContent = `Katakcha ${targetIndex + 1} / ${cells.length}: "${charDesc}", Brayl ${braille}, ${dotsDesc}.`;
        }
      } else {
        cell.classList.remove('tactile-cell--highlighted');
      }
    });
  }

  /**
   * Keyboard Navigation Manager
   * Coordinates Tab / Shift-Tab cycling to eliminate focus traps,
   * handles Alt accessibility shortcuts, and enables tactile cell traversal.
   */
  function handleKeyDown(event: KeyboardEvent) {
    // 1. Accessibility Shortcuts (Alt+H, Alt+I, Alt+O, Alt+P, Alt+S, Alt+C, Alt+L, Alt+E, Alt+A, Alt+K, Alt+T, Alt+V, Alt+Q)
    if (event.altKey && !event.ctrlKey && !event.metaKey) {
      const keyLower = event.key.toLowerCase();
      if (keyLower === 'h') {
        event.preventDefault();
        handleContrastToggle();
        return;
      }
      if (keyLower === 'e' || keyLower === 'm') {
        event.preventDefault();
        handleLangToggle();
        return;
      }
      if (keyLower === 'a') {
        event.preventDefault();
        openAboutModal();
        return;
      }
      if (keyLower === 'i') {
        event.preventDefault();
        inputEl.focus();
        return;
      }
      if (keyLower === 'o' || keyLower === 'b') {
        event.preventDefault();
        outputEl.focus();
        return;
      }
      if (keyLower === 'p') {
        event.preventDefault();
        presetSelect.focus();
        return;
      }
      if (keyLower === 's' || keyLower === 'd') {
        event.preventDefault();
        const exportBtn = root.querySelector<HTMLButtonElement>('#export-svg-btn');
        if (exportBtn) {
          exportBtn.click();
          if (liveStatus) {
            liveStatus.textContent = currentLang === 'en'
              ? 'Tactile Braille SVG file downloaded successfully.'
              : 'Brayl taktil SVG fayli yuklab olindi.';
          }
        }
        return;
      }
      if (keyLower === 'c') {
        event.preventDefault();
        const printBtn = root.querySelector<HTMLButtonElement>('#print-sheet-btn');
        if (printBtn) {
          printBtn.click();
          if (liveStatus) {
            liveStatus.textContent = currentLang === 'en'
              ? 'Browser print dialog opened for swell paper.'
              : 'Chop etish dialogi ochildi.';
          }
        }
        return;
      }
      if (keyLower === 'l') {
        event.preventDefault();
        ensureAudioUserGesture();
        const playBtn = document.querySelector<HTMLButtonElement>('#audio-play-btn');
        if (playBtn) {
          playBtn.click();
        }
        return;
      }
      if (keyLower === 'v') {
        event.preventDefault();
        toggleSwellSimulation();
        return;
      }
      if (keyLower === 'q') {
        event.preventDefault();
        quizModal.open();
        return;
      }
      if (keyLower === 't') {
        event.preventDefault();
        tourModal.open();
        return;
      }
      if (keyLower === 'k') {
        event.preventDefault();
        proctorModal.open();
        return;
      }
    }

    // Modal trap & Escape handling
    const quizModalEl = root.querySelector<HTMLDialogElement>('#braille-quiz-modal');
    const isQuizOpen = quizModalEl && (quizModalEl.hasAttribute('open') || (quizModalEl as any).open);
    const isAboutOpen =
      aboutModal &&
      (aboutModal.hasAttribute('open') ||
        (aboutModal as any).open ||
        aboutModal.classList.contains('is-open'));
    const tourModalEl = root.querySelector<HTMLDialogElement>('#swell-tour-modal');
    const isTourOpen =
      tourModalEl &&
      (tourModalEl.hasAttribute('open') ||
        (tourModalEl as any).open ||
        tourModalEl.classList.contains('is-open'));
    const proctorModalEl = root.querySelector<HTMLDialogElement>('#proctor-key-modal');
    const isProctorOpen =
      proctorModalEl &&
      (proctorModalEl.hasAttribute('open') ||
        (proctorModalEl as any).open ||
        proctorModalEl.classList.contains('is-open'));

    if (isQuizOpen || isAboutOpen || isTourOpen || isProctorOpen) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isQuizOpen) quizModal.close();
        else if (isAboutOpen) closeAboutModal();
        else if (isTourOpen) tourModal.close();
        else if (isProctorOpen) proctorModal.close();
        return;
      }

      // Explicit Tab-key focus trap inside active modal container
      if (event.key === 'Tab') {
        const activeDialog = isQuizOpen
          ? quizModalEl
          : isAboutOpen
          ? aboutModal
          : isTourOpen
          ? tourModalEl
          : proctorModalEl;
        if (activeDialog) {
          const focusables = Array.from(
            activeDialog.querySelectorAll<HTMLElement>(
              'button:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([aria-hidden="true"]), a[href], [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => {
            const panel = el.closest('.quiz-tab-panel, .creator-tab-panel');
            if (panel && !panel.classList.contains('active')) return false;
            return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0 || el.tabIndex >= 0;
          });

          if (focusables.length === 0) {
            event.preventDefault();
            return;
          }

          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement as HTMLElement | null;

          if (event.shiftKey) {
            if (active === first || !activeDialog.contains(active)) {
              event.preventDefault();
              last.focus();
            }
          } else {
            if (active === last || !activeDialog.contains(active)) {
              event.preventDefault();
              first.focus();
            }
          }
          event.stopPropagation();
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      const stopBtn = document.querySelector<HTMLButtonElement>('#audio-stop-btn');
      if (stopBtn && !stopBtn.disabled) {
        event.preventDefault();
        stopBtn.click();
        return;
      }
    }

    // 2. Tab and Shift-Tab focus management without focus traps
    if (event.key === 'Tab') {
      const focusables = getFocusableControls();
      if (focusables.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = active ? focusables.indexOf(active) : -1;

      let nextIndex: number;
      if (event.shiftKey) {
        // Backward navigation
        nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
      } else {
        // Forward navigation
        nextIndex = currentIndex >= focusables.length - 1 ? 0 : currentIndex + 1;
      }

      event.preventDefault();
      focusables[nextIndex].focus();
      return;
    }

    // 3. Arrow key tactile navigation when #braille-output has focus
    if (document.activeElement === outputEl) {
      const cells = outputEl.querySelectorAll<HTMLElement>('.tactile-cell');
      if (cells.length === 0) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        highlightTactileCell(highlightedCellIndex + 1);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        highlightTactileCell(highlightedCellIndex <= 0 ? 0 : highlightedCellIndex - 1);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        highlightTactileCell(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        highlightTactileCell(cells.length - 1);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        inputEl.focus();
        return;
      }
    }
  }

  // Attach event listeners
  inputEl.addEventListener('input', handleInput);
  presetSelect.addEventListener('change', handlePresetChange);
  if (contrastToggle) {
    contrastToggle.addEventListener('click', handleContrastToggle);
  }
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', handleLangToggle);
  }
  if (aboutCreatorBtn) {
    aboutCreatorBtn.addEventListener('click', openAboutModal);
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeAboutModal);
  }
  if (modalFooterCloseBtn) {
    modalFooterCloseBtn.addEventListener('click', closeAboutModal);
  }
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) closeAboutModal();
    });
  }

  root.addEventListener('keydown', handleKeyDown);

  // Initial render
  renderTactileHeader();
  render(inputEl.value);

  return {
    destroy() {
      inputEl.removeEventListener('input', handleInput);
      presetSelect.removeEventListener('change', handlePresetChange);
      if (contrastToggle) {
        contrastToggle.removeEventListener('click', handleContrastToggle);
      }
      if (langToggleBtn) {
        langToggleBtn.removeEventListener('click', handleLangToggle);
      }
      if (aboutCreatorBtn) {
        aboutCreatorBtn.removeEventListener('click', openAboutModal);
      }
      if (modalCloseBtn) {
        modalCloseBtn.removeEventListener('click', closeAboutModal);
      }
      if (modalFooterCloseBtn) {
        modalFooterCloseBtn.removeEventListener('click', closeAboutModal);
      }
      quizModal?.destroy();
      tourModal?.destroy();
      proctorModal?.destroy();
      root.removeEventListener('keydown', handleKeyDown);
    },
    updateText(text: string) {
      inputEl.value = text;
      render(text);
    },
  };
}

// Auto-initialize if running in browser and #app container exists
if (typeof document !== 'undefined') {
  const rootApp = document.getElementById('app');
  if (rootApp) {
    initApp(rootApp);
  }
}

if (typeof window !== 'undefined') {
  (window as any).highlightBrailleCell = highlightBrailleCell;
  (window as any).clearSpeechHighlights = clearSpeechHighlights;
  (window as any).initAudioControls = initAudioControls;
}

export { downloadTactileSvgFile, triggerPrintDialog, setupExportControls } from './export.js';
export { initAudioControls, buildCharToCellIndexMap } from './audio-controls.js';
export { highlightBrailleCell, clearSpeechHighlights } from './speech-highlighter.js';
