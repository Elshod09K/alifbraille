/**
 * Accessible Audio Controls UI component for AlifBraille.
 * Provides accessible 'Tinglash' (Listen) and 'To‘xtatish' (Stop) playback controls
 * with aria-live announcements and keyboard shortcut integration (Alt+L / Space / Esc).
 */

import type { ISpeechController, SpeechBoundaryEvent } from '../audio/types.js';
import { highlightBrailleCell, clearSpeechHighlights } from './speech-highlighter.js';

const APOSTROPHE_REGEX = /^[ʻ‘'’`´ʼ]/;

/**
 * Maps raw string character indices to tactile Braille grid cell indices,
 * accounting for Uzbek digraphs (sh, ch), modified letters (o‘, g‘), and number signs (#).
 */
export function buildCharToCellIndexMap(text: string): number[] {
  if (!text) return [];
  const map = new Array<number>(text.length);
  let cellIdx = 0;
  let inNumberMode = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    if (char >= '0' && char <= '9') {
      if (!inNumberMode) {
        // Number sign prefix takes a cell
        cellIdx++;
        inNumberMode = true;
      }
      map[i] = cellIdx;
      cellIdx++;
      i++;
      continue;
    }

    inNumberMode = false;

    const charLower = char.toLowerCase();
    if ((charLower === 'o' || charLower === 'g') && APOSTROPHE_REGEX.test(nextChar)) {
      map[i] = cellIdx;
      map[i + 1] = cellIdx;
      cellIdx++;
      i += 2;
      continue;
    }

    if (
      (charLower === 's' && nextChar.toLowerCase() === 'h') ||
      (charLower === 'c' && nextChar.toLowerCase() === 'h')
    ) {
      map[i] = cellIdx;
      map[i + 1] = cellIdx;
      cellIdx++;
      i += 2;
      continue;
    }

    map[i] = cellIdx;
    cellIdx++;
    i++;
  }

  return map;
}

export interface AudioControlsHandle {
  setLanguage(lang: 'uz' | 'en'): void;
  stop(announceMessage?: string): void;
  isPlaying(): boolean;
  getWaveformEl?(): HTMLElement | null;
}

let sharedAudioContext: any = null;
let isGlobalGestureListenerAttached = false;

/**
 * Resets audio context and gesture listener state (primarily for test isolation).
 */
export function resetAudioContextForTesting(): void {
  sharedAudioContext = null;
  isGlobalGestureListenerAttached = false;
}

/**
 * Returns or initializes a shared AudioContext instance.
 * Explicitly initialises and unlocks the audio context for Safari / iOS hardware.
 */
export function getOrCreateAudioContext(forceNew?: boolean): any {
  if (typeof window === 'undefined') return null;
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || forceNew) {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }
  return sharedAudioContext;
}

/**
 * Safari / iOS User-Gesture guard.
 * Resumes speech synthesis and explicitly initializes an empty audio context on the first user click or tap,
 * preventing silent audio failures on restrictive browsers (Safari / iOS).
 */
export function ensureAudioUserGesture(): void {
  if (typeof window === 'undefined') return;

  // 1. Resume Web Speech synthesis if paused
  try {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  // 2. Explicitly initialize and resume empty AudioContext on user gesture
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        ctx.resume().catch(() => {});
      }
      // Play a short 1-sample silent buffer to unlock the hardware audio output on iOS / WebKit
      if (typeof ctx.createBuffer === 'function' && typeof ctx.createBufferSource === 'function') {
        try {
          const silentBuffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = silentBuffer;
          if (ctx.destination) {
            source.connect(ctx.destination);
          }
          if (typeof source.start === 'function') {
            source.start(0);
          }
        } catch {}
      }
    }
  } catch {}
}

/**
 * Attaches a one-time global user gesture unlock listener on the document
 * to initialize the empty audio context on the first user click or tap.
 */
export function setupGlobalGestureUnlock(): void {
  if (typeof window === 'undefined' || isGlobalGestureListenerAttached) return;
  isGlobalGestureListenerAttached = true;

  const unlockEvents = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
  const onFirstInteraction = () => {
    ensureAudioUserGesture();
    unlockEvents.forEach((evt) => {
      try {
        window.removeEventListener(evt, onFirstInteraction, true);
      } catch {}
    });
  };

  unlockEvents.forEach((evt) => {
    try {
      window.addEventListener(evt, onFirstInteraction, { capture: true, once: true });
    } catch {}
  });
}

/**
 * Initializes accessible auditory playback controls within the specified container.
 * Sighted teachers and blind students can audibly verify Braille transcriptions.
 * Features a single primary toggle button (Tinglash / To‘xtatish) to prevent duplicate button confusion.
 *
 * @param container - Mounting DOM element for the audio buttons
 * @param controller - Speech synthesis controller instance
 * @param getText - Callback supplying current text to be read and verified
 */
