import React, { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading bundled Latin and Tamil fonts'));
  useEffect(() => {
    let disposed = false;
    Promise.all([
      new FontFace('Barlow Condensed', `url("${staticFile('fonts/BarlowCondensed-ExtraBold.ttf')}")`, { weight: '800' }).load(),
      new FontFace('Noto Sans Tamil', `url("${staticFile('fonts/NotoSansTamil.ttf')}")`, { weight: '100 900' }).load(),
    ]).then((fonts) => { if (!disposed) { fonts.forEach((font) => document.fonts.add(font)); continueRender(handle); } })
      .catch((error) => cancelRender(error));
    return () => { disposed = true; };
  }, [handle]);
  return null;
};
