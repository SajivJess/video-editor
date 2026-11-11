/**
 * Wraps text into lines of at most maxChars characters, splitting on spaces.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

/**
 * Splits text into tokens and marks each word as highlighted or not
 * based on the keywords array (case-insensitive match).
 */
export function highlightKeywords(
  text: string,
  keywords: string[]
): Array<{ word: string; highlight: boolean }> {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return text.split(' ').map((word) => ({
    word,
    highlight: lowerKeywords.includes(word.replace(/[^a-z0-9₹]/gi, '').toLowerCase()) ||
      lowerKeywords.some((kw) => word.toLowerCase().includes(kw)),
  }));
}