export function initAudioControls(
  container: HTMLElement,
  controller: ISpeechController,
  getText: () => string
): AudioControlsHandle | void {
  if (!container) return;

  // Arm one-time global gesture listener on first user click or tap for iOS / Safari
  setupGlobalGestureUnlock();

  let currentLang: 'uz' | 'en' = 'uz';

  const getLabels = () => ({
    idleText: currentLang === 'en' ? 'Listen' : 'Tinglash',
    activeText: currentLang === 'en' ? 'Stop' : 'To‘xtatish',
    stopBtnText: currentLang === 'en' ? 'Stop' : 'To‘xtatish',
    idleAria: currentLang === 'en' ? 'Listen (Alt+L)' : 'Tinglash (Alt+L)',
    activeAria: currentLang === 'en' ? 'Stop (Esc)' : 'To‘xtatish (Esc)',
    idleTitle: currentLang === 'en' ? 'Auditory verification (Alt+L)' : 'Ovozli o‘qish va tekshirish (Alt+L)',
    groupLabel: currentLang === 'en' ? 'Auditory verification controls' : 'Ovozli tekshirish boshqaruvi',
    msgPlaying: currentLang === 'en' ? 'Auditory verification in progress...' : 'Matn ovozli o‘qilmoqda...',
    msgStopped: currentLang === 'en' ? 'Auditory playback stopped.' : 'Ovozli o‘qish to‘xtatildi.',
    msgCompleted: currentLang === 'en' ? 'Auditory playback complete.' : 'Ovozli o‘qish yakunlandi.',
    msgEmpty: currentLang === 'en' ? 'No text available for auditory verification.' : 'O‘qish uchun matn mavjud emas.',
    waveformText: currentLang === 'en' ? 'Audio playing' : 'Ovozli ijro faol',
    fallbackAlert: currentLang === 'en'
      ? 'Web Speech unavailable. Visual Braille verification is active.'
      : 'Ovozli sintez brauzerda mavjud emas. Taktil vizual tekshiruv faol.',
  });

  const labels = getLabels();

  // Render accessible audio control buttons & live announcer region
  container.innerHTML = `
    <div class="audio-controls" role="group" aria-label="${labels.groupLabel}">
      <button
        id="audio-play-btn"
        class="audio-btn audio-btn-play"
        type="button"
        aria-pressed="false"
        aria-label="${labels.idleAria}"
        title="${labels.idleTitle}"
      >${labels.idleText}</button>
      <button
        id="audio-stop-btn"
        class="audio-btn audio-btn-stop"
        type="button"
        aria-label="${labels.activeAria}"
        title="${labels.activeAria}"
        disabled
      >${labels.stopBtnText}</button>
      <div id="audio-waveform-indicator" class="audio-waveform-indicator" aria-hidden="true">
        <span class="waveform-bar bar-1"></span>
        <span class="waveform-bar bar-2"></span>
        <span class="waveform-bar bar-3"></span>
        <span class="waveform-bar bar-4"></span>
        <span class="waveform-bar bar-5"></span>
        <span class="waveform-label">${labels.waveformText}</span>
      </div>
      <div id="audio-live-status" class="sr-only" aria-live="polite" role="status"></div>
      <div id="audio-status-badge" class="audio-status-badge" role="status" aria-live="polite"></div>
    </div>
  `;

  const playBtn = container.querySelector<HTMLButtonElement>('#audio-play-btn')!;
  const stopBtn = container.querySelector<HTMLButtonElement>('#audio-stop-btn')!;
  const localLiveStatus = container.querySelector<HTMLElement>('#audio-live-status')!;
  const waveformIndicator = container.querySelector<HTMLElement>('#audio-waveform-indicator');
  const audioStatusBadge = container.querySelector<HTMLElement>('#audio-status-badge');

  let isPlaying = false;

  /**
   * Dispatches polite announcements to all relevant accessibility live regions.
   */
  function announce(message: string): void {
    if (localLiveStatus) {
      localLiveStatus.textContent = message;
    }
    const audioAriaStatus = document.getElementById('audio-aria-status');
    if (audioAriaStatus && audioAriaStatus !== localLiveStatus) {
      audioAriaStatus.textContent = message;
    }
    const appA11yStatus = document.getElementById('a11y-live-status');
    if (appA11yStatus && appA11yStatus !== localLiveStatus) {
      appA11yStatus.textContent = message;
    }
  }

  function showStatusAlert(msg: string) {
    if (audioStatusBadge) {
      audioStatusBadge.textContent = msg;
      audioStatusBadge.classList.add('visible');
      setTimeout(() => {
        audioStatusBadge.classList.remove('visible');
      }, 5000);
    }
  }

  /**
   * Resets button states back to idle.
   */
  function resetControlsToIdle(): void {
    isPlaying = false;
    clearSpeechHighlights();
    const l = getLabels();
    playBtn.textContent = l.idleText;
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.setAttribute('aria-label', l.idleAria);
    stopBtn.disabled = true;
    if (waveformIndicator) {
      waveformIndicator.classList.remove('active');
    }
  }

  /**
   * Halts active speech playback immediately.
   */
  function stopPlayback(announceMessage?: string): void {
    controller.stop();
    resetControlsToIdle();
    announce(announceMessage || getLabels().msgStopped);
  }

  /**
   * Begins speech playback and synchronizes cell highlighting with boundary events.
   */
  async function startPlayback(): Promise<void> {
    // Safari / iOS gesture guard: resume synthesizer within synchronous user gesture
    ensureAudioUserGesture();

    const rawText = getText ? getText() : '';
    const text = rawText ? rawText.trim() : '';

    if (!text) {
      announce(getLabels().msgEmpty);
      return;
    }

    isPlaying = true;
    const l = getLabels();
    playBtn.textContent = l.activeText;
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.setAttribute('aria-label', l.activeAria);
    stopBtn.disabled = false;
    if (waveformIndicator) {
      waveformIndicator.classList.add('active');
    }
    announce(l.msgPlaying);

    const charMap = buildCharToCellIndexMap(rawText);

    try {
      await controller.speak(rawText, (e: SpeechBoundaryEvent) => {
        if (!isPlaying) return;

        let targetIndex: number | null = null;
        if (typeof e.tokenIndex === 'number') {
          targetIndex = e.tokenIndex;
        } else if (typeof e.charIndex === 'number') {
          if (e.charIndex >= 0 && e.charIndex < charMap.length) {
            targetIndex = charMap[e.charIndex];
          } else if (charMap.length > 0) {
            targetIndex = charMap[Math.min(e.charIndex, charMap.length - 1)];
          }
        }

        if (targetIndex !== null) {
          highlightBrailleCell(targetIndex);
        }
      });

      // Playback resolved naturally without cancellation
      if (isPlaying) {
        resetControlsToIdle();
        announce(getLabels().msgCompleted);
      }
    } catch (err) {
      // Graceful fallback when host lacks synthesizer or fails to initialize audio
      if (isPlaying) {
        resetControlsToIdle();
        const alertMsg = getLabels().fallbackAlert;
        announce(alertMsg);
        showStatusAlert(alertMsg);
      }
    }
  }

  /**
   * Toggles between starting and stopping auditory speech playback.
   */
  function togglePlayback(): void {
    if (isPlaying || controller.getState() === 'playing') {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function setLanguage(lang: 'uz' | 'en'): void {
    currentLang = lang;
    const l = getLabels();
    const groupEl = container.querySelector('.audio-controls');
    if (groupEl) {
      groupEl.setAttribute('aria-label', l.groupLabel);
    }
    stopBtn.textContent = l.stopBtnText;
    stopBtn.setAttribute('aria-label', l.activeAria);
    stopBtn.setAttribute('title', l.activeAria);

    if (waveformIndicator) {
      const label = waveformIndicator.querySelector('.waveform-label');
      if (label) label.textContent = l.waveformText;
    }

    if (isPlaying) {
      playBtn.textContent = l.activeText;
      playBtn.setAttribute('aria-label', l.activeAria);
    } else {
      playBtn.textContent = l.idleText;
      playBtn.setAttribute('aria-label', l.idleAria);
      playBtn.setAttribute('title', l.idleTitle);
    }
  }

  // Click event handlers
  playBtn.addEventListener('click', () => {
    togglePlayback();
  });

  stopBtn.addEventListener('click', () => {
    stopPlayback();
  });

  // Keyboard navigation on button controls
  playBtn.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      togglePlayback();
    }
  });

  // Global keyboard shortcuts (Alt+L, Esc)
  const handleGlobalKey = (e: KeyboardEvent) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      togglePlayback();
      return;
    }

    if (e.key === 'Escape') {
      if (isPlaying || controller.getState() === 'playing') {
        e.preventDefault();
        stopPlayback();
        return;
      }
    }
  };

  // Clean up any previously attached global keydown listener on window
  if ((container as any).__audioGlobalKeyHandler) {
    window.removeEventListener('keydown', (container as any).__audioGlobalKeyHandler);
  }
  (container as any).__audioGlobalKeyHandler = handleGlobalKey;
  window.addEventListener('keydown', handleGlobalKey);

  return {
    setLanguage,
    stop: stopPlayback,
    isPlaying: () => isPlaying,
    getWaveformEl: () => waveformIndicator,
  };
}
