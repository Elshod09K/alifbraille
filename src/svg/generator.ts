import type { BrailleCell, SvgExportOptions } from '../types.js';
import { MARBURG_TACTILE_SPEC, PAPER_DIMENSIONS } from './constants.js';
import { decodeBrailleDots } from '../ui/tactile-cell.js';
import { transliterateToBraille } from '../braille.js';

export type { SvgExportOptions };

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes input cells into an array of BrailleCell objects.
 * Accepts an array of BrailleCell objects, raw Unicode Braille string, or Uzbek Latin text.
 */
function normalizeCellsInput(cells: BrailleCell[] | string): BrailleCell[] {
  if (typeof cells !== 'string') {
    return cells;
  }

  const result: BrailleCell[] = [];
  // If string contains any non-Braille characters (letters, numbers, punctuation),
  // transliterate to Braille first. Otherwise treat as pure Braille Unicode sequence.
  const isPureBraille = /^[\u2800-\u28FF\s]*$/.test(cells);
  const brailleString = isPureBraille ? cells : transliterateToBraille(cells);

  for (let i = 0; i < brailleString.length; i++) {
    const ch = brailleString[i];
    if (ch === '\r') {
      continue;
    }
    if (ch === '\n') {
      result.push({ char: '\n', brailleChar: '\n', dots: [false, false, false, false, false, false], isSpace: true });
    } else {
      result.push({
        brailleChar: ch,
        dots: decodeBrailleDots(ch),
        isSpace: ch === ' ' || ch === '⠀',
      });
    }
  }

  return result;
}

/**
 * Millimeter-calibrated vector SVG generator producing printable tactile Braille sheets.
 * Adheres strictly to universal Marburg tactile specifications:
 * - 2.5 mm dot pitch horizontally and vertically between dot centers
 * - 6.0 mm cell height envelope
 * - 0.75 mm dot radius (fill='#000000')
 * - 10.0 mm line pitch between text line baselines
 * - Exact physical dimensions (width/height in mm, viewBox in mm) for swell-paper microcapsule heating
 *
 * @param cells - Array of BrailleCell objects or string to transliterate
 * @param options - SvgExportOptions configuring paper size, margins, and geometry
 * @returns Well-formed XML SVG document string
 */
