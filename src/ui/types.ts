/**
 * Shared UI interface definitions for AlifBraille.
 * Defines tactile visual data models, preset structures, and application state.
 */

import type { BrailleCell } from '../types.js';

export type { BrailleCell } from '../types.js';

export interface BrailleCellVisualData extends BrailleCell {
  /** The Latin character, digraph, or token represented by this cell */
  char: string;
  /** The 6-dot Braille Unicode character (U+2800..U+283F) */
  brailleChar: string;
  /** 6-element boolean array indicating activation of dots 1 through 6 */
  dots: boolean[];
  /** 0-based sequential index of the cell in the visual grid */
  index: number;
  /** 1-based numbers of active dots (e.g. [1, 2, 4] for 'f') */
  activeDots?: number[];
  /** Accessible text description of the cell and its active dots */
  ariaLabel?: string;
  /** True if the cell represents whitespace */
  isSpace?: boolean;
  /** True if the cell represents an Uzbek digraph (e.g. sh, ch, ng) or modified letter (o', g') */
  isDigraph?: boolean;
  /** True if the cell is part of a numeric sequence */
  isNumber?: boolean;
}

export interface PresetItem {
  /** Unique machine-readable identifier for the preset */
  id: string;
  /** Human-readable localized title */
  title: string;
  /** English localized title for pitch and international judges */
  titleEn?: string;
  /** Authentic Uzbek Latin text content */
  text: string;
  /** Optional contextual description or educational notes */
  description?: string;
  /** Optional category */
  category?: 'anthem' | 'exam' | 'literature' | 'practice';
}

export interface UIState {
  /** Current raw input text in Uzbek Latin */
  inputText: string;
  /** Normalized and transliterated Unicode Braille output */
  brailleText: string;
  /** Currently selected preset identifier, or null if custom text */
  selectedPresetId: string | null;
  /** AAA high-contrast visual display mode flag */
  highContrast: boolean;
  /** Current status announcement text for screen readers */
  statusMessage: string;
  /** Currently highlighted cell index during auditory or keyboard traversal */
  activeCellIndex: number | null;
  /** Total character count of input */
  characterCount: number;
  /** Total tactile Braille cells generated */
  brailleCellCount: number;
}

export interface AppInstance {
  /** Cleans up all event listeners and DOM subscriptions */
  destroy(): void;
  /** Programmatically updates the input text and triggers transliteration/render */
  updateText(text: string): void;
}

export interface TactileGridItem {
  char: string;
  braille: string;
}
