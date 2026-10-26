/**
 * Speech Controller module for AlifBraille.
 * Coordinates Web Speech API synthesis, phonetic fallback transliteration,
 * and boundary/timing events for auditory verification.
 */

import { getPhoneticFallbackText } from './phonetics.js';
import { SpeechSynthesizer, type SynthesizerOptions } from './synthesizer.js';
import type { AudioPlaybackState, ISpeechController, SpeechBoundaryEvent } from './types.js';

export * from './types.js';
export * from './phonetics.js';
export * from './synthesizer.js';

export class SpeechController implements ISpeechController {
  private _synthesizer: SpeechSynthesizer;

  constructor(options?: SynthesizerOptions) {
    this._synthesizer = new SpeechSynthesizer(options);
  }

  /**
   * Speaks the provided text using Web Speech API with boundary event dispatch.
   * Resolves when speech finishes or stops.
   */
  async speak(text: string, onBoundary?: (e: SpeechBoundaryEvent) => void): Promise<void> {
    return this._synthesizer.speak(text, onBoundary);
  }

  /**
   * Immediately stops any speech playback and resets state to 'idle'.
   */
  stop(): void {
    this._synthesizer.stop();
  }

  /**
   * Pauses active speech playback.
   */
  pause(): void {
    this._synthesizer.pause();
  }

  /**
   * Resumes paused speech playback.
   */
  resume(): void {
    this._synthesizer.resume();
  }

  /**
   * Gets current playback state ('idle' | 'playing' | 'paused').
   */
  getState(): AudioPlaybackState {
    return this._synthesizer.getState();
  }

  /**
   * Gets the active SpeechSynthesisVoice used (or null if unavailable).
   */
  getVoice(): SpeechSynthesisVoice | null {
    return this._synthesizer.getVoice();
  }

  /**
   * Sets or overrides the active voice.
   */
  setVoice(voice: SpeechSynthesisVoice | null): void {
    this._synthesizer.setVoice(voice);
  }

  /**
   * Gets underlying SpeechSynthesizer instance.
   */
  getSynthesizer(): SpeechSynthesizer {
    return this._synthesizer;
  }

  /**
   * Converts Uzbek Latin text into phonetic fallback representation
   * for TTS engines lacking native uz-UZ support.
   */
  getPhoneticFallbackText(text: string, targetOrLang?: string): string {
    const voiceLang = targetOrLang || this.getVoice()?.lang;
    return getPhoneticFallbackText(text, voiceLang);
  }
}
