import React from 'react';
import { useCurrentFrame } from 'remotion';
import { THEME, ThemeSettings } from '../../config/theme';
import { WordTiming } from '../../types/project';
import { highlightKeywords } from '../../utils/text';
import {
  useFadeInOut,
  useSlide,
  useWordHighlightProgress as getWordHighlightProgress,
} from '../animations';

export interface KineticCaptionProps {
  text: string;
  keywords?: string[];
  words?: WordTiming[];
  startFrame: number;
  endFrame: number;
  theme?: Partial<ThemeSettings>;
}

const getKeywordMatchesForWords = (
  words: WordTiming[],
  keywords: string[]
): boolean[] => {
  if (keywords.length === 0 || words.length === 0) {
    return words.map(() => false);
  }

  const trimmedWords = words.map((w) => w.word.trim());
  const allSingleTokens = trimmedWords.every(
    (w) => w.length > 0 && !/\s/.test(w)
  );

  if (allSingleTokens) {
    const matched = highlightKeywords(trimmedWords.join(' '), keywords);
    return trimmedWords.map((_, index) => matched[index]?.highlight ?? false);
  }

  return trimmedWords.map((w) =>
    highlightKeywords(w, keywords).some((token) => token.highlight)
  );
};

export const KineticCaption: React.FC<KineticCaptionProps> = ({
  text,
  keywords = [],
  words,
  startFrame,
  endFrame,
  theme,
}) => {
  const frame = useCurrentFrame();
  const opacity = useFadeInOut(startFrame, endFrame, 8, 6);
  const slideTransform = useSlide(startFrame, 20, 'y');

  if (frame < startFrame || frame >= endFrame) {
    return null;
  }

  const resolvedTheme: ThemeSettings = {
    ...THEME,
    ...theme,
  };

  const hasWordTimings = Boolean(words && words.length > 0);
  const wordKeywordMatches = hasWordTimings
    ? getKeywordMatchesForWords(words!, keywords)
    : [];
  const phraseTokens = hasWordTimings ? [] : highlightKeywords(text, keywords);

  return (
    <div
      style={{
        opacity,
        transform: slideTransform,
        background: resolvedTheme.bgPanel,
        borderRadius: theme?.borderRadius ?? 20,
        padding: '16px 28px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: resolvedTheme.shadowStyle,
        textAlign: 'center',
        maxWidth: '92%',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: resolvedTheme.captionFontSize ?? 38,
          fontWeight: resolvedTheme.fontWeight,
          color: resolvedTheme.primaryText,
          lineHeight: 1.32,
          fontFamily: resolvedTheme.fontFamily,
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {hasWordTimings
          ? words!.map((wordItem, index) => {
              const isActiveWord =
                frame >= wordItem.startFrame && frame < wordItem.endFrame;
              const isKeywordMatch = wordKeywordMatches[index] ?? false;
              const isHighlighted = isActiveWord || isKeywordMatch;
              const activeProgress = isActiveWord
                ? getWordHighlightProgress(
                    frame,
                    wordItem.startFrame,
                    wordItem.endFrame
                  )
                : 0;
              const wordScale = isActiveWord ? 1 + 0.04 * activeProgress : 1;

              return (
                <React.Fragment key={`${wordItem.word}-${index}`}>
                  {index > 0 && ' '}
                  <span
                    style={{
                      display: 'inline-block',
                      color: isHighlighted
                        ? resolvedTheme.highlightColor
                        : resolvedTheme.primaryText,
                      fontWeight: isHighlighted ? 900 : resolvedTheme.fontWeight,
                      transform:
                        wordScale !== 1 ? `scale(${wordScale})` : undefined,
                      transformOrigin: 'center center',
                      textShadow: isHighlighted
                        ? '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 14px rgba(255, 215, 0, 0.28)'
                        : '0 2px 6px rgba(0, 0, 0, 0.85)',
                    }}
                  >
                    {wordItem.word}
                  </span>
                </React.Fragment>
              );
            })
          : phraseTokens.map((token, index) => (
              <React.Fragment key={`${token.word}-${index}`}>
                {index > 0 && ' '}
                {token.highlight ? (
                  <span
                    style={{
                      color: resolvedTheme.highlightColor,
                      fontWeight: 900,
                      textShadow:
                        '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 14px rgba(255, 215, 0, 0.28)',
                    }}
                  >
                    {token.word}
                  </span>
                ) : (
                  <span
                    style={{
                      color: resolvedTheme.primaryText,
                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.85)',
                    }}
                  >
                    {token.word}
                  </span>
                )}
              </React.Fragment>
            ))}
      </span>
    </div>
  );
};
