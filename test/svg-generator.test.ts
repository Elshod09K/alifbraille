import { describe, it, expect } from 'vitest';
import {
  generateTactileSvg,
  MARBURG_TACTILE_SPEC,
  PAPER_DIMENSIONS,
  DEFAULT_SVG_OPTIONS,
} from '../src/svg/index.js';
import type { BrailleCell, SvgExportOptions } from '../src/types.js';

describe('Tactile SVG Generator & Calibration Suite (Marburg Specifications)', () => {
  describe('Standard Physical A4 Dimensions & XML Metadata', () => {
    it('generates SVG with exact root attributes width="210mm", height="297mm", and viewBox="0 0 210 297" for A4 portrait', () => {
      const svg = generateTactileSvg('salom');

      expect(svg).toContain('width="210mm"');
      expect(svg).toContain('height="297mm"');
      expect(svg).toContain('viewBox="0 0 210 297"');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(svg.trim().endsWith('</svg>')).toBe(true);
    });

    it('outputs valid, well-formed XML with descriptive title and desc metadata', () => {
      const options: SvgExportOptions = {
        title: 'Uzbek Latin Tactile Worksheet - Grade 5',
      };
      const svg = generateTactileSvg('O‘zbekiston', options);

      expect(svg).toContain('<title>Uzbek Latin Tactile Worksheet - Grade 5</title>');
      expect(svg).toContain('<desc>');
      expect(svg).toContain('Marburg standards');
      expect(svg).toContain('</desc>');

      // Verify DOM parser parses it as well-formed XML without error
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const parserErrors = doc.querySelectorAll('parsererror');
      expect(parserErrors.length).toBe(0);
      expect(doc.documentElement.tagName.toLowerCase()).toBe('svg');
    });

    it('escapes XML special characters in title properly', () => {
      const svg = generateTactileSvg('salom', {
        title: 'AlifBraille & Uzbek <Latin> "1-sinf" \'darslik\'',
      });
      expect(svg).toContain('&amp;');
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&gt;');
      expect(svg).toContain('&quot;');
      expect(svg).toContain('&apos;');

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const parserErrors = doc.querySelectorAll('parsererror');
      expect(parserErrors.length).toBe(0);
      const titleEl = doc.querySelector('title');
      expect(titleEl?.textContent).toBe('AlifBraille & Uzbek <Latin> "1-sinf" \'darslik\'');
    });

    it('correctly adapts root attributes for Letter paper size and landscape orientation', () => {
      const letterLandscape = generateTactileSvg('A', {
        paperSize: 'Letter',
        orientation: 'landscape',
      });

      expect(letterLandscape).toContain('width="279.4mm"');
      expect(letterLandscape).toContain('height="215.9mm"');
      expect(letterLandscape).toContain('viewBox="0 0 279.4 215.9"');

      const letterPortrait = generateTactileSvg('A', {
        paperSize: 'Letter',
        orientation: 'portrait',
      });
      expect(letterPortrait).toContain('width="215.9mm"');
      expect(letterPortrait).toContain('height="279.4mm"');
      expect(letterPortrait).toContain('viewBox="0 0 215.9 279.4"');

      const a4Landscape = generateTactileSvg('A', {
        paperSize: 'A4',
        orientation: 'landscape',
      });
      expect(a4Landscape).toContain('width="297mm"');
      expect(a4Landscape).toContain('height="210mm"');
      expect(a4Landscape).toContain('viewBox="0 0 297 210"');
    });
  });

  describe('Marburg Tactile Spacing Calibration (2.5mm Dot Pitch, 10.0mm Line Pitch)', () => {
    it('strictly maintains 2.5mm horizontal and vertical pitch between dot centers within a cell', () => {
      // Cell with dot 1 (col 0, row 0) and dot 4 (col 1, row 0) -> horizontal pitch
      // and dot 2 (col 0, row 1) -> vertical pitch
      // Braille character 'f' (dots 1-2-4): dots = [true, true, false, true, false, false]
      const cellF: BrailleCell = {
        char: 'f',
        brailleChar: '⠋',
        dots: [true, true, false, true, false, false],
      };

      const svg = generateTactileSvg([cellF], {
        marginMm: 15.0,
        dotPitchMm: 2.5,
        dotRadiusMm: 0.75,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      expect(circles.length).toBe(3); // dots 1, 2, 4

      const dot1 = circles.find((c) => parseFloat(c.getAttribute('cx')!) === 15.0 && parseFloat(c.getAttribute('cy')!) === 15.0);
      const dot2 = circles.find((c) => parseFloat(c.getAttribute('cx')!) === 15.0 && Math.abs(parseFloat(c.getAttribute('cy')!) - 17.5) < 0.01);
      const dot4 = circles.find((c) => Math.abs(parseFloat(c.getAttribute('cx')!) - 17.5) < 0.01 && parseFloat(c.getAttribute('cy')!) === 15.0);

      expect(dot1).toBeDefined();
      expect(dot2).toBeDefined();
      expect(dot4).toBeDefined();

      const cx1 = parseFloat(dot1!.getAttribute('cx')!);
      const cy1 = parseFloat(dot1!.getAttribute('cy')!);
      const cy2 = parseFloat(dot2!.getAttribute('cy')!);
      const cx4 = parseFloat(dot4!.getAttribute('cx')!);

      // Horizontal pitch between dot 1 and dot 4: exactly 2.5mm
      expect(Number((cx4 - cx1).toFixed(2))).toBe(2.5);

      // Vertical pitch between dot 1 and dot 2: exactly 2.5mm
      expect(Number((cy2 - cy1).toFixed(2))).toBe(2.5);
    });

    it('strictly maintains 5.0mm distance between dot 1 and dot 3 (cell height envelope 6.0mm)', () => {
      // Cell with all 6 dots active (U+283F '⠿')
      const cellFull: BrailleCell = {
        char: '⠿',
        brailleChar: '⠿',
        dots: [true, true, true, true, true, true],
      };

      const svg = generateTactileSvg([cellFull], {
        marginMm: 15.0,
        dotPitchMm: 2.5,
        dotRadiusMm: 0.75,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));
      expect(circles.length).toBe(6);

      const dot1 = circles.find((c) => parseFloat(c.getAttribute('cx')!) === 15.0 && parseFloat(c.getAttribute('cy')!) === 15.0)!;
      const dot2 = circles.find((c) => parseFloat(c.getAttribute('cx')!) === 15.0 && Math.abs(parseFloat(c.getAttribute('cy')!) - 17.5) < 0.01)!;
      const dot3 = circles.find((c) => parseFloat(c.getAttribute('cx')!) === 15.0 && Math.abs(parseFloat(c.getAttribute('cy')!) - 20.0) < 0.01)!;
      const dot4 = circles.find((c) => Math.abs(parseFloat(c.getAttribute('cx')!) - 17.5) < 0.01 && parseFloat(c.getAttribute('cy')!) === 15.0)!;
      const dot5 = circles.find((c) => Math.abs(parseFloat(c.getAttribute('cx')!) - 17.5) < 0.01 && Math.abs(parseFloat(c.getAttribute('cy')!) - 17.5) < 0.01)!;
      const dot6 = circles.find((c) => Math.abs(parseFloat(c.getAttribute('cx')!) - 17.5) < 0.01 && Math.abs(parseFloat(c.getAttribute('cy')!) - 20.0) < 0.01)!;

      expect(dot1).toBeDefined();
      expect(dot2).toBeDefined();
      expect(dot3).toBeDefined();
      expect(dot4).toBeDefined();
      expect(dot5).toBeDefined();
      expect(dot6).toBeDefined();

      const cy1 = parseFloat(dot1.getAttribute('cy')!);
      const cy3 = parseFloat(dot3.getAttribute('cy')!);

      // Distance from dot 1 to dot 3 center is 5.0mm (2 * 2.5mm)
      expect(Number((cy3 - cy1).toFixed(2))).toBe(5.0);
    });

    it('strictly maintains 6.25mm horizontal pitch between adjacent cell origins (2.5mm dot pitch + 3.75mm cell spacing)', () => {
      // Two cells: 'a' (dot 1) and 'b' (dots 1, 2)
      const cells: BrailleCell[] = [
        { char: 'a', brailleChar: '⠁', dots: [true, false, false, false, false, false] },
        { char: 'b', brailleChar: '⠃', dots: [true, true, false, false, false, false] },
      ];

      const svg = generateTactileSvg(cells, { marginMm: 15.0 });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      // 1 dot from cell 0 + 2 dots from cell 1 = 3 circles
      expect(circles.length).toBe(3);

      const cell0Dot1 = circles[0];
      const cell1Dot1 = circles[1];

      const cx0 = parseFloat(cell0Dot1.getAttribute('cx')!);
      const cx1 = parseFloat(cell1Dot1.getAttribute('cx')!);

      expect(cx0).toBe(15.0);
      expect(cx1).toBe(21.25);
      expect(Number((cx1 - cx0).toFixed(2))).toBe(6.25);
    });

    it('strictly maintains 10.0mm vertical line pitch between successive text lines', () => {
      // Two cells separated by a newline
      const cells: BrailleCell[] = [
        { char: 'a', brailleChar: '⠁', dots: [true, false, false, false, false, false] },
        { char: '\n', brailleChar: '\n', dots: [false, false, false, false, false, false] },
        { char: 'a', brailleChar: '⠁', dots: [true, false, false, false, false, false] },
      ];

      const svg = generateTactileSvg(cells, {
        marginMm: 15.0,
        linePitchMm: 10.0,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      expect(circles.length).toBe(2);

      const line0DotY = parseFloat(circles[0].getAttribute('cy')!);
      const line1DotY = parseFloat(circles[1].getAttribute('cy')!);

      expect(line0DotY).toBe(15.0);
      expect(line1DotY).toBe(25.0);
      expect(line1DotY - line0DotY).toBe(10.0);
    });

    it('correctly renders active dots with fill="#000000" and radius r=0.75mm', () => {
      const cell: BrailleCell = {
        char: 'a',
        brailleChar: '⠁',
        dots: [true, false, false, false, false, false],
      };

      const svg = generateTactileSvg([cell]);
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const activeDot = doc.querySelector('circle')!;

      expect(activeDot).toBeDefined();
      expect(activeDot.getAttribute('fill')).toBe('#000000');
      expect(parseFloat(activeDot.getAttribute('r')!)).toBe(0.75);
    });

    it('renders inactive guide dots when includeGuideDots is set to true', () => {
      const cell: BrailleCell = {
        char: 'a',
        brailleChar: '⠁',
        dots: [true, false, false, false, false, false],
      };

      const svg = generateTactileSvg([cell], { includeGuideDots: true });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const allDots = doc.querySelectorAll('circle');

      // 1 active dot + 5 guide dots = 6 total dots in cell
      expect(allDots.length).toBe(6);
      const guideDots = Array.from(allDots).filter((d) => d.getAttribute('fill') !== '#000000');
      expect(guideDots.length).toBe(5);
    });
  });

  describe('Automatic Line Wrapping (~28 cells per line on A4 Portrait)', () => {
    it('wraps onto subsequent line when Braille cell count exceeds the printable sheet width', () => {
      // 30 cells of 'a' (dot 1)
      const cells: BrailleCell[] = Array.from({ length: 30 }, (_, i) => ({
        char: 'a',
        brailleChar: '⠁',
        dots: [true, false, false, false, false, false],
        index: i,
      }));

      const svg = generateTactileSvg(cells, {
        paperSize: 'A4',
        marginMm: 15.0,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      expect(circles.length).toBe(30);

      // On A4 portrait (width 210mm, margins 15mm => printable 180mm),
      // with cell pitch 6.25mm, max cells per line is ~28 or 29 cells.
      const line0Circles = circles.filter((c) => parseFloat(c.getAttribute('cy')!) === 15.0);
      const line1Circles = circles.filter((c) => parseFloat(c.getAttribute('cy')!) === 25.0);

      expect(line0Circles.length).toBeGreaterThanOrEqual(28);
      expect(line1Circles.length).toBeGreaterThanOrEqual(1);

      // First dot on line 1 starts back at left margin (cx = 15.0)
      const firstDotLine1 = line1Circles[0];
      expect(parseFloat(firstDotLine1.getAttribute('cx')!)).toBe(15.0);
    });

    it('wraps across 3 consecutive lines when passage has 60+ cells', () => {
      const cells: BrailleCell[] = Array.from({ length: 65 }, (_, i) => ({
        char: 'a',
        brailleChar: '⠁',
        dots: [true, false, false, false, false, false],
        index: i,
      }));

      const svg = generateTactileSvg(cells, {
        paperSize: 'A4',
        marginMm: 15.0,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));
      expect(circles.length).toBe(65);

      const line0 = circles.filter((c) => Math.abs(parseFloat(c.getAttribute('cy')!) - 15.0) < 0.1);
      const line1 = circles.filter((c) => Math.abs(parseFloat(c.getAttribute('cy')!) - 25.0) < 0.1);
      const line2 = circles.filter((c) => Math.abs(parseFloat(c.getAttribute('cy')!) - 35.0) < 0.1);

      expect(line0.length).toBe(29);
      expect(line1.length).toBe(29);
      expect(line2.length).toBe(7);
    });

    it('correctly handles consecutive explicit newlines (blank lines)', () => {
      const cells: BrailleCell[] = [
        { char: 'a', brailleChar: '⠁', dots: [true, false, false, false, false, false] },
        { char: '\n', brailleChar: '\n', dots: [false, false, false, false, false, false] },
        { char: '\n', brailleChar: '\n', dots: [false, false, false, false, false, false] },
        { char: 'b', brailleChar: '⠃', dots: [true, true, false, false, false, false] },
      ];

      const svg = generateTactileSvg(cells, { marginMm: 15.0, linePitchMm: 10.0 });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      // cell 'a' is on line 0 (y = 15.0)
      // newline 1 -> line 1
      // newline 2 -> line 2 (blank line at y = 25.0)
      // cell 'b' is on line 2 (y = 35.0)
      const dotA = circles[0];
      const dotB1 = circles[1];

      expect(parseFloat(dotA.getAttribute('cy')!)).toBe(15.0);
      expect(parseFloat(dotB1.getAttribute('cy')!)).toBe(35.0);
    });
  });

  describe('Various Input Formats & Uzbek Orthography Support', () => {
    it('accepts raw string text input and transliterates it to calibrated SVG', () => {
      const svg = generateTactileSvg('Maktab 2024');
      expect(svg).toContain('<svg');
      expect(svg).toContain('width="210mm"');
      expect(svg).toContain('</svg>');

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = doc.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('correctly transliterates Uzbek modified letters (o‘, g‘) in text input', () => {
      const svg = generateTactileSvg('o‘rtoq g‘alaba');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const parserErrors = doc.querySelectorAll('parsererror');
      expect(parserErrors.length).toBe(0);
      expect(doc.querySelectorAll('circle').length).toBeGreaterThan(10);
    });

    it('correctly transliterates Uzbek digraphs (sh, ch, ng) and punctuation in text input', () => {
      const svg = generateTactileSvg('shahar, cho‘l va tong!');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      expect(doc.querySelectorAll('parsererror').length).toBe(0);
      expect(doc.querySelectorAll('circle').length).toBeGreaterThan(15);
    });

    it('accepts pure Unicode Braille string as input without re-transliterating', () => {
      // ⠎⠁⠇⠕⠍ is "salom" in Braille
      const svg = generateTactileSvg('⠎⠁⠇⠕⠍');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      expect(doc.querySelectorAll('parsererror').length).toBe(0);

      // '⠎' (dots 2-3-4 => 3 dots)
      // '⠁' (dot 1 => 1 dot)
      // '⠇' (dots 1-2-3 => 3 dots)
      // '⠕' (dots 1-3-5 => 3 dots)
      // '⠍' (dots 1-3-4 => 3 dots)
      // Total dots: 3 + 1 + 3 + 3 + 3 = 13
      const circles = doc.querySelectorAll('circle');
      expect(circles.length).toBe(13);
    });

    it('supports BrailleCell objects with activeDots array', () => {
      const cell: BrailleCell = {
        activeDots: [1, 2, 4], // 'f'
      };
      const svg = generateTactileSvg([cell]);
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = doc.querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('supports BrailleCell objects with brailleChar string', () => {
      const cell: BrailleCell = {
        brailleChar: '⠋', // 'f'
      };
      const svg = generateTactileSvg([cell]);
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = doc.querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('produces valid well-formed XML for empty input string or empty array', () => {
      const svgEmptyStr = generateTactileSvg('');
      const parser = new DOMParser();
      const doc1 = parser.parseFromString(svgEmptyStr, 'image/svg+xml');
      expect(doc1.querySelectorAll('parsererror').length).toBe(0);
      expect(doc1.querySelectorAll('circle').length).toBe(0);

      const svgEmptyArr = generateTactileSvg([]);
      const doc2 = parser.parseFromString(svgEmptyArr, 'image/svg+xml');
      expect(doc2.querySelectorAll('parsererror').length).toBe(0);
      expect(doc2.querySelectorAll('circle').length).toBe(0);
    });
  });

  describe('Custom Geometry Options & Constants', () => {
    it('exports MARBURG_TACTILE_SPEC adhering to official physical standards', () => {
      expect(MARBURG_TACTILE_SPEC.dotPitchMm).toBe(2.5);
      expect(MARBURG_TACTILE_SPEC.cellHeightMm).toBe(6.0);
      expect(MARBURG_TACTILE_SPEC.dotRadiusMm).toBe(0.75);
      expect(MARBURG_TACTILE_SPEC.linePitchMm).toBe(10.0);
      expect(MARBURG_TACTILE_SPEC.cellSpacingMm).toBe(3.75);
      expect(MARBURG_TACTILE_SPEC.marginMm).toBe(15.0);
    });

    it('exports PAPER_DIMENSIONS for A4 and Letter', () => {
      expect(PAPER_DIMENSIONS.A4.widthMm).toBe(210);
      expect(PAPER_DIMENSIONS.A4.heightMm).toBe(297);
      expect(PAPER_DIMENSIONS.Letter.widthMm).toBe(215.9);
      expect(PAPER_DIMENSIONS.Letter.heightMm).toBe(279.4);
    });

    it('exports DEFAULT_SVG_OPTIONS with standard defaults', () => {
      expect(DEFAULT_SVG_OPTIONS.paperSize).toBe('A4');
      expect(DEFAULT_SVG_OPTIONS.orientation).toBe('portrait');
      expect(DEFAULT_SVG_OPTIONS.marginMm).toBe(15);
      expect(DEFAULT_SVG_OPTIONS.dotRadiusMm).toBe(0.75);
      expect(DEFAULT_SVG_OPTIONS.dotPitchMm).toBe(2.5);
      expect(DEFAULT_SVG_OPTIONS.linePitchMm).toBe(10.0);
    });

    it('honors custom options (marginMm, dotRadiusMm, dotPitchMm, linePitchMm)', () => {
      const cell: BrailleCell = {
        char: 'f',
        brailleChar: '⠋',
        dots: [true, true, false, true, false, false],
      };
      const svg = generateTactileSvg([cell], {
        marginMm: 20.0,
        dotRadiusMm: 0.85,
        dotPitchMm: 3.0,
        linePitchMm: 12.0,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));
      expect(circles.length).toBe(3);

      const dot1 = circles[0];
      expect(parseFloat(dot1.getAttribute('cx')!)).toBe(20.0);
      expect(parseFloat(dot1.getAttribute('cy')!)).toBe(20.0);
      expect(parseFloat(dot1.getAttribute('r')!)).toBe(0.85);

      // Dot 4 at cx = 20.0 + 3.0 = 23.0
      const dot4 = circles[2];
      expect(parseFloat(dot4.getAttribute('cx')!)).toBe(23.0);
    });

    it('renders tactile page heading cells (ALIF) and Braille page number (⠼⠁) on line 0 when includeTactileMetadata is true', () => {
      const svg = generateTactileSvg('A', {
        includeTactileMetadata: true,
        pageNumber: 1,
        marginMm: 15.0,
        linePitchMm: 10.0,
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const circles = Array.from(doc.querySelectorAll('circle'));

      // Header dots should be present on line 0 (cy in range 15.0 to 20.0)
      const headerDots = circles.filter((c) => {
        const cy = parseFloat(c.getAttribute('cy')!);
        return cy >= 15.0 && cy <= 20.0;
      });
      expect(headerDots.length).toBeGreaterThan(0);

      // Content dots ('A' = dot 1) should start on line 2 (cy = 15.0 + 2 * 10.0 = 35.0)
      const contentDots = circles.filter((c) => {
        const cy = parseFloat(c.getAttribute('cy')!);
        return Math.abs(cy - 35.0) < 0.01;
      });
      expect(contentDots.length).toBe(1);
      expect(parseFloat(contentDots[0].getAttribute('cx')!)).toBe(15.0);
    });
  });

  describe('Physical 50mm Calibration Reference Ruler (Thermal Fuser Scaling Prevention)', () => {
    it('includes a 50mm calibration reference ruler by default with exact physical coordinates', () => {
      const svg = generateTactileSvg('AlifBraille');
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');

      const rulerGroup = doc.querySelector('#calibration-ruler');
      expect(rulerGroup).not.toBeNull();
      expect(rulerGroup?.getAttribute('data-ruler-length-mm')).toBe('50');

      const lines = Array.from(rulerGroup!.querySelectorAll('line'));
      expect(lines.length).toBeGreaterThanOrEqual(7); // baseline + 6-7 notches

      // Baseline line
      const baseline = lines.find((l) => {
        const x1 = parseFloat(l.getAttribute('x1')!);
        const x2 = parseFloat(l.getAttribute('x2')!);
        return Math.abs(x2 - x1 - 50.0) < 0.01;
      });
      expect(baseline).toBeDefined();
      expect(parseFloat(baseline!.getAttribute('x1')!)).toBe(15.0);
      expect(parseFloat(baseline!.getAttribute('x2')!)).toBe(65.0);

      // Start notch (0mm) at x = 15.0
      const startNotch = lines.find((l) => {
        const x1 = parseFloat(l.getAttribute('x1')!);
        const x2 = parseFloat(l.getAttribute('x2')!);
        const y1 = parseFloat(l.getAttribute('y1')!);
        const y2 = parseFloat(l.getAttribute('y2')!);
        return Math.abs(x1 - 15.0) < 0.01 && Math.abs(x2 - 15.0) < 0.01 && y2 > y1;
      });
      expect(startNotch).toBeDefined();

      // End notch (50mm) at x = 65.0
      const endNotch = lines.find((l) => {
        const x1 = parseFloat(l.getAttribute('x1')!);
        const x2 = parseFloat(l.getAttribute('x2')!);
        const y1 = parseFloat(l.getAttribute('y1')!);
        const y2 = parseFloat(l.getAttribute('y2')!);
        return Math.abs(x1 - 65.0) < 0.01 && Math.abs(x2 - 65.0) < 0.01 && y2 > y1;
      });
      expect(endNotch).toBeDefined();

      // Text labels
      const texts = Array.from(rulerGroup!.querySelectorAll('text'));
      const labelText = texts.find((t) => t.textContent?.includes('50mm CALIBRATION RULER'));
      expect(labelText).toBeDefined();
      const zeroText = texts.find((t) => t.textContent === '0mm');
      expect(zeroText).toBeDefined();
      const fiftyText = texts.find((t) => t.textContent === '50mm');
      expect(fiftyText).toBeDefined();
    });

    it('suppresses calibration ruler when includeCalibrationRuler is set to false', () => {
      const svg = generateTactileSvg('AlifBraille', { includeCalibrationRuler: false });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');

      const rulerGroup = doc.querySelector('#calibration-ruler');
      expect(rulerGroup).toBeNull();
      expect(svg).not.toContain('50mm CALIBRATION RULER');
    });

    it('adapts ruler coordinates to custom margins and Letter paper size', () => {
      const svg = generateTactileSvg('test', {
        paperSize: 'Letter',
        marginMm: 20.0,
        includeCalibrationRuler: true,
      });
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');

      const rulerGroup = doc.querySelector('#calibration-ruler');
      expect(rulerGroup).not.toBeNull();

      const lines = Array.from(rulerGroup!.querySelectorAll('line'));
      const baseline = lines.find((l) => {
        const x1 = parseFloat(l.getAttribute('x1')!);
        const x2 = parseFloat(l.getAttribute('x2')!);
        return Math.abs(x2 - x1 - 50.0) < 0.01;
      });
      expect(baseline).toBeDefined();
      expect(parseFloat(baseline!.getAttribute('x1')!)).toBe(20.0);
      expect(parseFloat(baseline!.getAttribute('x2')!)).toBe(70.0);
    });
  });
});
