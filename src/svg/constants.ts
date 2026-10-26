import type { TactileDimensions, SvgExportOptions } from '../types.js';

/**
 * Standard Marburg Tactile Specifications for 6-dot Braille embossing:
 * - Dot radius: 0.75 mm (diameter 1.5 mm)
 * - Dot pitch (horizontal and vertical center-to-center distance within a cell): 2.5 mm
 * - Cell height: 6.0 mm (from dot 1 to dot 3 center is 5.0 mm; overall cell height is 6.0 mm)
 * - Line pitch (baseline to baseline between lines): 10.0 mm
 * - Cell spacing (horizontal distance between dot 4 of cell N and dot 1 of cell N+1): 3.75 mm
 *   (Total cell horizontal pitch center-to-center: 2.5 mm + 3.75 mm = 6.25 mm)
 * - Standard paper margins: 15.0 mm
 */
export const MARBURG_TACTILE_SPEC: Readonly<TactileDimensions> = Object.freeze({
  dotRadiusMm: 0.75,
  dotPitchMm: 2.5,
  cellHeightMm: 6.0,
  linePitchMm: 10.0,
  cellSpacingMm: 3.75,
  marginMm: 15.0,
});

/**
 * Standard physical paper dimensions in millimeters.
 */
export const PAPER_DIMENSIONS = Object.freeze({
  A4: {
    widthMm: 210,
    heightMm: 297,
  },
  Letter: {
    widthMm: 215.9,
    heightMm: 279.4,
  },
});

/**
 * Default options for vector SVG generation adhering to Marburg standards.
 */
export const DEFAULT_SVG_OPTIONS: Readonly<Required<Omit<SvgExportOptions, 'title'>> & { title: string }> = Object.freeze({
  paperSize: 'A4',
  orientation: 'portrait',
  marginMm: 15,
  dotRadiusMm: 0.75,
  dotPitchMm: 2.5,
  cellHeightMm: 6.0,
  linePitchMm: 10.0,
  title: 'AlifBraille Tactile Sheet',
  includeGuideDots: false,
  includeTactileMetadata: false,
  includeCalibrationRuler: true,
  pageNumber: 1,
});
