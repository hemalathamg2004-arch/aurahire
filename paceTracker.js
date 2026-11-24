/**
 * Pace tracking module for AuraHire
 * Calculates WPM and status based on a rolling transcript
 */

let totalWords = 0;
let startTime = null;

export function trackPace(newText, elapsedSeconds) {
  if (!newText) return { wpm: 0, status: 'ideal', color: '#1D9E75' };

  // Count words in current text
  const words = newText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const minutesElapsed = elapsedSeconds / 60;
  const wpm = minutesElapsed > 0 ? Math.round(wordCount / minutesElapsed) : 0;

  let status = 'ideal';
  let color = '#1D9E75'; // hire-green

  if (wpm < 100) {
    status = 'slow';
    color = '#BA7517'; // pace-amber
  } else if (wpm > 165) {
    status = 'fast';
    color = '#E24B4A'; // alert-red
  } else if (wpm > 150) {
    status = 'fast-ish';
    color = '#BA7517'; // pace-amber
  }

  return { wpm, status, color };
}

export function resetPace() {
  totalWords = 0;
  startTime = null;
}
