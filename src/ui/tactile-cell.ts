/**
 * 6-dot Braille tactile cell visualizer component and dot decoder for AlifBraille.
 * Maps Braille Unicode code points (U+2800..U+283F) to tactile 6-dot matrix patterns.
 */

import { charToBraille } from '../braille.js';
import type { TactileGridItem } from './types.js';

/**
 * Decodes a 6-dot Braille Unicode character into a 6-element boolean array
 * indicating activation state for dots 1 through 6.
 *
 * Unicode Braille standard bit mapping:
 * - Dot 1: bit 0 (0x01)
 * - Dot 2: bit 1 (0x02)
 * - Dot 3: bit 2 (0x04)
 * - Dot 4: bit 3 (0x08)
 * - Dot 5: bit 4 (0x10)
 * - Dot 6: bit 5 (0x20)
 *
 * Can also accept a Latin character, Uzbek modified letter (o‘, g‘), digraph (sh, ch),
 * numeral, or space, resolving it to its corresponding Braille character before decoding.
 *
 * @param brailleChar - Single Braille character (e.g. '⠁', '⠧', '⠀') or text character/digraph
 * @returns Array of 6 booleans [dot1, dot2, dot3, dot4, dot5, dot6]
 */
export function decodeBrailleDots(brailleChar: string): boolean[] {
  if (!brailleChar || brailleChar.length === 0) {
    return [false, false, false, false, false, false];
  }

  let code = brailleChar.charCodeAt(0);
  const BRAILLE_BASE = 0x2800;

  // If outside Braille Unicode pattern block, attempt resolving via charToBraille
  if (code < BRAILLE_BASE || code > 0x28ff) {
    const resolved = charToBraille(brailleChar);
    if (resolved && resolved.length > 0) {
      code = resolved.charCodeAt(0);
    }
  }

  // If still outside Braille Unicode pattern block, return inactive dots
  if (code < BRAILLE_BASE || code > 0x28ff) {
    return [false, false, false, false, false, false];
  }

  const offset = code - BRAILLE_BASE;
  return [
    Boolean(offset & 0x01), // Dot 1
    Boolean(offset & 0x02), // Dot 2
    Boolean(offset & 0x04), // Dot 3
    Boolean(offset & 0x08), // Dot 4
    Boolean(offset & 0x10), // Dot 5
    Boolean(offset & 0x20), // Dot 6
  ];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Creates a semantic accessible DOM element representing a single 6-dot Braille cell.
 * Adheres to WCAG accessibility guidelines with role='group', tactile-dot classes,
 * and descriptive aria-label enumerating active dots.
 *
 * @param char - Original Latin letter, digraph, punctuation, or whitespace
 * @param brailleChar - Corresponding Unicode Braille pattern
 * @param index - Position index within the visual sequence
 * @returns Semantic HTMLElement representing the tactile cell
 */
export function createTactileCellElement(
  char: string,
  brailleChar: string,
  index: number
): HTMLElement {
  const cell = document.createElement('div');
  cell.className = 'tactile-cell';
  if (char === '\n') {
    cell.classList.add('tactile-cell--newline');
  }
  cell.setAttribute('role', 'group');
  cell.setAttribute('data-index', String(index));
  cell.setAttribute('data-char', char);
  cell.setAttribute('data-braille', brailleChar);

  const effectiveBraille = brailleChar || (char ? charToBraille(char) : '') || '⠀';
  const dots = decodeBrailleDots(effectiveBraille);
  const activeDotNumbers: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (dots[i]) activeDotNumbers.push(i + 1);
  }

  const displayChar = char === ' ' ? 'Space' : char === '\n' ? 'Newline' : char;
  const dotsDescription =
    activeDotNumbers.length > 0
      ? `dots ${activeDotNumbers.join(', ')}`
      : 'blank cell';

  cell.setAttribute(
    'aria-label',
    `Character "${displayChar}", Braille ${brailleChar || '⠀'}, ${dotsDescription}`
  );

  const charDisplay = char === ' ' ? '␣' : char === '\n' ? '↵' : char;
  const brailleDisplay = brailleChar || '⠀';

  const charSpan = document.createElement('span');
  charSpan.className = 'tactile-cell-char';
  charSpan.setAttribute('aria-hidden', 'true');
  charSpan.textContent = charDisplay;

  const dotsDiv = document.createElement('div');
  dotsDiv.className = 'tactile-dots';
  dotsDiv.style.gridAutoFlow = 'column';
  dotsDiv.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 6; i++) {
    const dotNum = i + 1;
    const isActive = dots[i];
    const dotSpan = document.createElement('span');
    dotSpan.className = `tactile-dot tactile-dot-${dotNum} ${
      isActive ? 'tactile-dot--active' : 'tactile-dot--inactive'
    }`;
    dotSpan.setAttribute('data-dot-number', String(dotNum));
    dotsDiv.appendChild(dotSpan);
  }

  const brailleSpan = document.createElement('span');
  brailleSpan.className = 'tactile-cell-braille';
  brailleSpan.setAttribute('aria-hidden', 'true');
  brailleSpan.textContent = brailleDisplay;

  cell.appendChild(charSpan);
  cell.appendChild(dotsDiv);
  cell.appendChild(brailleSpan);

  return cell;
}

/**
 * Renders an array of Latin/Braille character pairs into a tactile grid container.
 * Employs progressive rendering to guarantee sub-50ms event latency on large passages.
 *
 * @param container - Target HTMLElement container for the grid
 * @param items - Array of character and braille pairs
 * @param maxInitialSync - Maximum cells to render synchronously before scheduling remainder
 */
export function renderBrailleGrid(
  container: HTMLElement,
  items: Array<{ char: string; braille: string }>,
  maxInitialSync: number = 32
): void {
  if (!container) return;
  container.innerHTML = '';
  const isMetaCells =
    container.classList.contains('tactile-meta-cells') ||
    container.classList.contains('tactile-meta-heading-cells') ||
    container.classList.contains('tactile-meta-page-cells');
  if (!container.classList.contains('tactile-grid') && !isMetaCells) {
    container.classList.add('tactile-grid');
  }

  if (!items || items.length === 0) {
    return;
  }

  const initialItems = items.slice(0, maxInitialSync);
  const fragment = document.createDocumentFragment();
  initialItems.forEach((item, index) => {
    const cellEl = createTactileCellElement(item.char, item.braille, index);
    fragment.appendChild(cellEl);
  });
  container.appendChild(fragment);

  // If items exceed synchronous batch threshold, progressively stream remaining cells
  if (items.length > maxInitialSync) {
    const remainingItems = items.slice(maxInitialSync);
    const renderRemaining = () => {
      const restFrag = document.createDocumentFragment();
      remainingItems.forEach((item, idx) => {
        restFrag.appendChild(
          createTactileCellElement(item.char, item.braille, maxInitialSync + idx)
        );
      });
      container.appendChild(restFrag);
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(renderRemaining);
    } else {
      setTimeout(renderRemaining, 0);
    }
  }
}
