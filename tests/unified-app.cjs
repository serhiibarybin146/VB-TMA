const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('compatibility keeps the agreed example and is symmetric for both partners',()=>{
 const ctx={window:{}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'matrix-logic.js'),'utf8'),ctx);
 vm.runInContext(fs.readFileSync(path.join(root,'compatibility.js'),'utf8').replace(/initCompatibility\(\);\s*$/,''),ctx);
 const result=vm.runInContext("calculateCompatibility(MatrixLogic.calculateBase('1990-12-18'),MatrixLogic.calculateBase('1988-11-06'))",ctx);
 assert.deepEqual(Array.from(result.values),[6,20,5,5,9,20,20,17]);assert.equal(result.points.centerValue,13);
 const reverse=vm.runInContext("calculateCompatibility(MatrixLogic.calculateBase('1988-11-06'),MatrixLogic.calculateBase('1990-12-18'))",ctx);
 assert.equal(JSON.stringify(result),JSON.stringify(reverse));
 assert.equal(result.date,null);assert.equal(result.contour.length,8);assert.ok(result.contour.every(row=>row.length===7));
});
test('deployed page contains real Telegram SDK and no preview identity or test-role adapter',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('https://telegram.org/js/telegram-web-app.js'));
 assert.ok(!/local-runtime|__dev|previewRole|preview_owner/.test(html));
 assert.ok(!html.includes('id="historyView"'));assert.ok(html.includes("switchTab('profile'"));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
});

test('preview mock is excluded from deployment and fails on a public host',()=>{
 const ignore=fs.readFileSync(path.join(root,'.vercelignore'),'utf8');assert.ok(ignore.split(/\r?\n/).includes('dev/'));
 const source=fs.readFileSync(path.join(root,'dev/runtime.js'),'utf8');
 assert.throws(()=>vm.runInNewContext(source,{location:{hostname:'tma.viktoriibarybina.com'}}),/Local preview only/);
});
test('shared API contract keeps test accounts isolated and never reaches live checkout',async()=>{
 const storage=new Map();let networkCalls=0;
 const make=role=>{
  const window={fetch:async()=>{networkCalls++;throw new Error('LIVE_NETWORK_FORBIDDEN');}};
  const ctx={window,location:{hostname:'127.0.0.1',search:'?previewRole='+role,href:'http://127.0.0.1:8081/index.html'},URL,URLSearchParams,Response,Date,JSON,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'dev/runtime.js'),'utf8'),ctx);
  ctx.fetch=(...args)=>window.fetch(...args);vm.runInContext(fs.readFileSync(path.join(root,'supabase-client.js'),'utf8'),ctx);return ctx;
 };
 const owner=make('owner'),basic=make('basic');
 const a=await owner.privateApi('session'),b=await basic.privateApi('session');assert.notEqual(a.user.id,b.user.id);
 assert.equal((await owner.privateApi('permissions')).data.length,4);assert.equal((await basic.privateApi('permissions')).data.length,0);
 await owner.privateApi('save',{birth_date:'1988-11-06'});assert.equal((await owner.privateApi('history')).data.length,1);assert.equal((await basic.privateApi('history')).data.length,0);
 await assert.rejects(()=>owner.backendRequest('create-checkout',{feature_key:'money_code'}));assert.equal(networkCalls,0);
});
