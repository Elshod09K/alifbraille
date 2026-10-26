export type UzbekTokenType =
  | 'letter'
  | 'digraph'
  | 'number'
  | 'punctuation'
  | 'whitespace'
  | 'unknown';

export interface UzbekToken {
  type: 'letter' | 'digraph' | 'number' | 'punctuation' | 'whitespace' | 'unknown';
  raw: string;
  normalized: string;
  isUppercase: boolean;
}

/**
 * 6-dot Braille tactile cell data representation.
 * Supports both UI rendering and vector SVG physical sheet generation.
 */
export interface BrailleCell {
  /** The Latin character, digraph, or token represented by this cell */
  char?: string;
  /** The 6-dot Braille Unicode character (U+2800..U+283F) */
  brailleChar?: string;
  /** Dot pattern string or representation, alternatively braille character */
  braille?: string;
  /** 6-element boolean array indicating activation of dots 1 through 6 */
  dots?: boolean[];
  /** 1-based numbers of active dots (e.g. [1, 2, 4] for 'f') */
  activeDots?: number[];
  /** 0-based sequential index of the cell in the visual grid */
  index?: number;
  /** Accessible text description of the cell and its active dots */
  ariaLabel?: string;
  /** True if the cell represents whitespace */
  isSpace?: boolean;
  /** True if the cell represents an Uzbek digraph or modified letter */
  isDigraph?: boolean;
  /** True if the cell is part of a numeric sequence */
  isNumber?: boolean;
}

/**
 * Millimeter-calibrated tactile layout dimensions.
 * Conforms to universal Marburg tactile specifications for physical embossing and swell paper.
 */
export interface TactileDimensions {
  /** Dot radius in millimeters (Marburg standard: 0.75mm) */
  dotRadiusMm: number;
  /** Horizontal and vertical center-to-center pitch between dots within a cell (Marburg: 2.5mm) */
  dotPitchMm: number;
  /** Overall cell height envelope in millimeters (Marburg standard: 6.0mm) */
  cellHeightMm: number;
  /** Baseline-to-baseline vertical pitch between lines of Braille cells (Marburg: 10.0mm) */
  linePitchMm: number;
  /** Inter-cell horizontal spacing between adjacent Braille cells (Marburg: 3.75mm) */
  cellSpacingMm?: number;
  /** Sheet margin in millimeters (standard: 15.0mm) */
  marginMm?: number;
}

/**
 * Options configuring vector SVG tactile sheet export.
 */
export interface SvgExportOptions {
  /** Physical target sheet paper size ('A4' or 'Letter') */
  paperSize?: 'A4' | 'Letter';
  /** Page orientation ('portrait' or 'landscape') */
  orientation?: 'portrait' | 'landscape';
  /** Printable outer page margin in millimeters (default: 15mm) */
  marginMm?: number;
  /** Tactile Braille dot radius in millimeters (default: 0.75mm) */
  dotRadiusMm?: number;
  /** Center-to-center pitch between dots within a cell in millimeters (default: 2.5mm) */
  dotPitchMm?: number;
  /** Cell height in millimeters (default: 6.0mm) */
  cellHeightMm?: number;
  /** Vertical distance between text line baselines in millimeters (default: 10.0mm) */
  linePitchMm?: number;
  /** Human-readable title for SVG metadata */
  title?: string;
  /** Whether to render inactive dots as subtle guide points */
  includeGuideDots?: boolean;
  /** Whether to render Marburg-compliant tactile page metadata (Braille title & page number cells) */
  includeTactileMetadata?: boolean;
  /** Page number to display in Braille on tactile header line (e.g. 1 -> ⠼⠁) */
  pageNumber?: number;
  /** Whether to render a 50mm physical calibration ruler/notches for verifying printer scaling (default: true) */
  includeCalibrationRuler?: boolean;
}
