/**
 * Filler word detector for AuraHire
 * Highlights words in HTML and count them
 */

export const FILLER_WORDS = [
  'um', 'uh', 'like', 'basically', 'you know', 'actually', 
  'literally', 'right', 'so yeah', 'kind of', 'sort of',
  'i mean', 'you see', 'obviously', 'clearly'
];

export function highlightFillers(text) {
  if (!text) return '';
  
  let highlighted = text;
  
  FILLER_WORDS.forEach((word) => {
    // Escape word for regex
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');
    
    highlighted = highlighted.replace(regex, (match) => {
      return `<mark class="filler-word" style="background: var(--pace-amber-lt); color: var(--pace-amber); border-radius: 3px; padding: 0 3px; font-weight: 500">${match}</mark>`;
    });
  });
  
  return highlighted;
}

export function countFillers(text) {
  if (!text) return { total: 0, breakdown: {} };
  
  const breakdown = {};
  let total = 0;
  
  FILLER_WORDS.forEach((word) => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      breakdown[word] = matches.length;
      total += matches.length;
    } else {
      breakdown[word] = 0;
    }
  });
  
  return { total, breakdown };
}

export function getHeatmapSegments(fullTranscript, sessionDurationSeconds) {
    if (!fullTranscript || sessionDurationSeconds <= 0) return [];

    const segmentDuration = 5; // seconds per segment
    const segmentCount = Math.ceil(sessionDurationSeconds / segmentDuration);
    
    // Simple heuristic: divide words equally (since we don't have accurate time stamps per word)
    const words = fullTranscript.split(/\s+/).filter(w => w.length > 0);
    const wordsPerSegment = Math.ceil(words.length / segmentCount);
    
    const segments = [];
    
    for (let i = 0; i < segmentCount; i++) {
        const start = i * wordsPerSegment;
        const end = Math.min((i + 1) * wordsPerSegment, words.length);
        const segmentText = words.slice(start, end).join(' ');
        const { total: fillerCount } = countFillers(segmentText);
        
        let intensity = 'none';
        if (fillerCount >= 3) intensity = 'high';
        else if (fillerCount > 0) intensity = 'low';
        
        segments.push({
            text: segmentText,
            fillerCount,
            intensity
        });
    }
    
    return segments;
}
