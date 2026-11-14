import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPublicDir('public');
const localChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
else if (existsSync(localChrome)) Config.setBrowserExecutable(localChrome);
