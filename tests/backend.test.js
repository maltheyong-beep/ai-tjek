import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, consumeLimit, ALLOWED_ORIGIN } from '../backend/worker.js';
import { modelRequest } from '../backend/prompt.js';

const input = {text:'jeg skriver på nuværende tidspunkt min tekst.',language:'da',intensity:'medium',tone:'neutral',protectedTerms:''};
const output = {text:'jeg skriver nu min tekst.',changes:[{'før':'på nuværende tidspunkt','efter':'nu',type:'filler',forklaring:'Fyldvending gjort kortere.'}]};
function request(body = input, origin = ALLOWED_ORIGIN, method = 'POST') { return new Request('https://test.workers.dev/humanize',{method,headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}); }
function memoryStorage() {
  const map = new Map(); let queue=Promise.resolve();
  const store = {get:async key=>map.get(key),put:async(k,v)=>map.set(k,v),delete:async k=>map.delete(k),setAlarm:async()=>{},transaction:fn=>{const result=queue.then(()=>fn(store));queue=result.catch(()=>{});return result;}};
  return {store,map};
}
function environment(allowed=true) { return {ANTHROPIC_API_KEY:'test-secret-value',RATE_LIMIT_SALT:'test-salt',RATE_LIMITER:{idFromName:name=>name,get:()=>({fetch:async()=>Response.json({allowed,retryAfter:3600})})}}; }
const upstream = value => async()=>Response.json({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(value)}]});
test('Kun whitelist-origin accepteres; preflight giver korrekt CORS',async()=>{
  const handle=createHandler({fetchImpl:()=>assert.fail()});
  for(const origin of ['https://evil.example','null','https://maltheyong-beep.github.io.evil.example']) {const r=await handle(request(input,origin),{});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);}
  const r=await handle(request(undefined,ALLOWED_ORIGIN,'OPTIONS'),{});assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),ALLOWED_ORIGIN);
});
test('Input, metode, 5000 ord og størrelse valideres før modelkald',async()=>{
  const handle=createHandler({fetchImpl:()=>assert.fail()});
  for(const [body,status] of [['{bad',400],[{...input,text:''},400],[{...input,language:'fr'},400],[{...input,tone:'bad'},400],[{...input,text:'ord '.repeat(5001)},413],[{...input,secret:'x'},400],[{...input,text:'x'.repeat(200000)},413]]) assert.equal((await handle(request(body),environment())).status,status);
  assert.equal((await handle(request(undefined,ALLOWED_ORIGIN,'GET'),{})).status,405);
  assert.equal((await handle(request({...input,text:'ord '.repeat(5000)}),{})).status,503);
});
test('Ti samtidige IP-kald tillades; det ellevte blokeres og udløber',async()=>{
  const {store,map}=memoryStorage(),now=10000000;
  const results=await Promise.all(Array.from({length:11},()=>consumeLimit(store,now)));
  assert.equal(results.filter(r=>r.allowed).length,10);assert.equal(results[10].retryAfter,3600);
  assert.deepEqual([...map.keys()],['calls']);assert.ok(map.get('calls').every(t=>typeof t==='number'));
  assert.equal((await consumeLimit(store,now+3600001)).allowed,true);
});
test('429 indeholder Retry-After og ingen tekst eller nøgler',async()=>{
  const r=await createHandler({fetchImpl:()=>assert.fail()})(request(),environment(false));
  assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'3600');const body=await r.text();assert.ok(!body.includes(input.text));assert.ok(!body.includes('test-secret'));
});
test('Gyldig Claude-JSON returneres uden nøgle; tekst logges ikke',async()=>{
  let calls=0;const handle=createHandler({fetchImpl:async(url,options)=>{calls++;assert.equal(url,'https://api.anthropic.com/v1/messages');assert.equal(options.headers['x-api-key'],'test-secret-value');return upstream(output)();}});
  const r=await handle(request(),environment());assert.equal(r.status,200);const raw=await r.text();assert.equal(JSON.parse(raw).text,output.text);assert.ok(!raw.includes('test-secret'));assert.equal(calls,1);
});
test('Fejlformet modeloutput forsøges én gang igen',async()=>{
  let calls=0;const handle=createHandler({fetchImpl:async()=>++calls===1?upstream({text:'forkert'})():upstream(output)()});
  assert.equal((await handle(request(),environment())).status,200);assert.equal(calls,2);
});
test('To ugyldige svar og upstreamfejl giver pæne, lukkede fejl',async()=>{
  let calls=0;const r=await createHandler({fetchImpl:async()=>{calls++;return upstream({text:'forkert'})();}})(request(),environment());assert.equal(r.status,502);assert.equal((await r.json()).error.code,'INVALID_OUTPUT');assert.equal(calls,2);
  const failure=await createHandler({fetchImpl:async()=>new Response('private provider data',{status:401})})(request(),environment());assert.equal(failure.status,502);assert.ok(!(await failure.text()).includes('private provider'));
});
test('Modelprompt indeholder beskyttelse, sprog, tone, intensitet og skema',()=>{
  const r=modelRequest({...input,text:'Anna siger "hej" 42 gange.',tone:'school',intensity:'strong'},'configured-model',true);
  assert.equal(r.model,'configured-model');assert.match(r.system,/Kraftig/);assert.match(r.system,/Skole/);assert.match(r.system,/ubetroet/);assert.match(r.system,/dansk/);assert.equal(r.output_config.format.type,'json_schema');assert.ok(JSON.parse(r.messages[0].content).protectedFragments.includes('Anna'));
});
