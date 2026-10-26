/**
 * Tactile Braille cell speech synchronizer & highlighter.
 * Applies .cell-speaking and data-active-speech="true" to tactile grid cells
 * synchronized with active speech token index during auditory playback.
 */

/**
 * Highlights a tactile Braille cell corresponding to the given tokenIndex.
 * Clears any previous speech highlights before applying the new highlight.
 *
 * @param tokenIndex - Zero-based index of the active token/cell, or null to clear highlights
 */
export function highlightBrailleCell(tokenIndex: number | null): void {
  // Clear any existing active speech highlight
  clearSpeechHighlights();

  if (tokenIndex === null || tokenIndex === undefined || tokenIndex < 0) {
    return;
  }

  // Look for cell by data-index attribute or position in grid
  let targetCell = document.querySelector<HTMLElement>(`.tactile-cell[data-index="${tokenIndex}"]`);
  if (!targetCell) {
    const cells = document.querySelectorAll<HTMLElement>('.tactile-cell');
    if (tokenIndex < cells.length) {
      targetCell = cells[tokenIndex];
    }
  }

  if (targetCell) {
    targetCell.classList.add('cell-speaking');
    targetCell.setAttribute('data-active-speech', 'true');
    if (typeof targetCell.scrollIntoView === 'function') {
      try {
        targetCell.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      } catch {
        targetCell.scrollIntoView();
      }
    }
  }
}

/**
 * Clears active speech highlights (.cell-speaking and data-active-speech="true")
 * across all tactile cells in the DOM.
 */
export function clearSpeechHighlights(): void {
  const speakingCells = document.querySelectorAll<HTMLElement>(
    '.tactile-cell.cell-speaking, [data-active-speech="true"]'
  );
  speakingCells.forEach((cell) => {
    cell.classList.remove('cell-speaking');
    cell.removeAttribute('data-active-speech');
  });
}
