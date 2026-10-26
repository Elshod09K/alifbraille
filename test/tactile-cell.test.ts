import { describe, it, expect, beforeEach } from 'vitest';
import {
  decodeBrailleDots,
  createTactileCellElement,
  renderBrailleGrid,
} from '../src/ui/tactile-cell.js';

describe('Tactile Cell Renderer and Dot Decoder', () => {
  describe('decodeBrailleDots() Bitmask Activation (Unicode Braille Range U+2800..U+283F)', () => {
    it('correctly decodes each individual dot (dots 1 through 6)', () => {
      // Dot 1: 0x2800 + 0x01 = 0x2801 ('⠁')
      expect(decodeBrailleDots('⠁')).toEqual([true, false, false, false, false, false]);

      // Dot 2: 0x2800 + 0x02 = 0x2802 ('⠂')
      expect(decodeBrailleDots('⠂')).toEqual([false, true, false, false, false, false]);

      // Dot 3: 0x2800 + 0x04 = 0x2804 ('⠄')
      expect(decodeBrailleDots('⠄')).toEqual([false, false, true, false, false, false]);

      // Dot 4: 0x2800 + 0x08 = 0x2808 ('⠈')
      expect(decodeBrailleDots('⠈')).toEqual([false, false, false, true, false, false]);

      // Dot 5: 0x2800 + 0x10 = 0x2810 ('⠐')
      expect(decodeBrailleDots('⠐')).toEqual([false, false, false, false, true, false]);

      // Dot 6: 0x2800 + 0x20 = 0x2820 ('⠠')
      expect(decodeBrailleDots('⠠')).toEqual([false, false, false, false, false, true]);
    });

    it('correctly decodes standard Latin alphabet Braille characters', () => {
      // 'a' -> ⠁ (dot 1)
      expect(decodeBrailleDots('⠁')).toEqual([true, false, false, false, false, false]);
      // 'b' -> ⠃ (dots 1, 2)
      expect(decodeBrailleDots('⠃')).toEqual([true, true, false, false, false, false]);
      // 'c' -> ⠉ (dots 1, 4)
      expect(decodeBrailleDots('⠉')).toEqual([true, false, false, true, false, false]);
      // 'd' -> ⠙ (dots 1, 4, 5)
      expect(decodeBrailleDots('⠙')).toEqual([true, false, false, true, true, false]);
      // 'e' -> ⠑ (dots 1, 5)
      expect(decodeBrailleDots('⠑')).toEqual([true, false, false, false, true, false]);
      // 'f' -> ⠋ (dots 1, 2, 4)
      expect(decodeBrailleDots('⠋')).toEqual([true, true, false, true, false, false]);
      // 'g' -> ⠛ (dots 1, 2, 4, 5)
      expect(decodeBrailleDots('⠛')).toEqual([true, true, false, true, true, false]);
      // 'h' -> ⠓ (dots 1, 2, 5)
      expect(decodeBrailleDots('⠓')).toEqual([true, true, false, false, true, false]);
      // 'i' -> ⠊ (dots 2, 4)
      expect(decodeBrailleDots('⠊')).toEqual([false, true, false, true, false, false]);
      // 'j' -> ⠚ (dots 2, 4, 5)
      expect(decodeBrailleDots('⠚')).toEqual([false, true, false, true, true, false]);
      // 'k' -> ⠅ (dots 1, 3)
      expect(decodeBrailleDots('⠅')).toEqual([true, false, true, false, false, false]);
      // 'l' -> ⠇ (dots 1, 2, 3)
      expect(decodeBrailleDots('⠇')).toEqual([true, true, true, false, false, false]);
      // 'm' -> ⠍ (dots 1, 3, 4)
      expect(decodeBrailleDots('⠍')).toEqual([true, false, true, true, false, false]);
      // 'n' -> ⠝ (dots 1, 3, 4, 5)
      expect(decodeBrailleDots('⠝')).toEqual([true, false, true, true, true, false]);
      // 'o' -> ⠕ (dots 1, 3, 5)
      expect(decodeBrailleDots('⠕')).toEqual([true, false, true, false, true, false]);
      // 'p' -> ⠏ (dots 1, 2, 3, 4)
      expect(decodeBrailleDots('⠏')).toEqual([true, true, true, true, false, false]);
      // 'q' -> ⠟ (dots 1, 2, 3, 4, 5)
      expect(decodeBrailleDots('⠟')).toEqual([true, true, true, true, true, false]);
      // 'r' -> ⠗ (dots 1, 2, 3, 5)
      expect(decodeBrailleDots('⠗')).toEqual([true, true, true, false, true, false]);
      // 's' -> ⠎ (dots 2, 3, 4)
      expect(decodeBrailleDots('⠎')).toEqual([false, true, true, true, false, false]);
      // 't' -> ⠞ (dots 2, 3, 4, 5)
      expect(decodeBrailleDots('⠞')).toEqual([false, true, true, true, true, false]);
      // 'u' -> ⠥ (dots 1, 3, 6)
      expect(decodeBrailleDots('⠥')).toEqual([true, false, true, false, false, true]);
      // 'v' / 'w' -> ⠺ (dots 2, 4, 5, 6)
      expect(decodeBrailleDots('⠺')).toEqual([false, true, false, true, true, true]);
      // 'x' -> ⠭ (dots 1, 3, 4, 6)
      expect(decodeBrailleDots('⠭')).toEqual([true, false, true, true, false, true]);
      // 'y' -> ⠽ (dots 1, 3, 4, 5, 6)
      expect(decodeBrailleDots('⠽')).toEqual([true, false, true, true, true, true]);
      // 'z' -> ⠵ (dots 1, 3, 5, 6)
      expect(decodeBrailleDots('⠵')).toEqual([true, false, true, false, true, true]);
    });

    it('correctly decodes Uzbek modified letters (o‘, g‘)', () => {
      // 'oʻ' / 'o‘' -> '⠧' (dots 1, 2, 3, 6)
      expect(decodeBrailleDots('⠧')).toEqual([true, true, true, false, false, true]);

      // 'gʻ' / 'g‘' -> '⠻' (dots 1, 2, 4, 5, 6)
      expect(decodeBrailleDots('⠻')).toEqual([true, true, false, true, true, true]);
    });

    it('correctly decodes Uzbek digraphs (sh, ch)', () => {
      // 'sh' -> '⠱' (dots 1, 5, 6)
      expect(decodeBrailleDots('⠱')).toEqual([true, false, false, false, true, true]);

      // 'ch' -> '⠟' (dots 1, 2, 3, 4, 5)
      expect(decodeBrailleDots('⠟')).toEqual([true, true, true, true, true, false]);
    });

    it('correctly decodes numerals and number sign prefix', () => {
      // Braille numeral sign prefix '⠼' (dots 3, 4, 5, 6)
      expect(decodeBrailleDots('⠼')).toEqual([false, false, true, true, true, true]);

      // Digit '1' in Braille matches '⠁' (dot 1)
      expect(decodeBrailleDots('⠁')).toEqual([true, false, false, false, false, false]);

      // Digit '2' matches '⠃' (dots 1, 2)
      expect(decodeBrailleDots('⠃')).toEqual([true, true, false, false, false, false]);

      // Digit '9' in Braille matches '⠊' (dots 2, 4)
      expect(decodeBrailleDots('⠊')).toEqual([false, true, false, true, false, false]);

      // Digit '0' in Braille matches '⠚' (dots 2, 4, 5)
      expect(decodeBrailleDots('⠚')).toEqual([false, true, false, true, true, false]);
    });

    it('correctly decodes blank cells, whitespace, and invalid inputs', () => {
      // U+2800 Braille pattern blank
      expect(decodeBrailleDots('⠀')).toEqual([false, false, false, false, false, false]);

      // Empty string
      expect(decodeBrailleDots('')).toEqual([false, false, false, false, false, false]);

      // Full 6-dot cell (0x283F: '⠿')
      expect(decodeBrailleDots('⠿')).toEqual([true, true, true, true, true, true]);
    });
  });

  describe('decodeBrailleDots() Direct Latin / Digraph String Resolution', () => {
    it('correctly resolves Latin letters directly passed as text', () => {
      expect(decodeBrailleDots('a')).toEqual([true, false, false, false, false, false]);
      expect(decodeBrailleDots('b')).toEqual([true, true, false, false, false, false]);
      expect(decodeBrailleDots('c')).toEqual([true, false, false, true, false, false]);
      expect(decodeBrailleDots('d')).toEqual([true, false, false, true, true, false]);
      expect(decodeBrailleDots('l')).toEqual([true, true, true, false, false, false]);
    });

    it('correctly resolves Uzbek modified letters with various apostrophes (o‘, g‘, oʻ, gʻ)', () => {
      // o' and variants (dots 1, 2, 3, 6)
      expect(decodeBrailleDots("o'")).toEqual([true, true, true, false, false, true]);
      expect(decodeBrailleDots('o‘')).toEqual([true, true, true, false, false, true]);
      expect(decodeBrailleDots('oʻ')).toEqual([true, true, true, false, false, true]);
      expect(decodeBrailleDots('o’')).toEqual([true, true, true, false, false, true]);

      // g' and variants (dots 1, 2, 4, 5, 6)
      expect(decodeBrailleDots("g'")).toEqual([true, true, false, true, true, true]);
      expect(decodeBrailleDots('g‘')).toEqual([true, true, false, true, true, true]);
      expect(decodeBrailleDots('gʻ')).toEqual([true, true, false, true, true, true]);
      expect(decodeBrailleDots('g’')).toEqual([true, true, false, true, true, true]);
    });

    it('correctly resolves Uzbek digraphs (sh, ch) directly passed as text', () => {
      // sh -> dots 1, 5, 6
      expect(decodeBrailleDots('sh')).toEqual([true, false, false, false, true, true]);
      expect(decodeBrailleDots('SH')).toEqual([true, false, false, false, true, true]);

      // ch -> dots 1, 2, 3, 4, 5
      expect(decodeBrailleDots('ch')).toEqual([true, true, true, true, true, false]);
      expect(decodeBrailleDots('CH')).toEqual([true, true, true, true, true, false]);
    });

    it('correctly resolves numerals and space characters directly passed as text', () => {
      expect(decodeBrailleDots('1')).toEqual([true, false, false, false, false, false]);
      expect(decodeBrailleDots('2')).toEqual([true, true, false, false, false, false]);
      expect(decodeBrailleDots('9')).toEqual([false, true, false, true, false, false]);
      expect(decodeBrailleDots('0')).toEqual([false, true, false, true, true, false]);
      expect(decodeBrailleDots(' ')).toEqual([false, false, false, false, false, false]);
    });
  });

  describe('createTactileCellElement() Semantic DOM Structure & ARIA', () => {
    it('creates semantic DOM element with role="group" and dataset attributes', () => {
      const cell = createTactileCellElement('a', '⠁', 0);
      expect(cell.tagName).toBe('DIV');
      expect(cell.getAttribute('role')).toBe('group');
      expect(cell.dataset.index).toBe('0');
      expect(cell.dataset.char).toBe('a');
      expect(cell.dataset.braille).toBe('⠁');
      expect(cell.classList.contains('tactile-cell')).toBe(true);
    });

    it('sets aria-label describing active dots clearly for screen readers', () => {
      const cellA = createTactileCellElement('a', '⠁', 0);
      expect(cellA.getAttribute('aria-label')).toBe('Character "a", Braille ⠁, dots 1');

      const cellO = createTactileCellElement("o‘", '⠧', 1);
      expect(cellO.getAttribute('aria-label')).toBe('Character "o‘", Braille ⠧, dots 1, 2, 3, 6');

      const cellSh = createTactileCellElement('sh', '⠱', 2);
      expect(cellSh.getAttribute('aria-label')).toBe('Character "sh", Braille ⠱, dots 1, 5, 6');

      const cellBlank = createTactileCellElement(' ', '⠀', 3);
      expect(cellBlank.getAttribute('aria-label')).toBe('Character "Space", Braille ⠀, blank cell');
    });

    it('creates 6 tactile-dot elements with proper active/inactive classes', () => {
      const cellB = createTactileCellElement('b', '⠃', 0); // dots 1, 2 active
      const dots = cellB.querySelectorAll('.tactile-dot');
      expect(dots.length).toBe(6);

      // Verify each dot has data-dot-number and tactile-dot-N class
      dots.forEach((dot, idx) => {
        expect(dot.getAttribute('data-dot-number')).toBe(String(idx + 1));
        expect(dot.classList.contains(`tactile-dot-${idx + 1}`)).toBe(true);
      });

      expect(dots[0].classList.contains('tactile-dot--active')).toBe(true);
      expect(dots[1].classList.contains('tactile-dot--active')).toBe(true);
      expect(dots[2].classList.contains('tactile-dot--inactive')).toBe(true);
      expect(dots[3].classList.contains('tactile-dot--inactive')).toBe(true);
      expect(dots[4].classList.contains('tactile-dot--inactive')).toBe(true);
      expect(dots[5].classList.contains('tactile-dot--inactive')).toBe(true);
    });

    it('correctly sets gridAutoFlow to column on tactile-dots matrix container', () => {
      const cell = createTactileCellElement('a', '⠁', 0);
      const dotsContainer = cell.querySelector<HTMLElement>('.tactile-dots');
      expect(dotsContainer).not.toBeNull();
      expect(dotsContainer!.style.gridAutoFlow).toBe('column');
      expect(dotsContainer!.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders original char header and Braille footer with aria-hidden', () => {
      const cell = createTactileCellElement('sh', '⠱', 4);
      const charLabel = cell.querySelector('.tactile-cell-char');
      const brailleLabel = cell.querySelector('.tactile-cell-braille');

      expect(charLabel).not.toBeNull();
      expect(charLabel!.textContent).toBe('sh');
      expect(charLabel!.getAttribute('aria-hidden')).toBe('true');

      expect(brailleLabel).not.toBeNull();
      expect(brailleLabel!.textContent).toBe('⠱');
      expect(brailleLabel!.getAttribute('aria-hidden')).toBe('true');
    });

    it('correctly uses space symbol ␣ for space characters in the visual header', () => {
      const spaceCell = createTactileCellElement(' ', '⠀', 0);
      const charLabel = spaceCell.querySelector('.tactile-cell-char');
      expect(charLabel!.textContent).toBe('␣');
    });

    it('falls back to charToBraille if brailleChar is omitted or empty', () => {
      const cell = createTactileCellElement('b', '', 0);
      const dots = cell.querySelectorAll('.tactile-dot');
      expect(dots[0].classList.contains('tactile-dot--active')).toBe(true);
      expect(dots[1].classList.contains('tactile-dot--active')).toBe(true);
      expect(dots[2].classList.contains('tactile-dot--inactive')).toBe(true);
    });
  });

  describe('renderBrailleGrid() Container Rendering', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('populates container with tactile cells and assigns tactile-grid class', () => {
      const items = [
        { char: 'O‘', braille: '⠧' },
        { char: 'z', braille: '⠵' },
        { char: 'b', braille: '⠃' },
        { char: 'e', braille: '⠑' },
        { char: 'k', braille: '⠅' },
      ];

      renderBrailleGrid(container, items);

      expect(container.classList.contains('tactile-grid')).toBe(true);
      const cells = container.querySelectorAll('.tactile-cell');
      expect(cells.length).toBe(5);
      expect((cells[0] as HTMLElement).dataset.char).toBe('O‘');
      expect((cells[0] as HTMLElement).dataset.braille).toBe('⠧');
      expect((cells[4] as HTMLElement).dataset.char).toBe('k');
      expect((cells[4] as HTMLElement).dataset.braille).toBe('⠅');
    });

    it('clears previous content when re-rendered with new items', () => {
      renderBrailleGrid(container, [{ char: 'a', braille: '⠁' }]);
      expect(container.querySelectorAll('.tactile-cell').length).toBe(1);

      renderBrailleGrid(container, [
        { char: 'b', braille: '⠃' },
        { char: 'c', braille: '⠉' },
      ]);
      expect(container.querySelectorAll('.tactile-cell').length).toBe(2);
    });

    it('safely handles empty items array without errors', () => {
      renderBrailleGrid(container, []);
      expect(container.querySelectorAll('.tactile-cell').length).toBe(0);
      expect(container.classList.contains('tactile-grid')).toBe(true);
    });
  });
});
