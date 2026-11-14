import type { CaptionSegment, WordTiming } from '../types/project';

export interface CaptionGroup {
  words: WordTiming[];
  startFrame: number;
  endFrame: number;
}

/** Break on punctuation, pauses, reading width, or the word limit. Never invent speech. */
export function groupCaptionWords(words: WordTiming[], endFrame: number, maxWords = 3): CaptionGroup[] {
  const groups: CaptionGroup[] = [];
  let current: WordTiming[] = [];
  const flush = () => {
    if (!current.length) return;
    groups.push({ words: current, startFrame: current[0].startFrame, endFrame: current[current.length - 1].endFrame });
    current = [];
  };
  for (const word of words) {
    const previous = current[current.length - 1];
    if (current.length && (current.length >= maxWords || current.reduce((n, w) => n + w.word.length, 0) + word.word.length > 24 || word.startFrame - previous.endFrame > 9 || /[.!?;,]$/.test(previous.word))) flush();
    current.push(word);
  }
  flush();
  return groups.map((group, index) => ({ ...group,
    endFrame: Math.min(endFrame, groups[index + 1]?.startFrame ?? endFrame, group.endFrame + 5),
  }));
}

export function wordsForCaption(segment: CaptionSegment): WordTiming[] {
  if (segment.words?.length) return segment.words;
  const tokens = segment.text.trim().split(/\s+/).filter(Boolean);
  const duration = segment.endFrame - segment.startFrame;
  return tokens.slice(0, duration).map((word, index, list) => ({ word,
    startFrame: segment.startFrame + Math.floor(index * duration / list.length),
    endFrame: segment.startFrame + Math.floor((index + 1) * duration / list.length),
  }));
}
