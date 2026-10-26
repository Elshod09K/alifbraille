import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initApp } from '../src/ui/app.js';
import {
  ensureAudioUserGesture,
  getOrCreateAudioContext,
  setupGlobalGestureUnlock,
  resetAudioContextForTesting,
} from '../src/ui/audio-controls.js';
import { STATE_EXAM_PROCTOR_DATA, generateProctorKeyHtml } from '../src/ui/proctor-key.js';
import { PRESETS } from '../src/ui/presets.js';
import type { AppInstance } from '../src/ui/types.js';

describe('Polish Round 4 Verification Suite', () => {
  let root: HTMLElement;
  let app: AppInstance;

  beforeEach(() => {
    resetAudioContextForTesting();
    root = document.createElement('div');
    root.id = 'app-root';
    document.body.appendChild(root);
    app = initApp(root);
  });

  afterEach(() => {
    app.destroy();
    resetAudioContextForTesting();
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
    vi.restoreAllMocks();
  });

  describe('1. Web Speech API & iOS/Safari AudioContext Gesture Unlock', () => {
    it('initializes and unlocks AudioContext synchronously on user gesture', () => {
      let resumed = false;
      let bufferCreated = false;
      let sourceConnected = false;
      let sourceStarted = false;

      resetAudioContextForTesting();

      // Class-based Web Audio Mock
      class MockAudioContext {
        state = 'suspended';
        destination = {};
        async resume() {
          resumed = true;
        }
        createBuffer() {
          bufferCreated = true;
          return {};
        }
        createBufferSource() {
          return {
            buffer: null,
            connect: () => {
              sourceConnected = true;
            },
            start: () => {
              sourceStarted = true;
            },
          };
        }
      }

      (window as any).AudioContext = MockAudioContext;

      // Execute gesture unlock
      ensureAudioUserGesture();

      expect(resumed).toBe(true);
      expect(bufferCreated).toBe(true);
      expect(sourceConnected).toBe(true);
      expect(sourceStarted).toBe(true);
    });

    it('attaches global one-time gesture unlock listener to window', () => {
      resetAudioContextForTesting();
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      setupGlobalGestureUnlock();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        expect.objectContaining({ capture: true, once: true })
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.objectContaining({ capture: true, once: true })
      );
    });
  });

  describe('2. Verifiable KPI Summary & School Pilot Plan in Creator Modal', () => {
    it('displays the zero-cost KPI card in the top summary banner', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const fluencyCard = modal.querySelector('#kpi-fluency-item');
      expect(fluencyCard).not.toBeNull();
      expect(fluencyCard!.textContent).toContain('$0');
      expect(fluencyCard!.textContent).toContain('Cost to schools');

      // Total KPI count should now be 5
      const kpis = modal.querySelectorAll('.creator-kpi-item');
      expect(kpis.length).toBe(5);

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });

    it('lists the planned pilot measures, including student reading accuracy', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const tabField = modal.querySelector<HTMLButtonElement>('#creator-tab-fieldnotes')!;
      tabField.click();

      const panelField = modal.querySelector('#creator-panel-fieldnotes')!;
      expect(panelField.textContent).toContain('Measure 4: Student Reading Accuracy and Speed');
      expect(panelField.textContent).toContain('School Pilot Plan');

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });

    it('states the goal of the pilot', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const tabField = modal.querySelector<HTMLButtonElement>('#creator-tab-fieldnotes')!;
      tabField.click();

      const quoteCard = modal.querySelector('.student-quote-card');
      expect(quoteCard).not.toBeNull();
      expect(quoteCard!.textContent).toContain('The goal of the pilot');
      expect(quoteCard!.textContent).toContain('same alphabet the exam is written in');

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });
  });

  describe('3. Resource Efficiency & Environmental Sustainability in Central Asia', () => {
    it('highlights swell paper import cost and waste reduction in Hardware panel', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const tabHw = modal.querySelector<HTMLButtonElement>('#creator-tab-hardware')!;
      tabHw.click();

      const panelHw = modal.querySelector('#creator-panel-hardware')!;
      expect(panelHw.textContent).toContain('Resource Efficiency & Sustainability in Central Asia');
      expect(panelHw.textContent).toContain('Less Wasted Swell Paper');
      expect(panelHw.textContent).toContain('50mm calibration ruler check');
      expect(panelHw.textContent).toContain('material-waste reduction');

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });
  });

  describe('4. Institutional Expansion Roadmap across Uzbekistan 12 Regions', () => {
    it('provides active 4th tab and panel detailing Ministry engagement across 12 regions', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const tabRoadmap = modal.querySelector<HTMLButtonElement>('#creator-tab-roadmap')!;
      expect(tabRoadmap).not.toBeNull();
      expect(tabRoadmap.textContent).toContain('Roadmap');

      tabRoadmap.click();
      expect(tabRoadmap.classList.contains('active')).toBe(true);

      const panelRoadmap = modal.querySelector('#creator-panel-roadmap')!;
      expect(panelRoadmap.hasAttribute('hidden')).toBe(false);
      expect(panelRoadmap.textContent).toContain('Ministry of Preschool and School Education');
      expect(panelRoadmap.textContent).toContain('Phase 1: Tashkent School Pilot');
      expect(panelRoadmap.textContent).toContain('Phase 2: Teacher Workshops');
      expect(panelRoadmap.textContent).toContain('Phase 3: Regional Expansion Across Uzbekistan');
      expect(panelRoadmap.textContent).toContain('Phase 4: Exam Materials');
      expect(panelRoadmap.textContent).toContain('State Testing Center (DTM)');
      expect(panelRoadmap.textContent).toContain('Karakalpakstan');

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });
  });

  describe('5. Downloadable Sighted Proctor Answer Key Overlay (10-Question State Exam)', () => {
    it('has accessible proctor button in header and opens proctor key modal', () => {
      const proctorBtn = root.querySelector<HTMLButtonElement>('#proctor-key-btn')!;
      expect(proctorBtn).not.toBeNull();

      proctorBtn.click();
      const proctorModal = root.querySelector<HTMLDialogElement>('#proctor-key-modal')!;
      expect(proctorModal).not.toBeNull();
      expect(proctorModal.hasAttribute('open') || proctorModal.classList.contains('is-open')).toBe(true);

      const title = proctorModal.querySelector('#proctor-key-modal-title');
      expect(title!.textContent).toContain('Nazoratchi Javoblar Kaliti');

      const rows = proctorModal.querySelectorAll('.proctor-key-table tbody tr');
      expect(rows.length).toBe(10);

      proctorModal.querySelector<HTMLButtonElement>('#proctor-modal-close-btn')?.click();
    });

    it('opens proctor key via hotkey Alt+K', () => {
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', altKey: true, bubbles: true }));

      const proctorModal = root.querySelector<HTMLDialogElement>('#proctor-key-modal')!;
      expect(proctorModal.hasAttribute('open') || proctorModal.classList.contains('is-open')).toBe(true);

      proctorModal.querySelector<HTMLButtonElement>('#proctor-modal-close-btn')?.click();
    });

    it('renders proctor exam banner when 10-Question State Exam preset is loaded', () => {
      const select = root.querySelector<HTMLSelectElement>('#preset-select')!;
      select.value = 'state-entrance-exam-10q';
      select.dispatchEvent(new Event('change'));

      const banner = root.querySelector<HTMLElement>('#proctor-exam-banner');
      expect(banner).not.toBeNull();
      expect(banner!.textContent).toContain('Ko‘zi Ochiq Nazoratchi Vositalari');

      const bannerBtn = banner!.querySelector<HTMLButtonElement>('#open-proctor-banner-btn')!;
      expect(bannerBtn).not.toBeNull();
      bannerBtn.click();

      const proctorModal = root.querySelector<HTMLDialogElement>('#proctor-key-modal')!;
      expect(proctorModal.hasAttribute('open') || proctorModal.classList.contains('is-open')).toBe(true);

      proctorModal.querySelector<HTMLButtonElement>('#proctor-modal-close-btn')?.click();
    });

    it('cross-references all 10 questions with Latin answers, Braille cell numbers and characters', () => {
      expect(STATE_EXAM_PROCTOR_DATA.length).toBe(10);

      const q1 = STATE_EXAM_PROCTOR_DATA[0];
      expect(q1.questionUz).toContain('asoschisi kim');
      expect(q1.correctOption).toBe('B');
      expect(q1.answerTextUz).toBe('Alisher Navoiy');
      expect(q1.optionBrailleChar).toBe('⠃');
      expect(q1.cellPositionUz).toContain('4-qator');

      const q5 = STATE_EXAM_PROCTOR_DATA[4];
      expect(q5.correctOption).toBe('A');
      expect(q5.answerTextUz).toBe('shoshilinch');
      expect(q5.optionBrailleChar).toBe('⠁');
      expect(q5.charBreakdown.some((c) => c.char === 'sh' && c.braille === '⠱')).toBe(true);
      expect(q5.charBreakdown.some((c) => c.char === 'ch' && c.braille === '⠟')).toBe(true);

      const q7 = STATE_EXAM_PROCTOR_DATA[6];
      expect(q7.answerTextUz).toBe('1992-yil');
      expect(q7.charBreakdown[0].braille).toBe('⠼'); // Braille number sign
    });

    it('generates standalone valid HTML answer key for offline download and printing', () => {
      const htmlUz = generateProctorKeyHtml('uz');
      expect(htmlUz).toContain('<!DOCTYPE html>');
      expect(htmlUz).toContain('Nazoratchi Javoblar Kaliti');
      expect(htmlUz).toContain('Alisher Navoiy');
      expect(htmlUz).toContain('bog‘bon');
      expect(htmlUz).toContain('1992-yil');

      const htmlEn = generateProctorKeyHtml('en');
      expect(htmlEn).toContain('Sighted Proctor Answer Key');
      expect(htmlEn).toContain('SXSW EDU');
      expect(htmlEn).toContain('Alisher Navoiy');
    });
  });
});
