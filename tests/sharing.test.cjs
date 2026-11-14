const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {normalizeDomain,settings,expectedUrl,redact,windowsPowerShellEnv}=require('../scripts/share.cjs');
const {encryptToken,saveSettings}=require('../scripts/setup-ngrok.cjs');

test('Sharing requires a saved HTTPS domain and refuses random or malformed URLs',()=>{
  assert.equal(normalizeDomain('fixed-example.ngrok-free.dev'),'fixed-example.ngrok-free.dev');
  assert.equal(normalizeDomain('https://FIXED-EXAMPLE.ngrok-free.app/'),'fixed-example.ngrok-free.app');
  for(const value of ['', 'http://example.com','https://user:secret@example.com','example.com/path','example.com?token=secret','localhost','127.0.0.1','example.com:3000'])assert.throws(()=>normalizeDomain(value));
  assert.equal(expectedUrl({url:()=> 'https://fixed-example.ngrok-free.dev'},'fixed-example.ngrok-free.dev'),'https://fixed-example.ngrok-free.dev');
  assert.throws(()=>expectedUrl({url:()=> 'https://random-other.ngrok-free.dev'},'fixed-example.ngrok-free.dev'),/different URL/);
});

test('Sharing loads encrypted local settings without exposing the token in errors',t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'reel-sharing-test-'));
  t.after(()=>{assert.equal(path.dirname(folder),os.tmpdir());assert.ok(path.basename(folder).startsWith('reel-sharing-test-'));fs.rmSync(folder,{recursive:true,force:true});});
  const file=path.join(folder,'ngrok.json');fs.writeFileSync(file,'\uFEFF'+JSON.stringify({domain:'fixed-example.ngrok-free.dev',port:4317,tokenEncrypted:'windows-encrypted-value'}));
  let decrypted=0;const config=settings({REEL_NGROK_CONFIG:file},actual=>{assert.equal(actual,file);decrypted++;return 'local-test-token';});
  assert.equal(config.port,4317);assert.equal(config.token,'local-test-token');assert.equal(decrypted,1);
  assert.equal(redact(Error('Authentication failed for local-test-token'),config.token),'Authentication failed for [REDACTED]');
  assert.throws(()=>settings({REEL_NGROK_CONFIG:file,REEL_SHARE_PORT:'1'},()=>''),/port/);
  assert.throws(()=>settings({REEL_NGROK_CONFIG:file},()=>''),/not connected/);
  assert.equal(settings({REEL_NGROK_CONFIG:file,NGROK_AUTHTOKEN:'environment-token'},()=>{throw Error('Should not decrypt');}).token,'environment-token');
});

test('Windows setup and sharing round-trip a DPAPI fixture in the current user account',{skip:process.platform!=='win32'},t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'reel-sharing-test-'));
  t.after(()=>{assert.equal(path.dirname(folder),os.tmpdir());assert.ok(path.basename(folder).startsWith('reel-sharing-test-'));fs.rmSync(folder,{recursive:true,force:true});});
  const file=path.join(folder,'ngrok.json');
  saveSettings('fixed-example.ngrok-free.dev','fake-ngrok-token-for-encryption-test',{file});
  assert.ok(!fs.readFileSync(file,'utf8').includes('fake-ngrok-token-for-encryption-test'));
  assert.equal(settings({REEL_NGROK_CONFIG:file}).token,'fake-ngrok-token-for-encryption-test');
  assert.throws(()=>saveSettings('other-example.ngrok-free.dev','fake-ngrok-token-for-encryption-test',{file,encrypt:()=>{throw Error('Encryption unavailable');}}),/Encryption unavailable/);
  assert.equal(settings({REEL_NGROK_CONFIG:file}).domain,'fixed-example.ngrok-free.dev');
});
