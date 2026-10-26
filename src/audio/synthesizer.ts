/**
 * Web Speech API speech synthesis wrapper with boundary timing and voice detection.
 * Provides deterministic boundary events with Braille tactile cell mapping
 * and interval timer fallback when browser engines lack boundary support.
 */

import { normalizeUzbekText } from '../normalizer.js';
import { getPhoneticFallbackText } from './phonetics.js';
import type { AudioPlaybackState, SpeechBoundaryEvent } from './types.js';

export interface SynthesizerOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  boundaryIntervalMs?: number;
  fallbackMode?: 'auto' | 'interval' | 'native';
}

export interface AudioSpeechToken {
  index: number;
  word: string;
  charIndex: number;
  charLength: number;
  tokenIndex: number;
}

/**
 * Builds a mapping from text character index to visual Braille grid cell index.
 * Accounts for Braille numeral sign prefixes (⠼ / '#'), modified letters (o‘, g‘),
 * and digraphs (sh, ch) matching textToTactileItems in the UI.
 */
export function buildCharToTactileCellMap(text: string): number[] {
  if (!text) return [];
  const map: number[] = new Array(text.length);
  let cellIndex = 0;
  let inNumberMode = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    // Digits: insert Braille number sign prefix if starting number sequence
    if (char >= '0' && char <= '9') {
      if (!inNumberMode) {
        // Braille number sign prefix '#' cell occupies one cell index
        cellIndex++;
        inNumberMode = true;
      }
      map[i] = cellIndex;
      cellIndex++;
      i++;
      continue;
    }

    inNumberMode = false;

    // Modified letters (oʻ, gʻ)
    const charLower = char.toLowerCase();
    if ((charLower === 'o' || charLower === 'g') && /^[ʻ‘'’`´ʼ]/.test(nextChar)) {
      map[i] = cellIndex;
      if (i + 1 < len) {
        map[i + 1] = cellIndex;
      }
      cellIndex++;
      i += 2;
      continue;
    }

    // Digraphs (sh, ch)
    if (
      (charLower === 's' && nextChar.toLowerCase() === 'h') ||
      (charLower === 'c' && nextChar.toLowerCase() === 'h')
    ) {
      map[i] = cellIndex;
      if (i + 1 < len) {
        map[i + 1] = cellIndex;
      }
      cellIndex++;
      i += 2;
      continue;
    }

    // Standard character or whitespace
    map[i] = cellIndex;
    cellIndex++;
    i++;
  }

  return map;
}

/**
 * Extracts distinct spoken words and calculates character and Braille cell offsets.
 */
export function extractSpeechTokens(text: string): AudioSpeechToken[] {
  if (!text) return [];
  const cellMap = buildCharToTactileCellMap(text);
  const tokens: AudioSpeechToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const charIndex = match.index;
    const charLength = word.length;
    const tokenIndex = cellMap[charIndex] ?? 0;

    tokens.push({
      index: tokenIdx++,
      word,
      charIndex,
      charLength,
      tokenIndex,
    });
  }

  return tokens;
}

/**
 * Finds the most suitable SpeechSynthesisVoice prioritizing:
 * 1. Native Uzbek voice (uz-UZ)
 * 2. Turkish voice (tr-TR)
 * 3. Russian voice (ru-RU)
 * 4. English voice (en-US)
 * 5. Default system voice
 */
export function findBestVoice(
  voices: SpeechSynthesisVoice[],
  preferredLang?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  if (preferredLang) {
    const match = voices.find(
      (v) => v.lang.toLowerCase() === preferredLang.toLowerCase() || v.lang.toLowerCase().startsWith(preferredLang.toLowerCase())
    );
    if (match) return match;
  }

  // 1. Native Uzbek
  const uzVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('uz') ||
      v.name.toLowerCase().includes('uzbek') ||
      v.name.toLowerCase().includes('o‘zbek') ||
      v.name.toLowerCase().includes('ozbek')
  );
  if (uzVoice) return uzVoice;

  // 2. Turkish (Turkic phonetic standard)
  const trVoice = voices.find((v) => v.lang.toLowerCase().startsWith('tr'));
  if (trVoice) return trVoice;

  // 3. Russian (prevalent in Central Asian school PCs)
  const ruVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ru'));
  if (ruVoice) return ruVoice;

  // 4. English
  const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (enVoice) return enVoice;

  // 5. Default voice
  const defaultVoice = voices.find((v) => v.default);
  if (defaultVoice) return defaultVoice;

  return voices[0] || null;
}

