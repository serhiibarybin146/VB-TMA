const {test}=require('node:test');
const assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
function setup(parameters={chat_id:-1003731619748},method='inspect') {
 let handler;let claimed=false;const calls=[];
 const job={method,parameters,user_request:'Explicit human test request'};
 const id='11111111-1111-4111-8111-111111111111',key='22222222-2222-4222-8222-222222222222';
 const source=stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'../supabase/functions/telegram-admin/index.ts'),'utf8').replace('export async function','async function'));
 vm.runInNewContext(source,{Response,JSON,Date,Set,Error,AbortSignal,Deno:{env:{get:name=>name==='SUPABASE_URL'?'https://database.invalid':'test-secret'},serve:fn=>handler=fn},fetch:async(url,opts)=>{
  const body=JSON.parse(opts.body);calls.push({url,body});
  if(url.startsWith('https://database.invalid')) {
   if(url.includes('execution_key=')) {if(!claimed&&url.includes(id)&&url.includes(key)){claimed=true;return Response.json([job]);}return Response.json([]);}
   return Response.json([]);
  }
  const result=url.endsWith('/getMe')?{id:123,username:'My_NumerologistBot'}:url.endsWith('/getChat')?{id:-1003731619748,title:'Test',type:'channel'}:url.endsWith('/getChatMember')?{status:'administrator',can_post_messages:true,can_edit_messages:true}:{message_id:44,chat:{id:-1003731619748}};
  return Response.json({ok:true,result});
 }});
 return {id,key,calls,run:body=>handler(new Request('https://worker.invalid',{method:'POST',body:JSON.stringify(body)}))};
}
test('requires a private job capability and cannot replay it',async()=>{
 const s=setup();assert.equal((await s.run({id:s.id,execution_key:'33333333-3333-4333-8333-333333333333'})).status,401);
 assert.equal(s.calls.filter(c=>c.url.includes('api.telegram.org')).length,0);
 assert.equal((await s.run({id:s.id,execution_key:s.key})).status,200);
 const before=s.calls.filter(c=>c.url.includes('api.telegram.org')).length;
 assert.equal((await s.run({id:s.id,execution_key:s.key})).status,401);
 assert.equal(s.calls.filter(c=>c.url.includes('api.telegram.org')).length,before);
});
test('inspection performs read-only Telegram calls and does not expose result or token',async()=>{
 const s=setup();const r=await s.run({id:s.id,execution_key:s.key,method:'sendMessage',parameters:{text:'Injected'}});
 assert.deepEqual(await r.json(),{ok:true});
 assert.deepEqual(s.calls.filter(c=>c.url.includes('api.telegram.org')).map(c=>c.url.split('/').at(-1)),['getMe','getChat','getChatMember']);
});
test('blocks jobs targeting another chat',async()=>{
 const s=setup({chat_id:-999},'sendMessage');assert.equal((await s.run({id:s.id,execution_key:s.key})).status,500);
 assert.equal(s.calls.filter(c=>c.url.includes('api.telegram.org')).length,0);
});
