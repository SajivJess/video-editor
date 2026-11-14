import { staticFile } from 'remotion';
export const mediaSource = (src: string): string =>
  /^(https?:|data:|blob:)/i.test(src) ? src : staticFile(src);