export function generateTactileSvg(
  cells: BrailleCell[] | string,
  options?: SvgExportOptions
): string {
  const paper = options?.paperSize ?? 'A4';
  const orientation = options?.orientation ?? 'portrait';
  const baseDim = PAPER_DIMENSIONS[paper] ?? PAPER_DIMENSIONS.A4;

  const widthMm = orientation === 'landscape' ? baseDim.heightMm : baseDim.widthMm;
  const heightMm = orientation === 'landscape' ? baseDim.widthMm : baseDim.heightMm;

  const marginMm = options?.marginMm ?? MARBURG_TACTILE_SPEC.marginMm ?? 15.0;
  const dotRadiusMm = options?.dotRadiusMm ?? MARBURG_TACTILE_SPEC.dotRadiusMm;
  const dotPitchMm = options?.dotPitchMm ?? MARBURG_TACTILE_SPEC.dotPitchMm;
  const linePitchMm = options?.linePitchMm ?? MARBURG_TACTILE_SPEC.linePitchMm;
  const cellSpacingMm = MARBURG_TACTILE_SPEC.cellSpacingMm ?? 3.75;
  const cellPitchMm = dotPitchMm + cellSpacingMm; // 2.5 + 3.75 = 6.25mm center-to-center

  const title = options?.title ?? 'AlifBraille Tactile Sheet';
  const includeGuideDots = Boolean(options?.includeGuideDots);

  const cellList = normalizeCellsInput(cells);

  // Calculate printable boundary and maximum cells per line (~28 cells for A4 portrait with 15mm margins)
  const printableWidth = widthMm - 2 * marginMm;
  const maxCellsPerLine = Math.max(1, Math.floor((printableWidth - dotPitchMm) / cellPitchMm) + 1);

  const includeTactileMetadata = Boolean(options?.includeTactileMetadata);
  const pageNum = options?.pageNumber ?? 1;

  let currentLine = 0;
  let currentCellInLine = 0;
  const dotElements: string[] = [];

  // Helper to append 6-dot circles for a cell at (cellX, cellY)
  const renderCellDots = (dots: boolean[], cellX: number, cellY: number) => {
    const dotOffsets = [
      { x: 0, y: 0 },                       // Dot 1
      { x: 0, y: dotPitchMm },               // Dot 2
      { x: 0, y: 2 * dotPitchMm },           // Dot 3
      { x: dotPitchMm, y: 0 },               // Dot 4
      { x: dotPitchMm, y: dotPitchMm },       // Dot 5
      { x: dotPitchMm, y: 2 * dotPitchMm },   // Dot 6
    ];

    for (let dotNum = 0; dotNum < 6; dotNum++) {
      const isActive = dots[dotNum];
      const cx = (cellX + dotOffsets[dotNum].x).toFixed(3);
      const cy = (cellY + dotOffsets[dotNum].y).toFixed(3);

      if (isActive) {
        dotElements.push(
          `      <circle cx="${cx}" cy="${cy}" r="${dotRadiusMm}" fill="#000000" />`
        );
      } else if (includeGuideDots) {
        dotElements.push(
          `      <circle cx="${cx}" cy="${cy}" r="0.25" fill="#e5e7eb" opacity="0.6" />`
        );
      }
    }
  };

  // If Marburg-compliant tactile page metadata is requested, render line 0 with document heading and page number
  if (includeTactileMetadata) {
    // 1. Heading cells (e.g. "alif")
    const headerTitleText = 'alif';
    const headerTitleBraille = transliterateToBraille(headerTitleText);
    const headerTitleCells = normalizeCellsInput(headerTitleBraille);

    headerTitleCells.forEach((hCell, hIdx) => {
      const hCellX = marginMm + hIdx * cellPitchMm;
      const hCellY = marginMm; // Line 0
      const dots = hCell.dots || decodeBrailleDots(hCell.brailleChar || '');
      renderCellDots(dots, hCellX, hCellY);
    });

    // 2. Right-aligned Braille page number (e.g. #1 -> ⠼⠁)
    const pageBrailleStr = transliterateToBraille(String(pageNum));
    const pageCells = normalizeCellsInput(pageBrailleStr);
    const startPageCellIdx = Math.max(headerTitleCells.length + 2, maxCellsPerLine - pageCells.length);

    pageCells.forEach((pCell, pIdx) => {
      const pCellX = marginMm + (startPageCellIdx + pIdx) * cellPitchMm;
      const pCellY = marginMm; // Line 0
      const dots = pCell.dots || decodeBrailleDots(pCell.brailleChar || '');
      renderCellDots(dots, pCellX, pCellY);
    });

    // Advance to line 2 to provide standard Marburg tactile separation
    currentLine = 2;
  }

  for (let cIdx = 0; cIdx < cellList.length; cIdx++) {
    const cell = cellList[cIdx];

    // Carriage return handling
    if (cell.char === '\r' || cell.brailleChar === '\r') {
      continue;
    }

    // Explicit newline handling
    if (
      cell.char === '\n' ||
      cell.brailleChar === '\n' ||
      cell.char === '\r\n' ||
      cell.brailleChar === '\r\n'
    ) {
      currentLine++;
      currentCellInLine = 0;
      continue;
    }

    // Automatic line wrapping when line width exceeds printable width (~28 cells per line)
    if (currentCellInLine >= maxCellsPerLine) {
      currentLine++;
      currentCellInLine = 0;
    }

    const cellX = marginMm + currentCellInLine * cellPitchMm;
    const cellY = marginMm + currentLine * linePitchMm;

    // Resolve 6-dot activation state
    let dots = cell.dots;
    if (!dots || dots.length !== 6) {
      if (cell.activeDots && Array.isArray(cell.activeDots)) {
        dots = [1, 2, 3, 4, 5, 6].map((num) => cell.activeDots!.includes(num));
      } else {
        const brailleSymbol = cell.brailleChar || cell.braille || cell.char || '';
        dots = decodeBrailleDots(brailleSymbol);
      }
    }

    renderCellDots(dots, cellX, cellY);
    currentCellInLine++;
  }

  // Render 50mm Physical Calibration Ruler if enabled
  const includeCalibrationRuler = options?.includeCalibrationRuler ?? true;
  let calibrationRulerSvg = '';

  if (includeCalibrationRuler) {
    const rulerBaselineY = Number((heightMm - 10).toFixed(2));
    const startX = Number(marginMm.toFixed(2));
    const endX = Number((marginMm + 50.0).toFixed(2));

    const notches = [
      `<line x1="${startX}" y1="${(rulerBaselineY - 3.5).toFixed(2)}" x2="${startX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 10).toFixed(2)}" y1="${(rulerBaselineY - 2.0).toFixed(2)}" x2="${(startX + 10).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 20).toFixed(2)}" y1="${(rulerBaselineY - 2.0).toFixed(2)}" x2="${(startX + 20).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 25).toFixed(2)}" y1="${(rulerBaselineY - 2.8).toFixed(2)}" x2="${(startX + 25).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 30).toFixed(2)}" y1="${(rulerBaselineY - 2.0).toFixed(2)}" x2="${(startX + 30).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${(startX + 40).toFixed(2)}" y1="${(rulerBaselineY - 2.0).toFixed(2)}" x2="${(startX + 40).toFixed(2)}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
      `<line x1="${endX}" y1="${(rulerBaselineY - 3.5).toFixed(2)}" x2="${endX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />`,
    ];

    calibrationRulerSvg = `  <g id="calibration-ruler" data-ruler-length-mm="50" role="img" aria-label="50mm physical calibration reference ruler">
    <line x1="${startX}" y1="${rulerBaselineY}" x2="${endX}" y2="${rulerBaselineY}" stroke="#000000" stroke-width="0.5" />
    ${notches.join('\n    ')}
    <text x="${startX}" y="${(rulerBaselineY - 4.5).toFixed(2)}" font-family="sans-serif" font-size="2.2" font-weight="bold" fill="#000000">50mm CALIBRATION RULER (Ensure 1:1 print scale before thermal fuser)</text>
    <text x="${startX}" y="${(rulerBaselineY + 3.0).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444">0mm</text>
    <text x="${(startX + 25).toFixed(2)}" y="${(rulerBaselineY + 3.0).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444" text-anchor="middle">25mm</text>
    <text x="${endX}" y="${(rulerBaselineY + 3.0).toFixed(2)}" font-family="sans-serif" font-size="1.8" fill="#444444" text-anchor="end">50mm</text>
  </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}" version="1.1">
  <title>${escapeXml(title)}</title>
  <desc>Calibrated tactile Braille sheet for swell-form embossing generated by AlifBraille adhering to Marburg standards (2.5mm dot pitch, 10.0mm line pitch).</desc>
  <g id="tactile-braille-sheet">
${dotElements.join('\n')}
  </g>
${calibrationRulerSvg}
</svg>`;
}
