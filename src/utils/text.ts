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

const EDGE_PUNCTUATION_RE =
  /^[\s.,!?;:'"()[\]{}«»“”‘’—–-]+|[\s.,!?;:'"()[\]{}«»“”‘’—–-]+$/gu;

/**
 * Normalizes a word token for keyword matching while preserving
 * Unicode letters, combining marks (including Tamil U+0B80..U+0BFF),
 * numbers, currency symbols (₹, $), and internal punctuation like decimal points.
 */
function normalizeToken(token: string): string {
  return token
    .normalize('NFC')
    .replace(EDGE_PUNCTUATION_RE, '')
    .toLowerCase();
}

/**
 * Splits text into word tokens and marks each token as highlighted or not
 * based on single-word or multi-word keyword phrases (case-insensitive,
 * Unicode/Tamil-safe).
 */
export function highlightKeywords(
  text: string,
  keywords: string[]
): Array<{ word: string; highlight: boolean }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const words = trimmed.split(/\s+/);
  const normalizedWords = words.map(normalizeToken);
  const highlighted = new Array<boolean>(words.length).fill(false);

  for (const keyword of keywords) {
    const kwTokens = keyword
      .trim()
      .split(/\s+/)
      .map(normalizeToken)
      .filter((t) => t.length > 0);

    if (kwTokens.length === 0) {
      continue;
    }

    if (kwTokens.length === 1) {
      const target = kwTokens[0];
      for (let i = 0; i < normalizedWords.length; i++) {
        const w = normalizedWords[i];
        if (!w) continue;
        if (w === target || w.split(/[-/]/).includes(target)) {
          highlighted[i] = true;
        }
      }
      continue;
    }

    // Multi-word phrase match across contiguous tokens
    const limit = normalizedWords.length - kwTokens.length;
    for (let i = 0; i <= limit; i++) {
      let matched = true;
      for (let j = 0; j < kwTokens.length; j++) {
        if (normalizedWords[i + j] !== kwTokens[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        for (let j = 0; j < kwTokens.length; j++) {
          highlighted[i + j] = true;
        }
      }
    }
  }

  return words.map((word, idx) => ({
    word,
    highlight: highlighted[idx],
  }));
}

/**
 * Formats a numeric value using Indian grouping (en-IN) with ₹ prefix
 * when currency is 'INR', or standard US comma grouping (en-US) otherwise.
 */
export function formatNumber(value: number, currency?: 'INR'): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  if (currency === 'INR') {
    const formatted = new Intl.NumberFormat('en-IN').format(Math.abs(value));
    return value < 0 ? `-₹${formatted}` : `₹${formatted}`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}
