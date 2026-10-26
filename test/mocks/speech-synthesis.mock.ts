/**
 * Deterministic Web Speech API Test Doubles for AlifBraille.
 * Provides MockSpeechSynthesis, MockSpeechSynthesisUtterance, and MockSpeechSynthesisVoice.
 */

export class MockSpeechSynthesisVoice implements SpeechSynthesisVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;

  constructor(init: Partial<SpeechSynthesisVoice> = {}) {
    this.default = init.default ?? false;
    this.lang = init.lang ?? 'uz-UZ';
    this.localService = init.localService ?? true;
    this.name = init.name ?? 'Uzbek Voice';
    this.voiceURI = init.voiceURI ?? `voice:${this.lang}:${this.name}`;
  }
}

export interface MockSpeechBoundaryEventInit {
  charIndex: number;
  charLength?: number;
  name?: string;
  elapsedTime?: number;
}

export class MockSpeechSynthesisUtterance extends EventTarget implements SpeechSynthesisUtterance {
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null = null;
  volume: number = 1.0;
  rate: number = 1.0;
  pitch: number = 1.0;

  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null = null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null = null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: any) => any) | null = null;

  constructor(text: string = '') {
    super();
    this.text = text;
    this.lang = 'uz-UZ';
  }

  dispatchEvent(event: Event): boolean {
    const type = event.type;
    const handler = (this as any)[`on${type}`];
    if (typeof handler === 'function') {
      try {
        handler.call(this, event);
      } catch (err) {
        console.error(`Error in utterance on${type} handler:`, err);
      }
    }
    return super.dispatchEvent(event);
  }
}

export class MockSpeechSynthesis extends EventTarget implements SpeechSynthesis {
  paused: boolean = false;
  pending: boolean = false;
  speaking: boolean = false;
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null = null;

  private _voices: SpeechSynthesisVoice[] = [];
  public currentUtterance: SpeechSynthesisUtterance | null = null;
  public speakCallHistory: SpeechSynthesisUtterance[] = [];
  public autoPlay: boolean = false;
  public emitBoundariesOnAutoPlay: boolean = true;

  constructor(voices?: SpeechSynthesisVoice[]) {
    super();
    this._voices = voices ?? [
      new MockSpeechSynthesisVoice({ name: 'O‘zbek Ayol', lang: 'uz-UZ', default: true }),
      new MockSpeechSynthesisVoice({ name: 'Russian Female', lang: 'ru-RU', default: false }),
      new MockSpeechSynthesisVoice({ name: 'Google US English', lang: 'en-US', default: false }),
    ];
  }

  getVoices(): SpeechSynthesisVoice[] {
    return [...this._voices];
  }

  setVoices(voices: SpeechSynthesisVoice[]): void {
    this._voices = [...voices];
    const event = new Event('voiceschanged');
    if (typeof this.onvoiceschanged === 'function') {
      this.onvoiceschanged.call(this, event);
    }
    this.dispatchEvent(event);
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    this.speakCallHistory.push(utterance);
    this.currentUtterance = utterance;
    this.speaking = true;
    this.paused = false;
    this.pending = false;

    // Dispatch start event
    const startEvent = new CustomEvent('start', { detail: { utterance } }) as any;
    utterance.dispatchEvent(startEvent);

    if (this.autoPlay) {
      if (this.emitBoundariesOnAutoPlay && utterance.text) {
        // Deterministically emit word boundary events for each word
        const words = utterance.text.split(/(\s+)/);
        let charIndex = 0;
        for (const token of words) {
          if (token.trim().length > 0) {
            this.triggerBoundary({
              charIndex,
              charLength: token.length,
              name: 'word',
            });
          }
          charIndex += token.length;
        }
      }
      this.triggerEnd();
    }
  }

  cancel(): void {
    if (this.speaking || this.paused || this.pending) {
      this.speaking = false;
      this.paused = false;
      this.pending = false;
      if (this.currentUtterance) {
        const errorEvent = new CustomEvent('error', {
          detail: { error: 'canceled', utterance: this.currentUtterance },
        }) as any;
        errorEvent.error = 'canceled';
        const utter = this.currentUtterance;
        this.currentUtterance = null;
        utter.dispatchEvent(errorEvent);
      }
    }
  }

