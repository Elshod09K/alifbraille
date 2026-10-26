import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  downloadTactileSvgFile,
  triggerPrintDialog,
  setupExportControls,
} from '../src/ui/export.js';
import { initApp } from '../src/ui/app.js';
import type { AppInstance } from '../src/ui/types.js';
import type { BrailleCell } from '../src/types.js';

describe('Tactile Print & SVG Export Suite (ui-print-export)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('Single-Click SVG File Download (downloadTactileSvgFile)', () => {
    it('generates an SVG blob with MIME type "image/svg+xml;charset=utf-8" and triggers browser download', () => {
      let createdBlob: Blob | null = null;
      let createdUrl: string | null = null;
      let downloadedFilename: string | null = null;
      let clickTriggered = false;

      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        createdUrl = 'blob:http://localhost/mock-uuid-1234';
        return createdUrl;
      });
      URL.revokeObjectURL = vi.fn();

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
        clickTriggered = true;
      };

      try {
        const svgSample = '<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm"></svg>';
        downloadTactileSvgFile('alifbraille-sheet.svg', svgSample);

        expect(clickTriggered).toBe(true);
        expect(downloadedFilename).toBe('alifbraille-sheet.svg');
        expect(createdBlob).not.toBeNull();
        expect(createdBlob!.type).toBe('image/svg+xml;charset=utf-8');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('defaults to "alifbraille-sheet.svg" when filename is empty or not specified', () => {
      let downloadedFilename: string | null = null;
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-uuid');

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
      };

      try {
        downloadTactileSvgFile('', '<svg></svg>');
        expect(downloadedFilename).toBe('alifbraille-sheet.svg');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('respects custom filename when specified', () => {
      let downloadedFilename: string | null = null;
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-uuid');

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
      };

      try {
        downloadTactileSvgFile('uzbek-braille-anthem.svg', '<svg></svg>');
        expect(downloadedFilename).toBe('uzbek-braille-anthem.svg');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('falls back to data URI when URL.createObjectURL is undefined', () => {
      let clickedHref: string | null = null;
      let clickedFilename: string | null = null;

      const originalCreateObjectURL = URL.createObjectURL;
      // @ts-expect-error simulating legacy browser environment
      delete URL.createObjectURL;

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        clickedHref = this.href;
        clickedFilename = this.download;
      };

      try {
        const svgContent = '<svg id="test-fallback"></svg>';
        downloadTactileSvgFile('test-fallback.svg', svgContent);

        expect(clickedFilename).toBe('test-fallback.svg');
        expect(clickedHref).toContain('data:image/svg+xml;charset=utf-8,');
        expect(clickedHref).toContain(encodeURIComponent(svgContent));
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('cleans up temporary anchor element after download click', () => {
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:http://localhost/temp-uuid');
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = vi.fn();

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      try {
        downloadTactileSvgFile('alifbraille-sheet.svg', '<svg></svg>');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
      }
    });
  });

  describe('Swell-Paper Print Dialog Trigger (triggerPrintDialog)', () => {
    it('triggers window.print() when triggerPrintDialog is invoked', () => {
      const printSpy = vi.fn();
      window.print = printSpy;

      triggerPrintDialog();
      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('handles environments where window.print is undefined without crashing', () => {
      const originalPrint = window.print;
      // @ts-expect-error simulating environment without print
      delete window.print;

      expect(() => triggerPrintDialog()).not.toThrow();

      window.print = originalPrint;
    });
  });

  describe('Export Controls UI Binding (setupExportControls)', () => {
    it('creates "SVG Yuklab Olish" and "Chop Etish" buttons and attaches to container', () => {
      const mockCells: BrailleCell[] = [
        { char: 'a', brailleChar: '⠁', dots: [true, false, false, false, false, false] },
      ];
      const getBrailleData = vi.fn(() => mockCells);

      const { downloadBtn, printBtn } = setupExportControls(container, getBrailleData);

      expect(downloadBtn).toBeDefined();
      expect(printBtn).toBeDefined();
      expect(downloadBtn.textContent).toBe('SVG Yuklab Olish');
      expect(printBtn.textContent).toBe('Chop Etish');
      expect(downloadBtn.id).toBe('export-svg-btn');
      expect(printBtn.id).toBe('print-sheet-btn');
      expect(downloadBtn.type).toBe('button');
      expect(printBtn.type).toBe('button');
      expect(downloadBtn.getAttribute('aria-label')).toBe('Brayl taktil SVG faylini yuklab olish');
      expect(printBtn.getAttribute('aria-label')).toBe('Taktil qog‘ozga chop etish');
      expect(container.contains(downloadBtn)).toBe(true);
      expect(container.contains(printBtn)).toBe(true);
    });

    it('clicking "SVG Yuklab Olish" fetches braille data and triggers SVG download with filename "alifbraille-sheet.svg"', () => {
      let createdBlob: Blob | null = null;
      let downloadedFilename: string | null = null;

      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        return 'blob:http://localhost/uuid';
      });
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
      };

      try {
        const mockCells: BrailleCell[] = [
          { char: 'o‘', brailleChar: '⠧', dots: [true, true, true, false, false, true] },
        ];
        const getBrailleData = vi.fn(() => mockCells);

        const { downloadBtn } = setupExportControls(container, getBrailleData);
        downloadBtn.click();

        expect(getBrailleData).toHaveBeenCalled();
        expect(downloadedFilename).toBe('alifbraille-sheet.svg');
        expect(createdBlob).not.toBeNull();
        expect(createdBlob!.type).toBe('image/svg+xml;charset=utf-8');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('clicking "Chop Etish" triggers window.print()', () => {
      const printSpy = vi.fn();
      window.print = printSpy;

      const { printBtn } = setupExportControls(container, () => []);
      printBtn.click();

      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('handles empty braille data array gracefully on SVG download', () => {
      let createdBlob: Blob | null = null;
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        return 'blob:http://localhost/uuid-empty';
      });
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {};

      try {
        const { downloadBtn } = setupExportControls(container, () => []);
        expect(() => downloadBtn.click()).not.toThrow();
        expect(createdBlob).not.toBeNull();
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });
  });

  describe('Integrated Web UI Export Controls (src/ui/app.ts)', () => {
    let app: AppInstance;
    let appRoot: HTMLElement;

    beforeEach(() => {
      appRoot = document.createElement('div');
      document.body.appendChild(appRoot);
      app = initApp(appRoot);
    });

    afterEach(() => {
      app.destroy();
      if (appRoot.parentNode) {
        appRoot.parentNode.removeChild(appRoot);
      }
    });

    it('renders export controls container and buttons within the web interface', () => {
      const exportContainer = appRoot.querySelector('#export-controls-container');
      const downloadBtn = appRoot.querySelector<HTMLButtonElement>('#export-svg-btn');
      const printBtn = appRoot.querySelector<HTMLButtonElement>('#print-sheet-btn');

      expect(exportContainer).not.toBeNull();
      expect(downloadBtn).not.toBeNull();
      expect(printBtn).not.toBeNull();
      expect(downloadBtn!.textContent).toBe('SVG Yuklab Olish');
      expect(printBtn!.textContent).toBe('Chop Etish');
    });

    it('clicking "SVG Yuklab Olish" in the web UI downloads SVG generated from user input', () => {
      let downloadedFilename: string | null = null;
      let createdBlob: Blob | null = null;

      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn((blob: Blob) => {
        createdBlob = blob;
        return 'blob:http://localhost/app-uuid';
      });
      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        downloadedFilename = this.download;
      };

      try {
        app.updateText('O‘zbekiston');
        const downloadBtn = appRoot.querySelector<HTMLButtonElement>('#export-svg-btn')!;
        downloadBtn.click();

        expect(downloadedFilename).toBe('alifbraille-sheet.svg');
        expect(createdBlob).not.toBeNull();
        expect(createdBlob!.type).toBe('image/svg+xml;charset=utf-8');
      } finally {
        URL.createObjectURL = originalCreateObjectURL;
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });

    it('clicking "Chop Etish" in the web UI invokes browser window.print()', () => {
      const printSpy = vi.fn();
      window.print = printSpy;

      const printBtn = appRoot.querySelector<HTMLButtonElement>('#print-sheet-btn')!;
      printBtn.click();

      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    it('supports accessibility keyboard shortcuts Alt+S (SVG download) and Alt+C (Print)', () => {
      let downloadClicked = false;
      const downloadBtn = appRoot.querySelector<HTMLButtonElement>('#export-svg-btn')!;
      downloadBtn.addEventListener('click', () => {
        downloadClicked = true;
      });

      const originalClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = vi.fn();

      const printSpy = vi.fn();
      window.print = printSpy;

      try {
        // Alt+S triggers SVG download
        appRoot.dispatchEvent(
          new KeyboardEvent('keydown', { key: 's', altKey: true, bubbles: true, cancelable: true })
        );
        expect(downloadClicked).toBe(true);

        // Alt+C triggers print
        appRoot.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'c', altKey: true, bubbles: true, cancelable: true })
        );
        expect(printSpy).toHaveBeenCalledTimes(1);
      } finally {
        HTMLAnchorElement.prototype.click = originalClick;
      }
    });
  });

  describe('A4 Print Stylesheet Verification (src/ui/print.css)', () => {
    const printCssPath = path.resolve(__dirname, '../src/ui/print.css');
    let printCss: string;

    beforeEach(() => {
      expect(fs.existsSync(printCssPath)).toBe(true);
      printCss = fs.readFileSync(printCssPath, 'utf-8');
    });

    it('verifies @page size is A4 portrait and margin is 15mm', () => {
      // Verify @page rule
      expect(printCss).toMatch(/@page\s*\{[^}]*size:\s*A4\s+portrait/i);
      expect(printCss).toMatch(/@page\s*\{[^}]*margin:\s*15mm/i);
    });

    it('hides navigation headers, textareas, preset buttons in @media print', () => {
      expect(printCss).toContain('@media print');

      // Navigation headers hidden
      expect(printCss).toMatch(/\.app-header[\s\S]*?display:\s*none\s*!important/);

      // Textareas and editors hidden
      expect(printCss).toMatch(/#latin-input[\s\S]*?display:\s*none\s*!important/);
      expect(printCss).toMatch(/textarea[\s\S]*?display:\s*none\s*!important/);

      // Preset buttons and controls hidden
      expect(printCss).toMatch(/#preset-select[\s\S]*?display:\s*none\s*!important/);
      expect(printCss).toMatch(/#high-contrast-toggle[\s\S]*?display:\s*none\s*!important/);

      // Export controls and panel actions hidden
      expect(printCss).toMatch(/\.export-controls[\s\S]*?display:\s*none\s*!important/);
      expect(printCss).toMatch(/#export-svg-btn[\s\S]*?display:\s*none\s*!important/);
      expect(printCss).toMatch(/#print-sheet-btn[\s\S]*?display:\s*none\s*!important/);

      // Input panel hidden
      expect(printCss).toMatch(/section\[aria-labelledby="input-heading"\][\s\S]*?display:\s*none\s*!important/);
    });

    it('renders high-contrast black tactile Braille dots on pure white background for swell paper', () => {
      // Pure white background for canvas/body/container
      expect(printCss).toMatch(/background(-color)?:\s*#ffffff\s*!important/);

      // High-contrast pure solid black for active dots
      expect(printCss).toMatch(/\.tactile-dot--active[\s\S]*?background(-color)?:\s*#000000\s*!important/);

      // Strict color adjustment enforcement for browser print rendering
      expect(printCss).toMatch(/print-color-adjust:\s*exact/);
      expect(printCss).toMatch(/-webkit-print-color-adjust:\s*exact/);

      // Inactive dots completely hidden
      expect(printCss).toMatch(/\.tactile-dot--inactive[\s\S]*?visibility:\s*hidden\s*!important/);

      // Inactive dots have borders removed so swell paper microcapsules do not swell
      expect(printCss).toMatch(/\.tactile-dot--inactive[\s\S]*?border:\s*none\s*!important/);
    });

    it('hides character labels and braille text footer in print for clean tactile dot embossing', () => {
      expect(printCss).toMatch(/\.tactile-cell-char[\s\S]*?display:\s*none\s*!important/);
      expect(printCss).toMatch(/\.tactile-cell-braille[\s\S]*?display:\s*none\s*!important/);
    });
  });
});
