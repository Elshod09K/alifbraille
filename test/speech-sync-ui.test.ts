import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initAudioControls, buildCharToCellIndexMap } from '../src/ui/audio-controls.js';
import { highlightBrailleCell, clearSpeechHighlights } from '../src/ui/speech-highlighter.js';
import { SpeechController } from '../src/audio/index.js';
import type { ISpeechController, SpeechBoundaryEvent, AudioPlaybackState } from '../src/audio/types.js';
import {
  installSpeechSynthesisMock,
  uninstallSpeechSynthesisMock,
} from './mocks/speech-synthesis.mock.js';

/**
 * Controllable mock controller for deterministic boundary testing.
 */
class ControllableSpeechController implements ISpeechController {
  private _state: AudioPlaybackState = 'idle';
  public onBoundaryCallback?: (e: SpeechBoundaryEvent) => void;
  public speakResolve?: () => void;
  public speakPromise?: Promise<void>;
  public stopCallCount = 0;
  public lastSpokenText: string = '';

  speak(text: string, onBoundary?: (e: SpeechBoundaryEvent) => void): Promise<void> {
    this._state = 'playing';
    this.lastSpokenText = text;
    this.onBoundaryCallback = onBoundary;
    return new Promise<void>((resolve) => {
      this.speakResolve = () => {
        this._state = 'idle';
        resolve();
      };
    });
  }

  stop(): void {
    this._state = 'idle';
    this.stopCallCount++;
    if (this.speakResolve) {
      this.speakResolve();
    }
  }

  pause(): void {
    this._state = 'paused';
  }

  resume(): void {
    this._state = 'playing';
  }

  getState(): AudioPlaybackState {
    return this._state;
  }

  getVoice(): SpeechSynthesisVoice | null {
    return null;
  }

  getPhoneticFallbackText(text: string): string {
    return text;
  }

  emitBoundary(event: SpeechBoundaryEvent): void {
    if (this.onBoundaryCallback) {
      this.onBoundaryCallback(event);
    }
  }
}

