const {bundle} = require('@remotion/bundler');
const {openBrowser, getCompositions, renderStill} = require('@remotion/renderer');
const fs = require('node:fs');
const path = require('node:path');
(async()=>{
  const propsFile=process.argv[2];
  const outputDir=process.argv[3]??'Output/modern-previews';
  const inputProps=propsFile?JSON.parse(fs.readFileSync(propsFile,'utf8')):{};
  console.log('Bundling preview...');
  const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public'),onProgress:(progress)=>{if(progress===100)console.log('Bundle ready');}});
  console.log('Opening preview browser...');
  const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser=await openBrowser('chrome',{browserExecutable:fs.existsSync(chrome)?chrome:undefined});
  try {
    const compositions=await getCompositions(serveUrl,{inputProps,puppeteerInstance:browser});
    const composition=compositions.find(c=>c.id==='ReelBase');
    const frames=process.argv[4]?process.argv[4].split(',').map(Number):[0,50,270,400,475,600,800,845,900,1000,1100,1250,1400,1600,1740,composition.durationInFrames-1];
    fs.mkdirSync(outputDir,{recursive:true});
    for(const frame of frames){
      await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,
        imageFormat:'jpeg',output:`${outputDir}/frame-${frame}.jpg`,logLevel:'error'});
      console.log(`Preview ${frame}`);
    }
  } finally {await browser.close({silent:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
