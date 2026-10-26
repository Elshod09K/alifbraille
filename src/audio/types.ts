/**
 * Shared type definitions and interfaces for the AlifBraille Speech & Auditory Verification Engine.
 * Milestone 4: Sighted-Teacher Auditory Verification & Speech Sync.
 */

export type AudioPlaybackState = 'idle' | 'playing' | 'paused';

export interface SpeechBoundaryEvent {
  /** Character index within the text being spoken */
  charIndex: number;
  /** Character length of the active word/token */
  charLength?: number;
  /** Name of boundary type (e.g. 'word' or 'sentence') */
  name?: string;
  /** Elapsed playback time in seconds */
  elapsedTime?: number;
  /** Zero-based token index matching visual Braille grid cells */
  tokenIndex?: number;
  /** Text content of current spoken token */
  token?: string;
  /** Word string */
  word?: string;
}

export interface ISpeechController {
  /**
   * Speaks the provided text using Web Speech API with boundary event dispatch.
   * Resolves when speech finishes or stops.
   */
  speak(text: string, onBoundary?: (e: SpeechBoundaryEvent) => void): Promise<void>;

  /**
   * Immediately stops any speech playback and resets state to 'idle'.
   */
  stop(): void;

  /**
   * Pauses active speech playback.
   */
  pause(): void;

  /**
   * Resumes paused speech playback.
   */
  resume(): void;

  /**
   * Gets current playback state.
   */
  getState(): AudioPlaybackState;

  /**
   * Gets the active SpeechSynthesisVoice used (or null if unavailable).
   */
  getVoice(): SpeechSynthesisVoice | null;

  /**
   * Converts Uzbek Latin text into phonetic fallback representation
   * for TTS engines lacking native uz-UZ support.
   */
  getPhoneticFallbackText(text: string): string;
}
