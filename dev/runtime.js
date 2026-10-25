/** Injected only by the loopback server. Never part of the deployed page. */
(() => {
 if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw new Error('Local preview only');
 const owner=new URLSearchParams(location.search).get('previewRole')==='owner',role=owner?'owner':'basic';
 const user={id:owner?900000002:900000001,first_name:owner?'Владелец':'Пользователь',last_name:'Предпросмотр',username:owner?'preview_owner':'preview_user'};
 const noop=()=>{};
 window.Telegram={WebApp:{initData:'local-preview-'+role,initDataUnsafe:{user},ready:noop,expand:noop,disableVerticalSwipes:noop,requestFullscreen:noop,setHeaderColor:noop,setBackgroundColor:noop,showAlert:message=>alert(message),openLink:url=>window.open(url,'_blank','noopener'),HapticFeedback:{impactOccurred:noop,notificationOccurred:noop,selectionChanged:noop}}};
 const products=[['money_code','Денежный код',100],['compatibility','Совместимость',200],['year_forecast','Прогноз на год',300],['month_forecast','Прогноз на месяц',400]].map(([id,name,price_cents])=>({id,name,price_cents,currency:'eur',active:true}));
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(!url.hostname.endsWith('.supabase.co'))return originalFetch(input,options);
  const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.pathname!=='/functions/v1/user-api')return response({error:'Оплата отключена в локальном предпросмотре'},403);
  const body=JSON.parse(options.body||'{}');
  if(body.initData!=='local-preview-'+role)return response({error:'UNAUTHORIZED'},401);
  if(body.action==='session')return response({user});
  if(body.action==='products')return response({data:products});
  if(body.action==='permissions')return response({data:owner?products.map(p=>({permission_key:p.id,granted_at:'2026-10-25T00:00:00Z'})):[]});
  const key='tma_preview_history_'+role;
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}};
  if(body.action==='history')return response({data:read().slice(0,3).map(birth_date=>({birth_date}))});
  if(body.action==='save'){
   const value=body.birth_date,date=typeof value==='string'?new Date(value+'T00:00:00Z'):new Date(NaN);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return response({error:'INVALID_DATE'},400);
   localStorage.setItem(key,JSON.stringify([value,...read().filter(d=>d!==value)].slice(0,3)));return response({ok:true});
  }
  return response({error:'UNKNOWN_ACTION'},400);
 };
})();
