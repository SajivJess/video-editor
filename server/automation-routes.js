const express=require('express');
const {fail}=require('./files');
const {createAutomation}=require('./automation');
function automationRoutes(options={}){
  const automation=options.automation||createAutomation(options),router=express.Router();
  router.get('/status',(req,res)=>res.json(automation.status()));
  router.get('/jobs',(req,res)=>res.json({jobs:automation.list()}));
  router.post('/jobs',(req,res)=>res.status(202).json(automation.start(req.body)));
  router.get('/jobs/:id',(req,res)=>{const job=automation.get(req.params.id);if(!job)fail('Automation job not found',404);res.json(job);});
  router.post('/jobs/:id/retry',(req,res)=>res.status(202).json(automation.retry(req.params.id)));
  router.get('/jobs/:id/export',(req,res)=>{const job=automation.get(req.params.id);if(!job)fail('Automation job not found',404);res.attachment(job.id+'.json').json(job);});
  return router;
}
module.exports={automationRoutes};
