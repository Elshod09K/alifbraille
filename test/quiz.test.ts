import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  decodeDotsToChar,
  QUIZ_FLASHCARDS,
  REVERSE_BRAILLE_MAP,
  initBrailleQuizModal,
} from '../src/ui/quiz.js';

describe('Reverse Braille Quiz & Two-Way Verification Suite', () => {
  describe('decodeDotsToChar (6-Dot Decoding to Uzbek Latin)', () => {
    it('decodes single dot 1 to Uzbek letter "a"', () => {
      const dots = [true, false, false, false, false, false];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('a');
      expect(result.braille).toBe('⠁');
      expect(result.dotNumbers).toEqual([1]);
      expect(result.isRegistered).toBe(true);
    });

    it('decodes dots 1-2 to Uzbek letter "b"', () => {
      const dots = [true, true, false, false, false, false];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('b');
      expect(result.braille).toBe('⠃');
      expect(result.dotNumbers).toEqual([1, 2]);
    });

    it('decodes dots 1-2-3-6 to Uzbek modified vowel "o‘"', () => {
      // 1 (bit 0), 2 (bit 1), 3 (bit 2), 6 (bit 5)
      const dots = [true, true, true, false, false, true];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('o‘');
      expect(result.braille).toBe('⠧');
      expect(result.dotNumbers).toEqual([1, 2, 3, 6]);
      expect(result.descriptionUz).toContain('O‘ maxsus unlisi');
    });

    it('decodes dots 1-2-4-5-6 to Uzbek modified consonant "g‘"', () => {
      // 1 (bit 0), 2 (bit 1), 4 (bit 3), 5 (bit 4), 6 (bit 5)
      const dots = [true, true, false, true, true, true];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('g‘');
      expect(result.braille).toBe('⠻');
      expect(result.dotNumbers).toEqual([1, 2, 4, 5, 6]);
      expect(result.descriptionUz).toContain('G‘ maxsus undoshi');
    });

    it('decodes dots 1-5-6 to Uzbek digraph "sh"', () => {
      // 1 (bit 0), 5 (bit 4), 6 (bit 5)
      const dots = [true, false, false, false, true, true];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('sh');
      expect(result.braille).toBe('⠱');
      expect(result.dotNumbers).toEqual([1, 5, 6]);
      expect(result.descriptionUz).toContain('SH digrafi');
    });

    it('decodes dots 1-2-3-4-5 to Uzbek digraph "ch"', () => {
      // 1, 2, 3, 4, 5
      const dots = [true, true, true, true, true, false];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('ch');
      expect(result.braille).toBe('⠟');
      expect(result.dotNumbers).toEqual([1, 2, 3, 4, 5]);
      expect(result.descriptionUz).toContain('CH digrafi');
    });

    it('decodes dot 3 to Uzbek tutuq belgisi (apostrophe)', () => {
      const dots = [false, false, true, false, false, false];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('’');
      expect(result.braille).toBe('⠄');
      expect(result.dotNumbers).toEqual([3]);
    });

    it('decodes dots 3-4-5-6 to Braille numeral prefix "#"', () => {
      const dots = [false, false, true, true, true, true];
      const result = decodeDotsToChar(dots);
      expect(result.char).toBe('#');
      expect(result.braille).toBe('⠼');
      expect(result.dotNumbers).toEqual([3, 4, 5, 6]);
    });

    it('handles all dots inactive gracefully', () => {
      const dots = [false, false, false, false, false, false];
      const result = decodeDotsToChar(dots);
      expect(result.braille).toBe('⠀');
      expect(result.dotNumbers).toEqual([]);
      expect(result.isRegistered).toBe(false);
    });
  });

  describe('QUIZ_FLASHCARDS Educational Pool', () => {
    it('contains comprehensive flashcards including special Uzbek characters', () => {
      expect(QUIZ_FLASHCARDS.length).toBeGreaterThanOrEqual(10);
      const specialCards = QUIZ_FLASHCARDS.filter((c) => c.category === 'special');
      expect(specialCards.length).toBeGreaterThanOrEqual(4);

      const shCard = specialCards.find((c) => c.char === 'sh');
      expect(shCard).toBeDefined();
      expect(shCard?.braille).toBe('⠱');
      expect(shCard?.activeDots).toEqual([1, 5, 6]);

      const ooCard = specialCards.find((c) => c.char === 'o‘');
      expect(ooCard).toBeDefined();
      expect(ooCard?.braille).toBe('⠧');
      expect(ooCard?.activeDots).toEqual([1, 2, 3, 6]);

      const ggCard = specialCards.find((c) => c.char === 'g‘');
      expect(ggCard).toBeDefined();
      expect(ggCard?.braille).toBe('⠻');
      expect(ggCard?.activeDots).toEqual([1, 2, 4, 5, 6]);
    });

    it('ensures every flashcard has 4 options with the target answer included', () => {
      QUIZ_FLASHCARDS.forEach((card) => {
        expect(card.options.length).toBe(4);
        expect(card.options).toContain(card.char);
        expect(card.explanationUz.length).toBeGreaterThan(10);
        expect(card.explanationEn.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Interactive Quiz Modal DOM & UI', () => {
    let root: HTMLElement;

    beforeEach(() => {
      root = document.createElement('div');
      document.body.appendChild(root);
    });

    afterEach(() => {
      if (root.parentNode) root.parentNode.removeChild(root);
      vi.restoreAllMocks();
    });

    it('initializes quiz modal dialog with accessible tabs and structure', () => {
      const handle = initBrailleQuizModal({ root });
      const modal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal');

      expect(modal).not.toBeNull();
      expect(modal?.getAttribute('role')).toBe('dialog');
      expect(modal?.getAttribute('aria-modal')).toBe('true');

      const tabFlash = modal?.querySelector('#quiz-tab-flashcards');
      const tabInsp = modal?.querySelector('#quiz-tab-inspector');
      expect(tabFlash).not.toBeNull();
      expect(tabInsp).not.toBeNull();

      handle.destroy();
    });

    it('evaluates answers correctly in Flashcards quiz mode and updates score', () => {
      const handle = initBrailleQuizModal({ root });
      const modal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal')!;

      const optionsGrid = modal.querySelector('#quiz-options-grid')!;
      const buttons = Array.from(optionsGrid.querySelectorAll<HTMLButtonElement>('.quiz-option-btn'));
      expect(buttons.length).toBe(4);

      // Find correct button
      const correctBtn = buttons.find((b) => b.dataset.option === 'sh');
      expect(correctBtn).toBeDefined();

      correctBtn!.click();

      // Feedback should show success
      const feedbackBox = modal.querySelector('#quiz-feedback-box')!;
      expect(feedbackBox.classList.contains('success')).toBe(true);
      expect(feedbackBox.textContent).toContain('To‘g‘ri');

      // Score badge updated
      const scoreBadge = modal.querySelector('#quiz-score-badge')!;
      expect(scoreBadge.textContent).toContain('1 / 1 (100%)');

      handle.destroy();
    });

    it('interactive dot matrix inspector toggles dots and updates Latin character in real-time', () => {
      const handle = initBrailleQuizModal({ root });
      const modal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal')!;

      // Switch to Inspector tab
      const tabInsp = modal.querySelector<HTMLButtonElement>('#quiz-tab-inspector')!;
      tabInsp.click();

      const panelInsp = modal.querySelector<HTMLElement>('#quiz-panel-inspector')!;
      expect(panelInsp.hidden).toBe(false);

      // Click Dot 1
      const dot1Btn = modal.querySelector<HTMLButtonElement>('.matrix-dot-btn[data-dot="1"]')!;
      dot1Btn.click();

      const latinResult = modal.querySelector<HTMLElement>('#inspector-latin-result')!;
      expect(latinResult.textContent).toBe('a');

      // Click Dot 2 -> 'b'
      const dot2Btn = modal.querySelector<HTMLButtonElement>('.matrix-dot-btn[data-dot="2"]')!;
      dot2Btn.click();
      expect(latinResult.textContent).toBe('b');

      // Clear dots
      const clearBtn = modal.querySelector<HTMLButtonElement>('#inspector-clear-btn')!;
      clearBtn.click();
      expect(latinResult.textContent).toBe('Bo‘shliq');

      handle.destroy();
    });

    it('switches language between Uzbek and English cleanly', () => {
      const handle = initBrailleQuizModal({ root });
      const modal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal')!;

      expect(modal.querySelector('.modal-title')?.textContent).toContain('Brayl Viktorinasi');

      handle.setLang('en');
      expect(modal.querySelector('.modal-title')?.textContent).toContain('Braille Quiz');
      expect(modal.querySelector('#quiz-tab-flashcards')?.textContent).toContain('Flashcards');

      handle.destroy();
    });
  });
});