export class SpeechSynthesizer {
  private _state: AudioPlaybackState = 'idle';
  private _options: SynthesizerOptions = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    boundaryIntervalMs: 200,
    fallbackMode: 'auto',
  };

  private _cachedVoice: SpeechSynthesisVoice | null = null;
  private _currentUtterance: SpeechSynthesisUtterance | null = null;
  private _pendingResolve: (() => void) | null = null;

  // Interval timer fallback state
  private _fallbackTimer: any = null;
  private _hasNativeBoundaries: boolean = false;
  private _tokens: AudioSpeechToken[] = [];
  private _currentTokenIdx: number = 0;
  private _startTime: number = 0;
  private _pausedElapsed: number = 0;
  private _pauseTimestamp: number = 0;
  private _activeOnBoundary: ((e: SpeechBoundaryEvent) => void) | null = null;

  constructor(options?: SynthesizerOptions) {
    if (options) {
      this._options = { ...this._options, ...options };
    }
  }

  getState(): AudioPlaybackState {
    return this._state;
  }

  getOptions(): SynthesizerOptions {
    return { ...this._options };
  }

  setOptions(options: Partial<SynthesizerOptions>): void {
    this._options = { ...this._options, ...options };
  }

  private getSpeechSynthesis(): SpeechSynthesis | null {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).speechSynthesis) {
      return (globalThis as any).speechSynthesis;
    }
    return null;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    const synth = this.getSpeechSynthesis();
    if (!synth || typeof synth.getVoices !== 'function') return [];
    return synth.getVoices();
  }

  getVoice(): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    this._cachedVoice = findBestVoice(voices, this._options.lang);
    return this._cachedVoice;
  }

  setVoice(voice: SpeechSynthesisVoice | null): void {
    this._cachedVoice = voice;
  }

  /**
   * Speaks the provided text using Web Speech API with boundary event dispatch.
   * Resolves when playback completes, stops, or cancels without throwing unhandled rejections.
   */
  async speak(
    text: string,
    onBoundary?: (e: SpeechBoundaryEvent) => void,
    overrideOptions?: SynthesizerOptions
  ): Promise<void> {
    // 1. Cancel any active playback before starting new speech
    this.stop();

    if (!text || text.trim().length === 0) {
      this._state = 'idle';
      return;
    }

    const opts: SynthesizerOptions = { ...this._options, ...overrideOptions };
    const voice = this.getVoice();
    const isNativeUz = voice?.lang.toLowerCase().startsWith('uz') ?? false;

    // Use normalized text if native uz voice exists; otherwise use phonetic fallback
    const textToSpeak = isNativeUz
      ? normalizeUzbekText(text)
      : getPhoneticFallbackText(text, voice?.lang);

    this._tokens = extractSpeechTokens(text);
    this._currentTokenIdx = 0;
    this._hasNativeBoundaries = false;
    this._activeOnBoundary = onBoundary ?? null;
    this._startTime = performance.now();
    this._pausedElapsed = 0;
    this._pauseTimestamp = 0;

    const synth = this.getSpeechSynthesis();

    return new Promise<void>((resolve) => {
      let isResolved = false;

      const finishPlayback = () => {
        if (!isResolved) {
          isResolved = true;
          this.clearFallbackTimer();
          this._state = 'idle';
          this._currentUtterance = null;
          this._pendingResolve = null;
          this._activeOnBoundary = null;
          resolve();
        }
      };

      this._pendingResolve = finishPlayback;

      // Check if SpeechSynthesisUtterance constructor is available
      const UtteranceClass =
        (typeof window !== 'undefined' && (window as any).SpeechSynthesisUtterance) ||
        (typeof globalThis !== 'undefined' && (globalThis as any).SpeechSynthesisUtterance);

      if (!synth || !UtteranceClass) {
        // Fallback simulation mode when Web Speech API is absent entirely
        this._state = 'playing';
        this.runFallbackTimer(opts, finishPlayback);
        return;
      }

      const utterance: SpeechSynthesisUtterance = new UtteranceClass(textToSpeak);
      this._currentUtterance = utterance;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else if (opts.lang) {
        utterance.lang = opts.lang;
      } else {
        utterance.lang = 'uz-UZ';
      }

      utterance.rate = opts.rate ?? 1.0;
      utterance.pitch = opts.pitch ?? 1.0;
      utterance.volume = opts.volume ?? 1.0;

      // Event listeners
      utterance.onstart = () => {
        this._state = 'playing';
        this._startTime = performance.now();

        // If mock synthesis autoPlay is disabled or emitBoundaries is false,
        // or fallbackMode is 'interval', arm the fallback interval timer
        const mockSynth = synth as any;
        const lacksBoundaries =
          opts.fallbackMode === 'interval' ||
          (mockSynth.emitBoundariesOnAutoPlay === false) ||
          opts.fallbackMode === 'auto';

        if (lacksBoundaries && this._tokens.length > 0 && this._activeOnBoundary) {
          this.armFallbackTimerWatchdog(opts, finishPlayback);
        }
      };

      utterance.onboundary = (ev: any) => {
        this._hasNativeBoundaries = true;
        this.clearFallbackTimer();

        if (this._activeOnBoundary) {
          this.dispatchNativeBoundaryEvent(ev, text);
        }
      };

      utterance.onpause = () => {
        this._state = 'paused';
        this.pauseFallbackTimer();
      };

      utterance.onresume = () => {
        this._state = 'playing';
        this.resumeFallbackTimer(opts, finishPlayback);
      };

      utterance.onend = () => {
        finishPlayback();
      };

      utterance.onerror = (ev: any) => {
        // Canceled or interrupted errors are standard when stop() or pause() is called
        finishPlayback();
      };

      try {
        this._state = 'playing';
        synth.speak(utterance);
      } catch (err) {
        // If synth.speak throws, resolve gracefully without unhandled rejection
        finishPlayback();
      }
    });
  }

  /**
   * Dispatches a normalized SpeechBoundaryEvent from native browser boundary events.
   */
  private dispatchNativeBoundaryEvent(ev: any, originalText: string): void {
    if (!this._activeOnBoundary) return;

    const charIndex = typeof ev.charIndex === 'number' ? ev.charIndex : 0;
    const cellMap = buildCharToTactileCellMap(originalText);
    const tokenIndex = cellMap[charIndex] ?? 0;

    // Find token matching this character offset or fallback to current token
    const token =
      this._tokens.find(
        (t) => charIndex >= t.charIndex && charIndex < t.charIndex + Math.max(1, t.charLength)
      ) ||
      this._tokens[this._currentTokenIdx] ||
      null;

    const word =
      token?.word ||
      (originalText.slice(charIndex, charIndex + (ev.charLength || 1)).trim() || 'word');

    const charLength = ev.charLength && ev.charLength > 0 ? ev.charLength : (token ? token.charLength : word.length);
    const elapsedTime =
      typeof ev.elapsedTime === 'number' && ev.elapsedTime > 0
        ? ev.elapsedTime
        : (performance.now() - this._startTime) / 1000;

    this._activeOnBoundary({
      charIndex,
      charLength,
      name: ev.name || 'word',
      elapsedTime,
      tokenIndex,
      token: word,
      word,
    });

    if (token) {
      this._currentTokenIdx = token.index + 1;
    }
  }

  /**
   * Arms a deterministic fallback interval timer that fires when native boundaries are absent.
   */
  private armFallbackTimerWatchdog(opts: SynthesizerOptions, onComplete: () => void): void {
    // If fallbackMode is strictly native, do nothing
    if (opts.fallbackMode === 'native') return;

    if (opts.fallbackMode === 'interval') {
      this.runFallbackTimer(opts, onComplete, true);
    } else {
      // Auto mode: wait interval duration before falling back if native boundaries never arrive
      const interval = opts.boundaryIntervalMs ?? 150;
      this.clearFallbackTimer();
      this._fallbackTimer = setTimeout(() => {
        if (!this._hasNativeBoundaries && this._state === 'playing') {
          this.runFallbackTimer(opts, onComplete, true);
        }
      }, interval);
    }
  }

  private runFallbackTimer(
    opts: SynthesizerOptions,
    onComplete?: () => void,
    emitInitialImmediately: boolean = false
  ): void {
    this.clearFallbackTimer();
    if (!this._activeOnBoundary || this._tokens.length === 0) return;

    const interval = opts.boundaryIntervalMs ?? 150;

    const tick = () => {
      // If native boundaries took over or playback stopped, cancel timer
      if (this._hasNativeBoundaries || this._state !== 'playing') {
        this.clearFallbackTimer();
        return;
      }

      if (this._currentTokenIdx < this._tokens.length) {
        const token = this._tokens[this._currentTokenIdx];
        const elapsedTime = (performance.now() - this._startTime - this._pausedElapsed) / 1000;

        if (this._activeOnBoundary) {
          this._activeOnBoundary({
            charIndex: token.charIndex,
            charLength: token.charLength,
            name: 'word',
            elapsedTime,
            tokenIndex: token.tokenIndex,
            token: token.word,
            word: token.word,
          });
        }

        this._currentTokenIdx++;
      } else {
        this.clearFallbackTimer();
        if (onComplete) onComplete();
      }
    };

    if (emitInitialImmediately && this._currentTokenIdx === 0) {
      tick();
    }

    this._fallbackTimer = setInterval(tick, interval);
  }

  private pauseFallbackTimer(): void {
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
    this._pauseTimestamp = performance.now();
  }

  private resumeFallbackTimer(opts: SynthesizerOptions, onComplete?: () => void): void {
    if (this._pauseTimestamp > 0) {
      this._pausedElapsed += performance.now() - this._pauseTimestamp;
      this._pauseTimestamp = 0;
    }
    if (!this._hasNativeBoundaries && this._activeOnBoundary) {
      this.runFallbackTimer(opts, onComplete);
    }
  }

  private clearFallbackTimer(): void {
    if (this._fallbackTimer) {
      clearInterval(this._fallbackTimer);
      this._fallbackTimer = null;
    }
  }

  stop(): void {
    this.clearFallbackTimer();
    this._state = 'idle';

    const synth = this.getSpeechSynthesis();
    if (synth && typeof synth.cancel === 'function') {
      try {
        synth.cancel();
      } catch (err) {
        // Safe catch
      }
    }

    if (this._pendingResolve) {
      const resolve = this._pendingResolve;
      this._pendingResolve = null;
      resolve();
    }

    this._currentUtterance = null;
    this._activeOnBoundary = null;
  }

  pause(): void {
    if (this._state === 'playing') {
      this._state = 'paused';
      this.pauseFallbackTimer();
      const synth = this.getSpeechSynthesis();
      if (synth && typeof synth.pause === 'function') {
        try {
          synth.pause();
        } catch (err) {
          // Safe catch
        }
      }
    }
  }

  resume(): void {
    if (this._state === 'paused') {
      this._state = 'playing';
      this.resumeFallbackTimer(this._options, this._pendingResolve ?? undefined);
      const synth = this.getSpeechSynthesis();
      if (synth && typeof synth.resume === 'function') {
        try {
          synth.resume();
        } catch (err) {
          // Safe catch
        }
      }
    }
  }
}
