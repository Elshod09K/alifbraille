import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp, textToTactileItems } from '../src/ui/app.js';
import { PRESETS } from '../src/ui/presets.js';
import { ensureAudioUserGesture } from '../src/ui/audio-controls.js';
import { initSwellTourModal } from '../src/ui/tour.js';
import { initBrailleQuizModal } from '../src/ui/quiz.js';
import { createTactileCellElement, renderBrailleGrid } from '../src/ui/tactile-cell.js';
import type { AppInstance } from '../src/ui/types.js';

describe('Polish Round 3 Verification Suite', () => {
  let root: HTMLElement;
  let app: AppInstance;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    app = initApp(root);
  });

  afterEach(() => {
    app.destroy();
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  });

  describe('1. User-Gesture Guard & Fallback Resilience', () => {
    it('executes user gesture guard without throwing on restrictive browser environments', () => {
      expect(() => ensureAudioUserGesture()).not.toThrow();
    });

    it('displays visual waveform indicator when audio playback starts', async () => {
      const playBtn = root.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const waveform = root.querySelector<HTMLElement>('#audio-waveform-indicator')!;

      latinInput.value = 'Salom O‘zbekiston';
      expect(waveform.classList.contains('active')).toBe(false);

      playBtn.click();
      expect(waveform.classList.contains('active')).toBe(true);

      const stopBtn = root.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
      stopBtn.click();
      expect(waveform.classList.contains('active')).toBe(false);
    });
  });

  describe('2. Modal Focus Trap & Background Isolation', () => {
    it('traps focus within Braille Quiz modal and prevents background input access', () => {
      const quizBtn = root.querySelector<HTMLButtonElement>('#quiz-toggle-btn')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;

      quizBtn.click();
      const quizModal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal')!;
      expect(quizModal.hasAttribute('open') || quizModal.classList.contains('is-open')).toBe(true);

      // Focus first element inside modal
      const tabFlash = quizModal.querySelector<HTMLButtonElement>('#quiz-tab-flashcards')!;
      tabFlash.focus();
      expect(document.activeElement).toBe(tabFlash);

      // Simulate Shift-Tab on first element: should wrap to last focusable in modal, NOT latinInput
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
      );
      expect(document.activeElement).not.toBe(latinInput);
      expect(quizModal.contains(document.activeElement)).toBe(true);

      // Close modal
      quizModal.querySelector<HTMLButtonElement>('#quiz-modal-close-btn')?.click();
    });

    it('locks background scrolling on body and html while modals are active', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      expect(document.body.classList.contains('modal-open')).toBe(true);
      expect(document.documentElement.classList.contains('modal-open')).toBe(true);

      const closeBtn = root.querySelector<HTMLButtonElement>('#modal-close-btn')!;
      closeBtn.click();

      expect(document.body.classList.contains('modal-open')).toBe(false);
      expect(document.documentElement.classList.contains('modal-open')).toBe(false);
    });
  });

  describe('3. Paragraph Wrapping & Tactile Cell Ribbon Fix', () => {
    it('creates paragraph newline elements with class tactile-cell--newline', () => {
      const newlineCell = createTactileCellElement('\n', '⠀', 0);
      expect(newlineCell.classList.contains('tactile-cell')).toBe(true);
      expect(newlineCell.classList.contains('tactile-cell--newline')).toBe(true);
      expect(newlineCell.getAttribute('data-char')).toBe('\n');
    });

    it('does not inflate tactile-meta-cells into large 260px tactile-grid containers', () => {
      const metaContainer = document.createElement('div');
      metaContainer.className = 'tactile-meta-cells';
      renderBrailleGrid(metaContainer, textToTactileItems('alif'));

      expect(metaContainer.classList.contains('tactile-grid')).toBe(false);
      expect(metaContainer.querySelectorAll('.tactile-cell').length).toBe(4);
    });

    it('renders 243-character preset with multi-line paragraph structure and cell counter update', async () => {
      const select = root.querySelector<HTMLSelectElement>('#preset-select')!;
      select.value = 'history-exam';
      select.dispatchEvent(new Event('change'));

      await new Promise((r) => setTimeout(r, 10));

      const cells = root.querySelectorAll('#braille-output .tactile-cell');
      expect(cells.length).toBeGreaterThan(200);

      const cellBadge = root.querySelector<HTMLElement>('#tactile-cells-badge')!;
      expect(cellBadge.textContent).toContain(String(cells.length));
    });
  });

  describe('4. About Creator Modal Tabbed Navigation & Media Showcase', () => {
    it('breaks content into scannable KPI summary cards and 3 tabbed panels', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      aboutBtn.click();

      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const kpis = modal.querySelectorAll('.creator-kpi-item');
      expect(kpis.length).toBeGreaterThanOrEqual(4);

      const tabPitch = modal.querySelector<HTMLButtonElement>('#creator-tab-pitch')!;
      const tabField = modal.querySelector<HTMLButtonElement>('#creator-tab-fieldnotes')!;
      const tabHardware = modal.querySelector<HTMLButtonElement>('#creator-tab-hardware')!;

      expect(tabPitch).not.toBeNull();
      expect(tabField).not.toBeNull();
      expect(tabHardware).not.toBeNull();

      // Switch to Field Notes tab
      tabField.click();
      expect(tabField.classList.contains('active')).toBe(true);
      expect(modal.querySelector('#creator-panel-fieldnotes')?.hasAttribute('hidden')).toBe(false);
      expect(modal.querySelector('#creator-panel-pitch')?.hasAttribute('hidden')).toBe(true);

      // Verify physical photo showcases
      const photoShowcases = modal.querySelectorAll('.physical-photo-showcase');
      expect(photoShowcases.length).toBeGreaterThanOrEqual(2);

      const photoSvgs = modal.querySelectorAll('.photo-render-svg');
      expect(photoSvgs.length).toBeGreaterThanOrEqual(2);

      modal.querySelector<HTMLButtonElement>('#modal-close-btn')?.click();
    });
  });

  describe('5. Turnkey 10-Question Standardized Exam Preset', () => {
    it('provides standardized entrance exam template with tactile question dividers', async () => {
      const exam10q = PRESETS.find((p) => p.id === 'state-entrance-exam-10q');
      expect(exam10q).toBeDefined();
      expect(exam10q!.text).toContain('DAVLAT TEST MARKAZI');
      expect(exam10q!.text).toContain('=== 1-SAVOL ===');
      expect(exam10q!.text).toContain('=== 10-SAVOL ===');
      expect(exam10q!.text).toContain('SAHIFA 2');

      const select = root.querySelector<HTMLSelectElement>('#preset-select')!;
      select.value = 'state-entrance-exam-10q';
      select.dispatchEvent(new Event('change'));

      await new Promise((r) => setTimeout(r, 10));

      const input = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      expect(input.value).toContain('=== 1-SAVOL ===');

      const newlineCells = root.querySelectorAll('#braille-output .tactile-cell--newline');
      expect(newlineCells.length).toBeGreaterThan(10);
    });
  });

  describe('6. 3-Step First Swell Print Teacher Tour', () => {
    it('initializes and navigates 3-step teacher onboarding tour', () => {
      const tourBtn = root.querySelector<HTMLButtonElement>('#tour-toggle-btn')!;
      expect(tourBtn).not.toBeNull();

      tourBtn.click();
      const tourModal = root.querySelector<HTMLDialogElement>('#swell-tour-modal')!;
      expect(tourModal.hasAttribute('open') || tourModal.classList.contains('is-open')).toBe(true);

      // Step 1 check
      const stepper = tourModal.querySelector('.tour-stepper')!;
      expect(stepper.textContent).toContain('1');

      // Navigate to Step 2 (50mm ruler inspection)
      const nextBtn = tourModal.querySelector<HTMLButtonElement>('#tour-next-btn')!;
      nextBtn.click();
      expect(tourModal.textContent).toContain('50mm');

      // Navigate to Step 3 (Thermal fuser)
      nextBtn.click();
      expect(tourModal.textContent).toContain('PIAF');

      // Finish tour
      nextBtn.click();
      expect(tourModal.hasAttribute('open')).toBe(false);
    });
  });
});