  pause(): void {
    if (this.speaking && !this.paused) {
      this.paused = true;
      this.speaking = false;
      if (this.currentUtterance) {
        const pauseEvent = new CustomEvent('pause', {
          detail: { utterance: this.currentUtterance },
        }) as any;
        this.currentUtterance.dispatchEvent(pauseEvent);
      }
    }
  }

  resume(): void {
    if (this.paused) {
      this.paused = false;
      this.speaking = true;
      if (this.currentUtterance) {
        const resumeEvent = new CustomEvent('resume', {
          detail: { utterance: this.currentUtterance },
        }) as any;
        this.currentUtterance.dispatchEvent(resumeEvent);
      }
    }
  }

  triggerBoundary(eventInit: MockSpeechBoundaryEventInit): void {
    if (!this.currentUtterance) return;
    const boundaryEvent = new CustomEvent('boundary', {
      detail: eventInit,
    }) as any;
    boundaryEvent.charIndex = eventInit.charIndex;
    boundaryEvent.charLength = eventInit.charLength ?? 0;
    boundaryEvent.name = eventInit.name ?? 'word';
    boundaryEvent.elapsedTime = eventInit.elapsedTime ?? 0;
    this.currentUtterance.dispatchEvent(boundaryEvent);
  }

  triggerEnd(): void {
    if (this.currentUtterance) {
      const utter = this.currentUtterance;
      this.speaking = false;
      this.paused = false;
      this.pending = false;
      this.currentUtterance = null;
      const endEvent = new CustomEvent('end', {
        detail: { utterance: utter },
      }) as any;
      utter.dispatchEvent(endEvent);
    }
  }

  triggerError(errorCode: string = 'synthesis-failed'): void {
    if (this.currentUtterance) {
      const utter = this.currentUtterance;
      this.speaking = false;
      this.paused = false;
      this.pending = false;
      this.currentUtterance = null;
      const errorEvent = new CustomEvent('error', {
        detail: { error: errorCode, utterance: utter },
      }) as any;
      errorEvent.error = errorCode;
      utter.dispatchEvent(errorEvent);
    }
  }
}

let originalSpeechSynthesis: any = undefined;
let originalSpeechSynthesisUtterance: any = undefined;
let originalSpeechSynthesisVoice: any = undefined;

/**
 * Installs MockSpeechSynthesis and MockSpeechSynthesisUtterance onto the global/window scope.
 */
export function installSpeechSynthesisMock(
  options: {
    voices?: SpeechSynthesisVoice[];
    autoPlay?: boolean;
    emitBoundariesOnAutoPlay?: boolean;
  } = {}
): MockSpeechSynthesis {
  const g = globalThis as any;
  if (originalSpeechSynthesis === undefined) {
    originalSpeechSynthesis = g.speechSynthesis;
    originalSpeechSynthesisUtterance = g.SpeechSynthesisUtterance;
    originalSpeechSynthesisVoice = g.SpeechSynthesisVoice;
  }

  const mock = new MockSpeechSynthesis(options.voices);
  if (options.autoPlay !== undefined) mock.autoPlay = options.autoPlay;
  if (options.emitBoundariesOnAutoPlay !== undefined) {
    mock.emitBoundariesOnAutoPlay = options.emitBoundariesOnAutoPlay;
  }

  g.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  g.SpeechSynthesisVoice = MockSpeechSynthesisVoice;
  g.speechSynthesis = mock;

  if (typeof window !== 'undefined') {
    (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    (window as any).SpeechSynthesisVoice = MockSpeechSynthesisVoice;
    (window as any).speechSynthesis = mock;
  }

  return mock;
}

/**
 * Restores original SpeechSynthesis objects on global/window.
 */
export function uninstallSpeechSynthesisMock(): void {
  const g = globalThis as any;
  g.speechSynthesis = originalSpeechSynthesis;
  g.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
  g.SpeechSynthesisVoice = originalSpeechSynthesisVoice;

  if (typeof window !== 'undefined') {
    (window as any).speechSynthesis = originalSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    (window as any).SpeechSynthesisVoice = originalSpeechSynthesisVoice;
  }

  originalSpeechSynthesis = undefined;
  originalSpeechSynthesisUtterance = undefined;
  originalSpeechSynthesisVoice = undefined;
}