describe('Speech Sync UI & Highlighting Controls', () => {
  let container: HTMLElement;
  let gridContainer: HTMLElement;
  let mockController: ControllableSpeechController;

  beforeEach(() => {
    installSpeechSynthesisMock();
    container = document.createElement('div');
    container.id = 'audio-controls-container';
    document.body.appendChild(container);

    // Create a simulated tactile grid in DOM
    gridContainer = document.createElement('div');
    gridContainer.id = 'braille-output';
    gridContainer.className = 'tactile-grid';
    for (let i = 0; i < 10; i++) {
      const cell = document.createElement('div');
      cell.className = 'tactile-cell';
      cell.setAttribute('data-index', String(i));
      cell.setAttribute('data-char', `c${i}`);
      cell.innerHTML = `
        <span class="tactile-cell-char">c${i}</span>
        <div class="tactile-dots">
          <span class="tactile-dot tactile-dot--active"></span>
          <span class="tactile-dot tactile-dot--inactive"></span>
        </div>
      `;
      gridContainer.appendChild(cell);
    }
    document.body.appendChild(gridContainer);

    mockController = new ControllableSpeechController();
  });

  afterEach(() => {
    uninstallSpeechSynthesisMock();
    clearSpeechHighlights();
    container.remove();
    gridContainer.remove();
  });

  describe('Module Exports & Basic Health', () => {
    it('exports initAudioControls function', () => {
      expect(typeof initAudioControls).toBe('function');
      const stdController = new SpeechController();
      expect(() => initAudioControls(container, stdController, () => 'salom')).not.toThrow();
    });

    it('exports highlightBrailleCell and clearSpeechHighlights functions', () => {
      expect(typeof highlightBrailleCell).toBe('function');
      expect(typeof clearSpeechHighlights).toBe('function');
    });

    it('handles null and invalid parameters gracefully', () => {
      expect(() => highlightBrailleCell(null)).not.toThrow();
      expect(() => highlightBrailleCell(-5)).not.toThrow();
      expect(() => highlightBrailleCell(999)).not.toThrow();
      expect(() => clearSpeechHighlights()).not.toThrow();
    });
  });

  describe('DOM Mounting & Initial Control States', () => {
    it('renders Play button, Stop button, and polite live status element', () => {
      initAudioControls(container, mockController, () => 'Salom O‘zbekiston');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn');
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn');
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status');

      expect(playBtn).not.toBeNull();
      expect(stopBtn).not.toBeNull();
      expect(liveStatus).not.toBeNull();

      expect(playBtn?.textContent?.trim()).toBe('Tinglash');
      expect(playBtn?.getAttribute('aria-pressed')).toBe('false');
      expect(playBtn?.getAttribute('aria-label')).toContain('Tinglash');

      expect(stopBtn?.textContent?.trim()).toBe('To‘xtatish');
      expect(stopBtn?.disabled).toBe(true);
      expect(stopBtn?.getAttribute('aria-label')).toContain('To‘xtatish');

      expect(liveStatus?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Control State Changes & ARIA Live Announcements', () => {
    it('clicking "Tinglash" toggles button state to "To‘xtatish" and announces status via aria-live="polite"', async () => {
      initAudioControls(container, mockController, () => 'O‘zbekiston');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;

      // Initial state
      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(playBtn.getAttribute('aria-pressed')).toBe('false');
      expect(stopBtn.disabled).toBe(true);

      // Click Tinglash
      playBtn.click();

      // Button state changes immediately to 'To‘xtatish'
      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');
      expect(playBtn.getAttribute('aria-pressed')).toBe('true');
      expect(playBtn.getAttribute('aria-label')).toContain('To‘xtatish');
      expect(stopBtn.disabled).toBe(false);

      // Status announced via aria-live="polite"
      expect(liveStatus.textContent).toBe('Matn ovozli o‘qilmoqda...');
      expect(mockController.getState()).toBe('playing');
      expect(mockController.lastSpokenText).toBe('O‘zbekiston');
    });

    it('clicking "To‘xtatish" toggles button state back to "Tinglash" and announces stopped status', () => {
      initAudioControls(container, mockController, () => 'Salom');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;

      // Start playback
      playBtn.click();
      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');

      // Click To‘xtatish on the same toggle button
      playBtn.click();

      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(playBtn.getAttribute('aria-pressed')).toBe('false');
      expect(stopBtn.disabled).toBe(true);
      expect(liveStatus.textContent).toBe('Ovozli o‘qish to‘xtatildi.');
      expect(mockController.stopCallCount).toBe(1);
    });

    it('clicking Stop button halts playback immediately and resets control state', () => {
      initAudioControls(container, mockController, () => 'Salom');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;

      playBtn.click();
      expect(stopBtn.disabled).toBe(false);

      stopBtn.click();

      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(playBtn.getAttribute('aria-pressed')).toBe('false');
      expect(stopBtn.disabled).toBe(true);
      expect(liveStatus.textContent).toBe('Ovozli o‘qish to‘xtatildi.');
      expect(mockController.stopCallCount).toBe(1);
    });

    it('announces warning and does not trigger speech when input text is empty', () => {
      initAudioControls(container, mockController, () => '   ');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;

      playBtn.click();

      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(playBtn.getAttribute('aria-pressed')).toBe('false');
      expect(liveStatus.textContent).toBe('O‘qish uchun matn mavjud emas.');
      expect(mockController.getState()).toBe('idle');
    });

    it('resets control state and announces completion when speech resolves naturally', async () => {
      initAudioControls(container, mockController, () => 'Salom');

      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;

      playBtn.click();
      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');

      // Simulate natural speech end
      mockController.speakResolve?.();
      await vi.waitFor(() => {
        expect(playBtn.textContent?.trim()).toBe('Tinglash');
      });

      expect(playBtn.getAttribute('aria-pressed')).toBe('false');
      expect(stopBtn.disabled).toBe(true);
      expect(liveStatus.textContent).toBe('Ovozli o‘qish yakunlandi.');
    });
  });

  describe('Braille Cell Dynamic Speech Highlighting', () => {
    it('applies .cell-speaking and data-active-speech="true" to the target Braille cell', () => {
      const cells = gridContainer.querySelectorAll<HTMLElement>('.tactile-cell');
      expect(cells.length).toBe(10);

      highlightBrailleCell(3);

      expect(cells[3].classList.contains('cell-speaking')).toBe(true);
      expect(cells[3].getAttribute('data-active-speech')).toBe('true');

      // Other cells must NOT be highlighted
      expect(cells[0].classList.contains('cell-speaking')).toBe(false);
      expect(cells[2].classList.contains('cell-speaking')).toBe(false);
      expect(cells[4].classList.contains('cell-speaking')).toBe(false);
    });

    it('moves highlight dynamically from cell to cell and clears previous cell', () => {
      const cells = gridContainer.querySelectorAll<HTMLElement>('.tactile-cell');

      highlightBrailleCell(1);
      expect(cells[1].classList.contains('cell-speaking')).toBe(true);
      expect(cells[1].getAttribute('data-active-speech')).toBe('true');

      highlightBrailleCell(2);
      expect(cells[1].classList.contains('cell-speaking')).toBe(false);
      expect(cells[1].hasAttribute('data-active-speech')).toBe(false);
      expect(cells[2].classList.contains('cell-speaking')).toBe(true);
      expect(cells[2].getAttribute('data-active-speech')).toBe('true');
    });

    it('clearSpeechHighlights() clears all speech highlights', () => {
      const cells = gridContainer.querySelectorAll<HTMLElement>('.tactile-cell');

      highlightBrailleCell(4);
      expect(cells[4].classList.contains('cell-speaking')).toBe(true);

      clearSpeechHighlights();
      expect(cells[4].classList.contains('cell-speaking')).toBe(false);
      expect(cells[4].hasAttribute('data-active-speech')).toBe(false);
      expect(document.querySelectorAll('.cell-speaking').length).toBe(0);
    });

    it('synchronizes highlighting with active speech token index via boundary events', () => {
      initAudioControls(container, mockController, () => 'Salom dunyo');
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      playBtn.click();

      const cells = gridContainer.querySelectorAll<HTMLElement>('.tactile-cell');

      // Dispatch boundary event with tokenIndex 0
      mockController.emitBoundary({
        charIndex: 0,
        tokenIndex: 0,
        name: 'word',
        token: 'Salom',
      });

      expect(cells[0].classList.contains('cell-speaking')).toBe(true);
      expect(cells[0].getAttribute('data-active-speech')).toBe('true');

      // Dispatch boundary event with tokenIndex 6
      mockController.emitBoundary({
        charIndex: 6,
        tokenIndex: 6,
        name: 'word',
        token: 'dunyo',
      });

      expect(cells[0].classList.contains('cell-speaking')).toBe(false);
      expect(cells[6].classList.contains('cell-speaking')).toBe(true);
      expect(cells[6].getAttribute('data-active-speech')).toBe('true');
    });

    it('clears Braille cell highlights immediately when stopped', () => {
      initAudioControls(container, mockController, () => 'Salom');
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      playBtn.click();

      const cells = gridContainer.querySelectorAll<HTMLElement>('.tactile-cell');
      mockController.emitBoundary({ charIndex: 0, tokenIndex: 2 });
      expect(cells[2].classList.contains('cell-speaking')).toBe(true);

      // Stop audio
      playBtn.click();
      expect(cells[2].classList.contains('cell-speaking')).toBe(false);
      expect(document.querySelectorAll('.cell-speaking').length).toBe(0);
    });
  });

  describe('Char-to-Cell Index Mapping for Uzbek Orthography', () => {
    it('correctly maps standard letters, digraphs, and modified apostrophes', () => {
      // "O‘zbekiston" -> O‘ (cell 0), z (cell 1), b (cell 2), e (cell 3), k (cell 4)...
      const map = buildCharToCellIndexMap('O‘zbek');
      expect(map[0]).toBe(0); // 'O'
      expect(map[1]).toBe(0); // '‘' (part of O‘)
      expect(map[2]).toBe(1); // 'z'
      expect(map[3]).toBe(2); // 'b'
      expect(map[4]).toBe(3); // 'e'
      expect(map[5]).toBe(4); // 'k'
    });

    it('correctly maps digraphs like "sh" and "ch"', () => {
      const map = buildCharToCellIndexMap('shahar');
      expect(map[0]).toBe(0); // 's'
      expect(map[1]).toBe(0); // 'h' (part of sh)
      expect(map[2]).toBe(1); // 'a'
      expect(map[3]).toBe(2); // 'h'
      expect(map[4]).toBe(3); // 'a'
      expect(map[5]).toBe(4); // 'r'
    });

    it('correctly accounts for Braille number prefix in numeric sequences', () => {
      const map = buildCharToCellIndexMap('12');
      // Cell 0 is '#' (number prefix), cell 1 is '1', cell 2 is '2'
      expect(map[0]).toBe(1); // '1'
      expect(map[1]).toBe(2); // '2'
    });
  });

  describe('Keyboard Shortcuts & Accessibility Controls', () => {
    it('Alt+L triggers playback when idle and halts playback when playing', () => {
      initAudioControls(container, mockController, () => 'Salom test');
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;

      expect(playBtn.textContent?.trim()).toBe('Tinglash');

      // Press Alt+L
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'l', altKey: true, bubbles: true, cancelable: true })
      );

      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');
      expect(mockController.getState()).toBe('playing');

      // Press Alt+L again
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'l', altKey: true, bubbles: true, cancelable: true })
      );

      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(mockController.stopCallCount).toBe(1);
    });

    it('Space key on play button triggers playback', () => {
      initAudioControls(container, mockController, () => 'Salom');
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;

      playBtn.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      );

      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');
      expect(mockController.getState()).toBe('playing');
    });

    it('Escape key halts playback immediately', () => {
      initAudioControls(container, mockController, () => 'Salom');
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;

      playBtn.click();
      expect(playBtn.textContent?.trim()).toBe('To‘xtatish');

      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );

      expect(playBtn.textContent?.trim()).toBe('Tinglash');
      expect(mockController.stopCallCount).toBe(1);
    });

    it('setLanguage("en") updates buttons and live region labels to English', () => {
      const handle = initAudioControls(container, mockController, () => 'Salom') as any;
      const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
      const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;

      expect(playBtn.textContent?.trim()).toBe('Tinglash');

      handle.setLanguage('en');

      expect(playBtn.textContent?.trim()).toBe('Listen');
      expect(playBtn.getAttribute('aria-label')).toBe('Listen (Alt+L)');
      expect(stopBtn.textContent?.trim()).toBe('Stop');
      expect(stopBtn.getAttribute('aria-label')).toBe('Stop (Esc)');

      // Start playback in English
      playBtn.click();
      expect(playBtn.textContent?.trim()).toBe('Stop');
      expect(playBtn.getAttribute('aria-label')).toBe('Stop (Esc)');

      const liveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;
      expect(liveStatus.textContent).toBe('Auditory verification in progress...');

      // Stop playback in English
      playBtn.click();
      expect(playBtn.textContent?.trim()).toBe('Listen');
      expect(liveStatus.textContent).toBe('Auditory playback stopped.');
    });
  });
});
