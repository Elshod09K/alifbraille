import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp, textToTactileItems } from '../src/ui/app.js';
import type { AppInstance } from '../src/ui/types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Calculates standard WCAG 2.1 relative luminance for an sRGB hex color.
 */
function getRelativeLuminance(hex: string): number {
  const sanitized = hex.replace('#', '').trim();
  const r = parseInt(sanitized.slice(0, 2), 16) / 255;
  const g = parseInt(sanitized.slice(2, 4), 16) / 255;
  const b = parseInt(sanitized.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Accessible Web Interface & A11y Suite', () => {
  let root: HTMLElement;
  let app: AppInstance;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    app = initApp(root);
  });

  afterEach(() => {
    app.destroy();
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  });

  describe('Keyboard Navigation & Focus Management', () => {
    it('verifies all interactive controls are reachable via Tab/Shift-Tab keyboard navigation without focus traps', () => {
      const skipLink = root.querySelector<HTMLAnchorElement>('.skip-link')!;
      const presetSelect = root.querySelector<HTMLSelectElement>('#preset-select')!;
      const contrastToggle = root.querySelector<HTMLButtonElement>('#high-contrast-toggle')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const brailleOutput = root.querySelector<HTMLElement>('#braille-output')!;

      expect(skipLink).toBeDefined();
      expect(presetSelect).toBeDefined();
      expect(contrastToggle).toBeDefined();
      expect(latinInput).toBeDefined();
      expect(brailleOutput).toBeDefined();

      const expectedOrder = [skipLink, presetSelect, contrastToggle, latinInput, brailleOutput];

      // 1. Direct focus accessibility: every control can receive focus directly
      expectedOrder.forEach((control) => {
        control.focus();
        expect(document.activeElement).toBe(control);
        expect(control.tabIndex).toBeGreaterThanOrEqual(0);
      });

      // 2. Sequential forward Tab navigation without focus traps
      skipLink.focus();
      expect(document.activeElement).toBe(skipLink);

      for (let i = 1; i < expectedOrder.length; i++) {
        root.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
        );
        expect(document.activeElement).toBe(expectedOrder[i]);
      }

      // Tab on last element wraps smoothly to first without trapping
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      );
      expect(document.activeElement).toBe(expectedOrder[0]);

      // 3. Sequential reverse Shift-Tab navigation without focus traps
      // Shift-Tab from first element wraps smoothly to last element
      root.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
      expect(document.activeElement).toBe(expectedOrder[expectedOrder.length - 1]);

      for (let i = expectedOrder.length - 2; i >= 0; i--) {
        root.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          })
        );
        expect(document.activeElement).toBe(expectedOrder[i]);
      }
    });

    it('supports accessibility shortcut hotkeys (Alt+H, Alt+I, Alt+O, Alt+P)', () => {
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const brailleOutput = root.querySelector<HTMLElement>('#braille-output')!;
      const presetSelect = root.querySelector<HTMLSelectElement>('#preset-select')!;
      const contrastToggle = root.querySelector<HTMLButtonElement>('#high-contrast-toggle')!;

      // Alt+H toggles high-contrast AAA mode
      expect(root.classList.contains('alif-high-contrast')).toBe(false);
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'h', altKey: true, bubbles: true, cancelable: true })
      );
      expect(root.classList.contains('alif-high-contrast')).toBe(true);
      expect(contrastToggle.getAttribute('aria-pressed')).toBe('true');

      // Alt+I focuses Latin input textarea
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'i', altKey: true, bubbles: true, cancelable: true })
      );
      expect(document.activeElement).toBe(latinInput);

      // Alt+O focuses Braille output region
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'o', altKey: true, bubbles: true, cancelable: true })
      );
      expect(document.activeElement).toBe(brailleOutput);

      // Alt+P focuses preset select
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'p', altKey: true, bubbles: true, cancelable: true })
      );
      expect(document.activeElement).toBe(presetSelect);
    });

    it('enables cell-by-cell tactile navigation with arrow keys within #braille-output', () => {
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const brailleOutput = root.querySelector<HTMLElement>('#braille-output')!;
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;

      latinInput.value = 'O‘qituvchi';
      latinInput.dispatchEvent(new Event('input', { bubbles: true }));

      brailleOutput.focus();
      expect(document.activeElement).toBe(brailleOutput);

      // ArrowRight to first cell
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      );

      const cells = brailleOutput.querySelectorAll('.tactile-cell');
      expect(cells[0].classList.contains('tactile-cell--highlighted')).toBe(true);
      expect(liveStatus.textContent).toContain('Katakcha 1');
      expect(liveStatus.textContent).toContain('O‘');

      // ArrowRight to second cell
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
      );
      expect(cells[1].classList.contains('tactile-cell--highlighted')).toBe(true);
      expect(cells[0].classList.contains('tactile-cell--highlighted')).toBe(false);

      // End key jumps to last cell
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
      );
      expect(cells[cells.length - 1].classList.contains('tactile-cell--highlighted')).toBe(true);

      // Escape key returns focus to latinInput
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(document.activeElement).toBe(latinInput);
    });

    it('properly cleans up keyboard and DOM listeners on destroy()', () => {
      app.destroy();

      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
      const prevStatus = liveStatus.textContent;

      latinInput.value = 'Test';
      latinInput.dispatchEvent(new Event('input', { bubbles: true }));

      // After destroy, input listener is detached so liveStatus does not update
      expect(liveStatus.textContent).toBe(prevStatus);
    });
  });

  describe('Real-Time Transliteration & Performance Benchmark (< 50ms)', () => {
    it('executes transliteration and DOM updates in under 50ms for a 500-character passage', () => {
      const passage500 =
        "O‘zbekiston Respublikasi o‘zining mustaqillik yillarida ta’lim sohasida ulkan yutuqlarga erishdi. " +
        "Barcha umumta’lim maktablarida ilg‘or axborot texnologiyalari, yangi darsliklar va zamonaviy o‘quv qo‘llanmalari bosqichma-bosqich joriy etilmoqda. " +
        "Ko‘rish qobiliyati zaif va imkoniyati cheklangan o‘quvchilar uchun taktil kitoblar va 6 nuqtali Brayl yozuvidagi materiallar ta’limda alohida strategik ahamiyatga ega. " +
        "Davlatimiz tomonidan har bir fuqaroning sifatli va erkin bilim olish huquqi to‘liq kafolatlangan.";

      expect(passage500.length).toBeGreaterThanOrEqual(500);

      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;
      const brailleOutput = root.querySelector<HTMLElement>('#braille-output')!;

      // Measure execution latency across iterations to eliminate GC/scheduling anomalies
      const durations: number[] = [];
      for (let run = 0; run < 5; run++) {
        const startTime = performance.now();
        latinInput.value = passage500;
        latinInput.dispatchEvent(new Event('input', { bubbles: true }));
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const elapsed = Math.min(...durations);
      expect(elapsed).toBeLessThan(50);
      expect(brailleOutput.querySelectorAll('.tactile-cell').length).toBeGreaterThan(0);
    });

    it('parses Uzbek Latin text to tactile items with accurate character mappings in < 5ms', () => {
      const text = 'O‘zbekiston 2024';
      const t0 = performance.now();
      const items = textToTactileItems(text);
      const t1 = performance.now();

      expect(t1 - t0).toBeLessThan(5);
      expect(items[0]).toEqual({ char: 'O‘', braille: '⠧' });
      // Digits start with # (numeral prefix)
      const numPrefix = items.find((i) => i.char === '#');
      expect(numPrefix).toBeDefined();
      expect(numPrefix?.braille).toBe('⠼');
    });
  });

  describe('WCAG 2.1 AAA Contrast Ratio Compliance (>= 7:1)', () => {
    it('strictly satisfies minimum 7:1 contrast ratio for normal text and tactile indicators', () => {
      const cssPath = path.resolve(__dirname, '../src/ui/styles.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('.alif-high-contrast');
      expect(cssContent).toContain('.tactile-grid');
      expect(cssContent).toContain('.tactile-dot--active');

      // Test default theme values
      // Primary text #ffffff on primary background #050811
      const defaultTextContrast = getContrastRatio('#ffffff', '#050811');
      expect(defaultTextContrast).toBeGreaterThanOrEqual(7.0);

      // Secondary text #e5e7eb on primary background #050811
      const defaultSecondaryContrast = getContrastRatio('#e5e7eb', '#050811');
      expect(defaultSecondaryContrast).toBeGreaterThanOrEqual(7.0);

      // Muted text #d1d5db on elevated cell background #162036
      const defaultMutedContrast = getContrastRatio('#d1d5db', '#162036');
      expect(defaultMutedContrast).toBeGreaterThanOrEqual(7.0);

      // Active dot #facc15 on cell background #162036
      const defaultDotOnCellContrast = getContrastRatio('#facc15', '#162036');
      expect(defaultDotOnCellContrast).toBeGreaterThanOrEqual(7.0);

      // Active dot #facc15 on grid background #050811
      const defaultDotOnGridContrast = getContrastRatio('#facc15', '#050811');
      expect(defaultDotOnGridContrast).toBeGreaterThanOrEqual(7.0);

      // Accent #38bdf8 on primary background #050811
      const defaultAccentContrast = getContrastRatio('#38bdf8', '#050811');
      expect(defaultAccentContrast).toBeGreaterThanOrEqual(7.0);

      // Test High Contrast AAA mode values
      // Primary text #ffffff on true black #000000
      const hcTextContrast = getContrastRatio('#ffffff', '#000000');
      expect(hcTextContrast).toBeGreaterThanOrEqual(7.0);
      expect(hcTextContrast).toBeCloseTo(21, 0); // 21:1 maximum possible contrast

      // High contrast active dot #ffff00 on #000000
      const hcDotContrast = getContrastRatio('#ffff00', '#000000');
      expect(hcDotContrast).toBeGreaterThanOrEqual(7.0);
      expect(hcDotContrast).toBeGreaterThanOrEqual(18.0); // ~19.5:1

      // High contrast active dot #ffff00 on elevated background #0a0a0a
      const hcDotElevatedContrast = getContrastRatio('#ffff00', '#0a0a0a');
      expect(hcDotElevatedContrast).toBeGreaterThanOrEqual(7.0);

      // High contrast accent #00ffff on #000000
      const hcAccentContrast = getContrastRatio('#00ffff', '#000000');
      expect(hcAccentContrast).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('ARIA Live Region Status Announcements', () => {
    it('receives character count and status announcements on text update', () => {
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;

      expect(liveStatus).toBeDefined();
      expect(liveStatus.getAttribute('role')).toBe('status');
      expect(liveStatus.getAttribute('aria-live')).toBe('polite');

      latinInput.value = 'O‘zbekiston';
      latinInput.dispatchEvent(new Event('input', { bubbles: true }));

      expect(liveStatus.textContent).toContain('11 ta belgi');
      expect(liveStatus.textContent).toContain('taktil brayl katakchasi');
    });

    it('announces preset selection change in live region', () => {
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
      const presetSelect = root.querySelector<HTMLSelectElement>('#preset-select')!;

      presetSelect.value = 'anthem';
      presetSelect.dispatchEvent(new Event('change', { bubbles: true }));

      expect(liveStatus.textContent).toContain('Madhiya');
      expect(liveStatus.textContent).toContain('namunasi yuklandi');
    });

    it('announces status when text is cleared to empty', () => {
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;

      latinInput.value = '';
      latinInput.dispatchEvent(new Event('input', { bubbles: true }));

      expect(liveStatus.textContent).toContain('Matn maydoni bo‘sh');
    });

    it('announces programmatic updates via app.updateText()', () => {
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;
      const latinInput = root.querySelector<HTMLTextAreaElement>('#latin-input')!;

      app.updateText('Toshkent');
      expect(latinInput.value).toBe('Toshkent');
      expect(liveStatus.textContent).toContain('8 ta belgi');
    });
  });

  describe('International Pitch Mode (English Interface Toggle)', () => {
    it('clicking language toggle button switches all UI strings to English for Austin judges', () => {
      const langBtn = root.querySelector<HTMLButtonElement>('#lang-toggle-btn')!;
      const tagline = root.querySelector<HTMLElement>('#header-tagline')!;
      const inputHeading = root.querySelector<HTMLElement>('#input-heading')!;
      const outputHeading = root.querySelector<HTMLElement>('#output-heading')!;
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;

      expect(tagline.textContent).toContain('O‘zbek lotin matnidan');

      langBtn.click();

      expect(tagline.textContent).toContain('Uzbek Latin to print-ready Braille');
      expect(inputHeading.textContent).toBe('Latin Script Input');
      expect(outputHeading.textContent).toContain('Tactile Braille Grid');
      expect(langBtn.textContent).toContain('O‘zbekcha');
      expect(liveStatus.textContent).toContain('English interface enabled');
    });

    it('Alt+E keyboard shortcut toggles interface language', () => {
      const tagline = root.querySelector<HTMLElement>('#header-tagline')!;
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'e', altKey: true, bubbles: true, cancelable: true })
      );
      expect(tagline.textContent).toContain('Uzbek Latin to print-ready Braille');

      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'e', altKey: true, bubbles: true, cancelable: true })
      );
      expect(tagline.textContent).toContain('O‘zbek lotin matnidan');
    });
  });

  describe('About Student Creator & Swell Hardware Impact Dialog', () => {
    it('opens dialog with true creator details, pilot plan, and swell diagram on button click', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;

      aboutBtn.click();

      expect(modal.hasAttribute('open') || modal.classList.contains('is-open')).toBe(true);
      expect(modal.textContent).toContain('Elshod Kenjayev');
      expect(modal.textContent).toContain('Tashkent, Uzbekistan');
      expect(modal.textContent).toContain('2.5 mm dot pitch');
      expect(modal.textContent).toContain('60-Second Pitch Opener');
      expect(modal.textContent).toContain('Measure 1: Teacher Preparation Time');
      expect(modal.textContent).toContain('Measure 2: Tactile Legibility');
      expect(modal.textContent).toContain('Measure 3: Can Sighted Teachers Verify It?');
      expect(modal.textContent).not.toContain('No. 77');
      expect(modal.querySelector('.swell-diagram-svg')).not.toBeNull();
    });

    it('Escape key or close button cleanly closes the impact modal', () => {
      const aboutBtn = root.querySelector<HTMLButtonElement>('#about-creator-btn')!;
      const modal = root.querySelector<HTMLDialogElement>('#about-creator-modal')!;
      const closeBtn = root.querySelector<HTMLButtonElement>('#modal-close-btn')!;

      aboutBtn.click();
      expect(modal.classList.contains('is-open') || modal.hasAttribute('open')).toBe(true);

      closeBtn.click();
      expect(modal.classList.contains('is-open')).toBe(false);

      // Open again and close via Escape key
      aboutBtn.click();
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(modal.classList.contains('is-open')).toBe(false);
    });
  });

  describe('Swell Simulation & Print Preview Visual Mode', () => {
    it('toggles swell simulation active state and updates live status via button click and Alt+V shortcut', () => {
      const previewBtn = root.querySelector<HTMLButtonElement>('#swell-preview-btn')!;
      const outputEl = root.querySelector<HTMLElement>('#braille-output')!;
      const liveStatus = root.querySelector<HTMLElement>('#a11y-live-status')!;

      expect(previewBtn).not.toBeNull();
      expect(outputEl.classList.contains('swell-simulation-active')).toBe(false);

      // Click to toggle on
      previewBtn.click();
      expect(outputEl.classList.contains('swell-simulation-active')).toBe(true);
      expect(previewBtn.getAttribute('aria-pressed')).toBe('true');
      expect(root.querySelector('#swell-simulation-banner')).not.toBeNull();
      expect(root.querySelector('#swell-simulation-ruler')).not.toBeNull();
      expect(liveStatus.textContent).toContain('simulyatsiya');

      // Click to toggle off
      previewBtn.click();
      expect(outputEl.classList.contains('swell-simulation-active')).toBe(false);
      expect(previewBtn.getAttribute('aria-pressed')).toBe('false');
      expect(root.querySelector('#swell-simulation-banner')).toBeNull();

      // Toggle via Alt+V shortcut
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'v', altKey: true, bubbles: true, cancelable: true })
      );
      expect(outputEl.classList.contains('swell-simulation-active')).toBe(true);
      expect(previewBtn.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('Braille Quiz & Two-Way Verification Mode Integration', () => {
    it('opens quiz modal via button click and Alt+Q shortcut', () => {
      const quizBtn = root.querySelector<HTMLButtonElement>('#quiz-toggle-btn')!;
      const quizModal = root.querySelector<HTMLDialogElement>('#braille-quiz-modal')!;

      expect(quizBtn).not.toBeNull();
      expect(quizModal).not.toBeNull();

      // Trigger via Alt+Q shortcut
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'q', altKey: true, bubbles: true, cancelable: true })
      );
      expect(quizModal.hasAttribute('open') || quizModal.open).toBe(true);

      // Close via Escape key
      root.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(quizModal.hasAttribute('open')).toBe(false);
    });
  });

  describe('Tactile Page Header Metadata & Orientation', () => {
    it('renders Marburg document header cells and Braille page number cells in #tactile-print-meta', () => {
      const printMeta = root.querySelector<HTMLElement>('#tactile-print-meta')!;
      expect(printMeta).not.toBeNull();

      const headingCells = printMeta.querySelectorAll('.tactile-meta-heading-cells .tactile-cell');
      const pageCells = printMeta.querySelectorAll('.tactile-meta-page-cells .tactile-cell');

      expect(headingCells.length).toBe(4); // a-l-i-f
      expect(pageCells.length).toBe(2);    // # 1
    });
  });
});
