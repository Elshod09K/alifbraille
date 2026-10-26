import type { BrailleCell } from '../types.js';
import { generateTactileSvg } from '../svg/index.js';

/**
 * Triggers a client-side file download of an SVG document using a Blob URL.
 * Generates an SVG blob with MIME type 'image/svg+xml;charset=utf-8'.
 *
 * @param filename - Name for downloaded file (default: 'alifbraille-sheet.svg')
 * @param svgContent - SVG XML string content
 */
export function downloadTactileSvgFile(filename: string, svgContent: string): void {
  const effectiveFilename = filename || 'alifbraille-sheet.svg';
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });

  let url: string;
  const hasCreateObjectURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

  if (hasCreateObjectURL) {
    try {
      url = URL.createObjectURL(blob);
    } catch {
      url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    }
  } else {
    url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = effectiveFilename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (hasCreateObjectURL && url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation error
      }
    }, 100);
  }
}

/**
 * Triggers native browser print dialog for printing the current document or swell-sheet.
 */
export function triggerPrintDialog(): void {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
}

/**
 * Attaches accessible SVG download and print buttons to the provided container element.
 *
 * @param container - DOM element to mount the export controls into
 * @param getBrailleData - Supplier function returning current tactile Braille cells
 * @returns Object containing references to the created buttons
 */
export function setupExportControls(
  container: HTMLElement,
  getBrailleData: () => BrailleCell[],
  options?: {
    onTogglePreview?: (active: boolean) => void;
  }
): {
  downloadBtn: HTMLButtonElement;
  printBtn: HTMLButtonElement;
  previewBtn: HTMLButtonElement;
} {
  const controlsWrapper = document.createElement('div');
  controlsWrapper.className = 'export-controls';

  const previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.id = 'swell-preview-btn';
  previewBtn.className = 'export-btn export-btn-preview';
  previewBtn.setAttribute('aria-pressed', 'false');
  previewBtn.setAttribute('aria-label', 'Taktil qog‘oz va qavariq simulyatsiyasini ko‘rish (Alt+V)');
  previewBtn.textContent = '👁️ Simulyatsiya';

  previewBtn.addEventListener('click', () => {
    const isPressed = previewBtn.getAttribute('aria-pressed') === 'true';
    const nextState = !isPressed;
    previewBtn.setAttribute('aria-pressed', nextState ? 'true' : 'false');
    previewBtn.classList.toggle('active', nextState);
    if (options?.onTogglePreview) {
      options.onTogglePreview(nextState);
    }
  });

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.id = 'export-svg-btn';
  downloadBtn.className = 'export-btn export-btn-download';
  downloadBtn.setAttribute('aria-label', 'Brayl taktil SVG faylini yuklab olish');
  downloadBtn.textContent = 'SVG Yuklab Olish';

  downloadBtn.addEventListener('click', () => {
    const cells = getBrailleData ? getBrailleData() : [];
    const svgContent = generateTactileSvg(cells, {
      title: 'AlifBraille Tactile Sheet',
      includeTactileMetadata: true,
      includeCalibrationRuler: true,
      pageNumber: 1,
    });
    downloadTactileSvgFile('alifbraille-sheet.svg', svgContent);
  });

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.id = 'print-sheet-btn';
  printBtn.className = 'export-btn export-btn-print';
  printBtn.setAttribute('aria-label', 'Taktil qog‘ozga chop etish');
  printBtn.textContent = 'Chop Etish';

  printBtn.addEventListener('click', () => {
    triggerPrintDialog();
  });

  controlsWrapper.appendChild(previewBtn);
  controlsWrapper.appendChild(downloadBtn);
  controlsWrapper.appendChild(printBtn);
  container.appendChild(controlsWrapper);

  return { downloadBtn, printBtn, previewBtn };
}
