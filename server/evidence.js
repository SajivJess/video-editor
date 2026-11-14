const dns=require('node:dns').promises;
const net=require('node:net');
const https=require('node:https'),http=require('node:http');
const {createHash}=require('node:crypto');
function publicAddress(value){
  const address=value.toLowerCase().split('%')[0];
  if(net.isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&[18,19].includes(b)));}
  if(net.isIP(address)===6)return address.startsWith('2')||address.startsWith('3'); // global unicast only; rejects mapped IPv4, loopback and local ranges
  return false;
}
function evidenceUrl(value){
  let url;try{url=new URL(value);}catch{throw Error('Invalid source URL');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))throw Error('Only public HTTP/HTTPS source pages are supported');
  const host=url.hostname.replace(/^\[|\]$/g,'');if(net.isIP(host)&&!publicAddress(host))throw Error('Private source address is not allowed');
  if(!host.includes('.')||host.endsWith('.localhost')||host.endsWith('.local'))throw Error('Local source host is not allowed');
  url.hash='';return url;
}
async function fetchPage(value,{lookup=dns.lookup,redirects=0}={}){
  const url=evidenceUrl(value),host=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=net.isIP(host)?[{address:host,family:net.isIP(host)}]:await lookup(host,{all:true});
  if(!addresses.length||addresses.some(item=>!publicAddress(item.address)))throw Error('Source resolves to a non-public address');
  const pinned=addresses.find(item=>item.family===4)??addresses[0];
  return new Promise((resolve,reject)=>{
    const request=(url.protocol==='https:'?https:http).get(url,{headers:{'User-Agent':'SajivReelStudio/1.0 (source verification)','Accept':'text/html,text/plain'},lookup:(hostname,options,callback)=>options?.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family)},response=>{
      if([301,302,303,307,308].includes(response.statusCode)){
        response.resume();if(redirects>=4||!response.headers.location)return reject(Error('Too many source redirects'));
        return fetchPage(new URL(response.headers.location,url).href,{lookup,redirects:redirects+1}).then(resolve,reject);
      }
      if(response.statusCode!==200){response.resume();return reject(Error('Source returned HTTP '+response.statusCode));}
      if(!/^text\/(html|plain)/i.test(response.headers['content-type']||'')){response.resume();return reject(Error('Source is not an HTML or text page'));}
      let size=0;const chunks=[];
      response.on('data',chunk=>{size+=chunk.length;if(size>600000){response.destroy(Error('Source page exceeds 600 KB limit'));return;}chunks.push(chunk);});
      response.on('error',reject);response.on('end',()=>resolve({url:url.href,body:Buffer.concat(chunks).toString('utf8'),contentType:response.headers['content-type']}));
    });
    request.setTimeout(12000,()=>request.destroy(Error('Source request timed out')));request.on('error',reject);
  });
}
function extractPage(page){
  const {parseHTML}=require('linkedom');const {document}=parseHTML(page.body);
  document.querySelectorAll('script,style,noscript,nav,footer,form,header,aside').forEach(node=>node.remove());
  const text=(document.querySelector('article')||document.querySelector('main')||document.body)?.textContent?.replace(/\s+/g,' ').trim()||'';
  if(text.length<200)throw Error('Source has too little readable text; it may require JavaScript or access permission');
  if(new URL(page.url).hostname==='news.google.com')throw Error('Aggregator page does not provide the original article text');
  return {url:page.url,title:document.title||new URL(page.url).hostname,text:text.slice(0,18000),sha256:createHash('sha256').update(page.body).digest('hex')};
}
async function collectEvidence(stories,{fetcher=fetchPage}={}){
  const urls=[...new Set(stories.flatMap(story=>story.sources.map(source=>source.url)))].slice(0,12);
  const results=[];
  // Bound concurrency for small free-tier machines.
  for(let i=0;i<urls.length;i+=3)results.push(...await Promise.all(urls.slice(i,i+3).map(async(url,index)=>{
    const id='S'+String(i+index+1).padStart(2,'0'),fetchedAt=new Date().toISOString();
    try{return {id,requestedUrl:url,fetchedAt,status:'ok',...extractPage(await fetcher(url))};}catch(error){return {id,requestedUrl:url,fetchedAt,status:'failed',error:error.message};}
  })));
  return results;
}
module.exports={publicAddress,evidenceUrl,fetchPage,extractPage,collectEvidence};
