const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHmac,webcrypto}=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const token='123456:test-secret-for-tests-only';
function signed(id,when=Math.floor(Date.now()/1000)) {
 const params=new URLSearchParams({auth_date:String(when),user:JSON.stringify({id,first_name:'Test'})});
 const data=[...params].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();
 params.set('hash',createHmac('sha256',secret).update(data).digest('hex'));return params.toString();
}
async function setup() {
 const {verifyTelegram}=await import('../supabase/functions/_shared/telegram.mjs');
 let handler;const requests=[];
 const source=stripTypeScriptTypes(fs.readFileSync(path.join(root,'supabase/functions/user-api/index.ts'),'utf8').replace(/^import .*\r?\n/,''));
 vm.runInNewContext(source,{verifyTelegram,Response,Request,Date,Map,JSON,Number,Error,crypto:webcrypto,Deno:{env:{get:key=>({TELEGRAM_BOT_TOKEN:token,SUPABASE_SERVICE_ROLE_KEY:'test-server-only',SUPABASE_URL:'https://test.invalid'})[key]},serve:fn=>handler=fn},fetch:async(url,options)=>{
  requests.push({url,options});
  if(url.includes('products?'))return Response.json([{id:'money_code',name:'Денежный код',price_cents:100,currency:'eur'}]);
  if(url.includes('user_permissions?'))return Response.json([{permission_key:'money_code'}]);
  if(url.includes('select=id'))return Response.json([]);
  if(url.includes('select=birth_date'))return Response.json([{birth_date:'1988-11-06'}]);
  return new Response(null,{status:204});
 }});
 const call=async body=>handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));
 return {call,requests,verifyTelegram};
}
test('signature, altered identity, expiration and malformed initData',async()=>{
 const {verifyTelegram}=await setup();assert.equal((await verifyTelegram(signed(101),token)).id,101);
 for(const input of ['',signed(101).replace('101','202'),signed(101,1),signed(101,Math.floor(Date.now()/1000)+600),signed(101)+'&auth_date=1'])await assert.rejects(()=>verifyTelegram(input,token));
});
test('all private actions reject forged identity before accessing database',async()=>{
 const {call,requests}=await setup();
 for(const action of ['session','history','permissions','save','products']){assert.equal((await call({action,initData:signed(101).replace('101','202'),user_id:202})).status,401);}
 assert.equal(requests.length,0);
});
test('two users can only query their verified owner; submitted owner and table ignored',async()=>{
 const {call,requests}=await setup();
 for(const id of [101,202])for(const action of ['session','history','permissions','save']){
  const start=requests.length;const result=await call({action,initData:signed(id),user_id:999,table:'users',birth_date:'1988-11-06'});assert.equal(result.status,200);
  for(const req of requests.slice(start)){
   if(req.options.method==='POST') {const body=JSON.parse(req.options.body);assert.equal(body.user_id||body.id,id);}
   else assert.ok(req.url.includes(`user_id=eq.${id}&`));
   assert.ok(!req.url.includes('999'));
  }
 }
 assert.ok(requests.some(r=>r.url.includes('status=eq.granted')));
});
test('invalid dates and unsupported actions do not write data',async()=>{
 const {call,requests}=await setup();
 for(const birth_date of ['2025-02-29','1988-02-31','bad'])assert.equal((await call({action:'save',birth_date,initData:signed(101)})).status,400);
 assert.equal((await call({action:'delete',initData:signed(101)})).status,400);assert.equal(requests.length,0);
});
test('checkout takes verified owner and rejects unsigned purchase before Stripe',async()=>{
 const {verifyTelegram}=await setup();let handler;const sessions=[];let lookups=0;
 const source=stripTypeScriptTypes(fs.readFileSync(path.join(root,'supabase/functions/create-checkout/index.ts'),'utf8').replace(/^import .*\r?\n/gm,''));
 class Stripe {static createFetchHttpClient(){return {};} constructor(){this.checkout={sessions:{create:async input=>{sessions.push(input);return {id:'test',url:'https://checkout.stripe.com/test'};}}};}}
 const query={select(){return this;},eq(){return this;},async single(){lookups++;return {data:{name:'Test',currency:'eur',price_cents:100}};}};
 vm.runInNewContext(source,{verifyTelegram,Stripe,createClient:()=>({from:()=>query}),serve:fn=>handler=fn,Response,Error,JSON,Deno:{env:{get:key=>key==='TELEGRAM_BOT_TOKEN'?token:'test'}}});
 const call=body=>handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}));
 assert.equal((await call({user_id:999,feature_key:'money_code'})).status,401);assert.equal(lookups,0);assert.equal(sessions.length,0);
 assert.equal((await call({initData:signed(101),user_id:999,feature_key:'money_code'})).status,200);
 assert.equal(sessions[0].metadata.user_id,'101');
});

test('verified users receive the public product catalogue without private data',async()=>{
 const {call}=await setup();const r=await call({action:'products',initData:signed(101)});assert.equal(r.status,200);
 const payload=await r.json();assert.equal(payload.data[0].id,'money_code');assert.equal(payload.data[0].price_cents,100);
 assert.ok(!JSON.stringify(payload).includes('user_id'));
});
