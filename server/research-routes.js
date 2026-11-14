const express=require('express');
const {fail}=require('./files');
const {createResearch}=require('./research');
function researchRoutes(options={}){
  const research=options.research??createResearch(options);const router=express.Router();
  router.get('/config',(req,res)=>res.json({regions:research.regions,languages:['en','ta'],windows:[24,48,72]}));
  router.post('/scan',(req,res)=>res.status(202).json(research.scan(req.body)));
  router.get('/latest',(req,res)=>res.json({scan:research.latest(req.query),meta:research.latestImport()}));
  router.get('/scans/:id',(req,res)=>{const scan=research.getScan(req.params.id);if(!scan)fail('Scan not found',404);res.json(scan);});
  router.post('/meta',(req,res)=>res.status(201).json(research.importMeta(req.body.report)));
  router.post('/handoff',(req,res)=>res.json({text:research.handoff(req.body)}));
  router.get('/prompts/:target',(req,res)=>res.type('text/plain').attachment(req.params.target+'.txt').send(research.prompt(req.params.target)));
  return router;
}
module.exports={researchRoutes};
