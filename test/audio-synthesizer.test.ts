import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SpeechController,
  SpeechSynthesizer,
  buildCharToTactileCellMap,
  extractSpeechTokens,
  findBestVoice,
} from '../src/audio/index.js';
import {
  installSpeechSynthesisMock,
  uninstallSpeechSynthesisMock,
  MockSpeechSynthesis,
  MockSpeechSynthesisVoice,
} from './mocks/speech-synthesis.mock.js';
import type { SpeechBoundaryEvent } from '../src/audio/types.js';

describe('SpeechController & Web Speech API Synthesizer', () => {
  let mockSynthesis: MockSpeechSynthesis;
  let controller: SpeechController;

  beforeEach(() => {
    mockSynthesis = installSpeechSynthesisMock();
    controller = new SpeechController();
  });

  afterEach(() => {
    controller.stop();
    uninstallSpeechSynthesisMock();
  });

  describe('Interface & Initial State', () => {
    it('initializes in idle state', () => {
      expect(controller.getState()).toBe('idle');
    });

    it('implements ISpeechController interface methods', () => {
      expect(typeof controller.speak).toBe('function');
      expect(typeof controller.stop).toBe('function');
      expect(typeof controller.pause).toBe('function');
      expect(typeof controller.resume).toBe('function');
      expect(typeof controller.getState).toBe('function');
      expect(typeof controller.getVoice).toBe('function');
      expect(typeof controller.getPhoneticFallbackText).toBe('function');
    });

    it('handles empty or whitespace string without throwing and returns idle', async () => {
      await controller.speak('');
      expect(controller.getState()).toBe('idle');

      await controller.speak('   \t\n  ');
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('Tactile Cell Mapping & Speech Token Extraction', () => {
    it('builds character to Braille tactile cell index mapping', () => {
      // "Salom" -> S(0), a(1), l(2), o(3), m(4)
      const map = buildCharToTactileCellMap('Salom');
      expect(map).toEqual([0, 1, 2, 3, 4]);
    });

    it('accounts for modified letters o‘ and g‘ as single tactile cells', () => {
      // "o‘rdak": o‘ (cell 0, chars 0 and 1), r(1), d(2), a(3), k(4)
      const mapO = buildCharToTactileCellMap('o‘rdak');
      expect(mapO[0]).toBe(0);
      expect(mapO[1]).toBe(0); // apostrophe shares cell 0
      expect(mapO[2]).toBe(1);

      // "g‘alaba": g‘ (cell 0, chars 0 and 1), a(1), l(2), a(3), b(4), a(5)
      const mapG = buildCharToTactileCellMap('g‘alaba');
      expect(mapG[0]).toBe(0);
      expect(mapG[1]).toBe(0);
      expect(mapG[2]).toBe(1);
    });

    it('accounts for digraphs sh and ch as single tactile cells', () => {
      // "shahar": sh (cell 0, chars 0 and 1), a(1), h(2), a(3), r(4)
      const mapSh = buildCharToTactileCellMap('shahar');
      expect(mapSh[0]).toBe(0);
      expect(mapSh[1]).toBe(0);
      expect(mapSh[2]).toBe(1);

      // "choy": ch (cell 0, chars 0 and 1), o(1), y(2)
      const mapCh = buildCharToTactileCellMap('choy');
      expect(mapCh[0]).toBe(0);
      expect(mapCh[1]).toBe(0);
      expect(mapCh[2]).toBe(1);
    });

    it('accounts for Braille number prefix # offset in numeric passages', () => {
      // "1991": prefix '#' is cell 0, digit '1' is cell 1, '9' is cell 2, '9' is cell 3, '1' is cell 4
      const mapNum = buildCharToTactileCellMap('1991');
      expect(mapNum[0]).toBe(1);
      expect(mapNum[1]).toBe(2);
      expect(mapNum[2]).toBe(3);
      expect(mapNum[3]).toBe(4);
    });

    it('extracts speech tokens with corresponding tactile cell offsets', () => {
      const tokens = extractSpeechTokens('Salom O‘zbekiston maktab');
      expect(tokens.length).toBe(3);
      expect(tokens[0].word).toBe('Salom');
      expect(tokens[0].charIndex).toBe(0);
      expect(tokens[0].tokenIndex).toBe(0);

      expect(tokens[1].word).toBe('O‘zbekiston');
      expect(tokens[1].charIndex).toBe(6);
      expect(tokens[1].tokenIndex).toBe(6); // 5 letters + 1 space = cell index 6

      expect(tokens[2].word).toBe('maktab');
    });
  });

  describe('Voice Detection & Fallback Hierarchy', () => {
    it('selects native uz-UZ voice when present in system voices', () => {
      const voice = controller.getVoice();
      expect(voice).toBeDefined();
      expect(voice?.lang).toBe('uz-UZ');
    });

    it('falls back to Turkish, Russian, or English when native uz-UZ is absent', () => {
      const russianVoice = new MockSpeechSynthesisVoice({
        name: 'Russian Voice',
        lang: 'ru-RU',
        default: false,
      });
      const englishVoice = new MockSpeechSynthesisVoice({
        name: 'English Voice',
        lang: 'en-US',
        default: true,
      });

      mockSynthesis.setVoices([russianVoice, englishVoice]);

      const selected = controller.getVoice();
      expect(selected).toBeDefined();
      expect(selected?.lang).toBe('ru-RU');
    });

    it('uses phonetic fallback text in utterance when native uz-UZ voice is missing', async () => {
      const russianVoice = new MockSpeechSynthesisVoice({
        name: 'Russian Voice',
        lang: 'ru-RU',
      });
      mockSynthesis.setVoices([russianVoice]);

      mockSynthesis.autoPlay = true;
      await controller.speak('O‘zbekiston Respublikasi');

      expect(mockSynthesis.speakCallHistory.length).toBe(1);
      const utterance = mockSynthesis.speakCallHistory[0];
      expect(utterance.voice?.lang).toBe('ru-RU');
      // Cyrillic phonetic transliteration for Russian TTS
      expect(utterance.text).toBe('Ўзбекистон Республикаси');
    });

    it('findBestVoice function prioritizes preferred language if specified', () => {
      const v1 = new MockSpeechSynthesisVoice({ name: 'V1', lang: 'en-US' });
      const v2 = new MockSpeechSynthesisVoice({ name: 'V2', lang: 'tr-TR' });
      const chosen = findBestVoice([v1, v2], 'tr-TR');
      expect(chosen?.lang).toBe('tr-TR');
    });
  });

  describe('Voice Lifecycle Transitions', () => {
    it('executes clean lifecycle: idle -> playing -> idle on completion', async () => {
      mockSynthesis.autoPlay = false;

      const speakPromise = controller.speak('Assalomu alaykum');
      expect(controller.getState()).toBe('playing');

      mockSynthesis.triggerEnd();
      await speakPromise;
      expect(controller.getState()).toBe('idle');
    });

    it('auto-completes speak() promise when autoPlay is enabled', async () => {
      mockSynthesis.autoPlay = true;
      await controller.speak('Assalomu alaykum');
      expect(controller.getState()).toBe('idle');
    });

    it('executes clean lifecycle: playing -> paused -> playing -> idle', async () => {
      mockSynthesis.autoPlay = false;

      const speakPromise = controller.speak('Bir ikki uch');
      expect(controller.getState()).toBe('playing');

      controller.pause();
      expect(controller.getState()).toBe('paused');
      expect(mockSynthesis.paused).toBe(true);

      controller.resume();
      expect(controller.getState()).toBe('playing');
      expect(mockSynthesis.paused).toBe(false);

      mockSynthesis.triggerEnd();
      await speakPromise;
      expect(controller.getState()).toBe('idle');
    });

    it('stops playback immediately and returns to idle state without unhandled rejection', async () => {
      mockSynthesis.autoPlay = false;

      const speakPromise = controller.speak('Tinchlik va taraqqiyot');
      expect(controller.getState()).toBe('playing');

      controller.stop();
      expect(controller.getState()).toBe('idle');

      await speakPromise; // Must resolve cleanly
      expect(controller.getState()).toBe('idle');
    });

    it('handles multiple consecutive speak() calls cleanly by canceling previous', async () => {
      mockSynthesis.autoPlay = false;

      const p1 = controller.speak('Birinchi matn');
      expect(controller.getState()).toBe('playing');

      const p2 = controller.speak('Ikkinchi matn');
      expect(controller.getState()).toBe('playing');

      mockSynthesis.triggerEnd();
      await Promise.all([p1, p2]);
      expect(controller.getState()).toBe('idle');
    });

    it('handles synthesizer error events gracefully without crashing', async () => {
      mockSynthesis.autoPlay = false;

      const speakPromise = controller.speak('Sinov matni');
      expect(controller.getState()).toBe('playing');

      mockSynthesis.triggerError('synthesis-failed');
      await speakPromise;
      expect(controller.getState()).toBe('idle');
    });
  });

  describe('Speech Boundary Events (Native & Fallback Timing)', () => {
    it('triggers boundary callbacks with token and character offsets on native events', async () => {
      mockSynthesis.autoPlay = false;

      const boundaries: SpeechBoundaryEvent[] = [];
      const speakPromise = controller.speak('Salom maktab', (ev) => {
        boundaries.push(ev);
      });

      // Trigger word boundaries
      mockSynthesis.triggerBoundary({ charIndex: 0, charLength: 5, name: 'word' });
      mockSynthesis.triggerBoundary({ charIndex: 6, charLength: 6, name: 'word' });
      mockSynthesis.triggerEnd();

      await speakPromise;

      expect(boundaries.length).toBe(2);
      expect(boundaries[0].charIndex).toBe(0);
      expect(boundaries[0].tokenIndex).toBe(0);
      expect(boundaries[0].word).toBe('Salom');

      expect(boundaries[1].charIndex).toBe(6);
      expect(boundaries[1].tokenIndex).toBe(6);
      expect(boundaries[1].word).toBe('maktab');
    });

    it('falls back to deterministic interval timer when browser synthesis lacks boundary events', async () => {
      vi.useFakeTimers();

      const synth = new SpeechSynthesizer({
        boundaryIntervalMs: 50,
        fallbackMode: 'interval',
      });

      const boundaries: SpeechBoundaryEvent[] = [];
      mockSynthesis.autoPlay = false;

      const speakPromise = synth.speak('Bir ikki uch', (ev) => {
        boundaries.push(ev);
      });

      expect(synth.getState()).toBe('playing');

      // Tick 0 emits first token immediately
      expect(boundaries.length).toBe(1);
      expect(boundaries[0].word).toBe('Bir');
      expect(boundaries[0].tokenIndex).toBe(0);

      // Advance by 50ms -> second token
      vi.advanceTimersByTime(50);
      expect(boundaries.length).toBe(2);
      expect(boundaries[1].word).toBe('ikki');

      // Advance by 50ms -> third token
      vi.advanceTimersByTime(50);
      expect(boundaries.length).toBe(3);
      expect(boundaries[2].word).toBe('uch');

      // End playback
      mockSynthesis.triggerEnd();
      await speakPromise;

      expect(synth.getState()).toBe('idle');
      vi.useRealTimers();
    });

    it('pauses and resumes fallback interval timer correctly', async () => {
      vi.useFakeTimers();

      const synth = new SpeechSynthesizer({
        boundaryIntervalMs: 50,
        fallbackMode: 'interval',
      });

      const boundaries: SpeechBoundaryEvent[] = [];
      mockSynthesis.autoPlay = false;

      synth.speak('Bir ikki uch to‘rt', (ev) => {
        boundaries.push(ev);
      });

      expect(boundaries.length).toBe(1); // 'Bir'

      synth.pause();
      expect(synth.getState()).toBe('paused');

      // Advancing while paused should not fire callbacks
      vi.advanceTimersByTime(100);
      expect(boundaries.length).toBe(1);

      // Resume
      synth.resume();
      expect(synth.getState()).toBe('playing');

      vi.advanceTimersByTime(50);
      expect(boundaries.length).toBe(2); // 'ikki'

      synth.stop();
      expect(synth.getState()).toBe('idle');
      vi.useRealTimers();
    });
  });
});
