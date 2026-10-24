import { verifyTelegram } from '../_shared/telegram.mjs';

const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'};
const reply=(body: unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
async function database(path: string, options: RequestInit = {}) {
    const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!key) throw new Error('DATABASE_NOT_CONFIGURED');
    const response=await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers}});
    if(!response.ok) throw new Error('DATABASE_ERROR');
    const text=await response.text(); return text?JSON.parse(text):null;
}
Deno.serve(async req=>{
    if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
    if(req.method==='GET') {
        const token=Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('BOT_TOKEN');
        if(!token) return reply({ok:false},503);
        try {
            const response=await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const result=await response.json();
            const ok=result.ok===true && result.result?.username==='My_NumerologistBot';
            return reply({ok},ok?200:503);
        } catch { return reply({ok:false},503); }
    }
    if(req.method!=='POST') return reply({error:'METHOD_NOT_ALLOWED'},405);
    try {
        if(Number(req.headers.get('content-length'))>20000) return reply({error:'REQUEST_TOO_LARGE'},413);
        const body=await req.json();
        const user=await verifyTelegram(body.initData,Deno.env.get('TELEGRAM_BOT_TOKEN') || Deno.env.get('BOT_TOKEN'));
        // Never accept a client-supplied owner ID, filter or database table.
        const owner=String(user.id);
        if(body.action==='session') {
            await database('users?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:user.id,username:user.username||null,first_name:user.first_name||null,last_name:user.last_name||null,language_code:user.language_code||null})});
            return reply({user:{id:user.id,username:user.username,first_name:user.first_name,last_name:user.last_name}});
        }
        if(body.action==='permissions') {
            const data=await database(`user_permissions?user_id=eq.${owner}&status=eq.granted&select=permission_key`);
            return reply({data});
        }
        if(body.action==='history') {
            const data=await database(`calculations?user_id=eq.${owner}&select=birth_date&order=created_at.desc&limit=10`);
            return reply({data:[...new Map(data.map((row: {birth_date:string})=>[row.birth_date,row])).values()].slice(0,3)});
        }
        if(body.action==='save') {
            const value=body.birth_date;
            if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return reply({error:'INVALID_DATE'},400);
            const parsed=new Date(`${value}T00:00:00Z`);
            if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value||Number(value.slice(0,4))<1) return reply({error:'INVALID_DATE'},400);
            const existing=await database(`calculations?user_id=eq.${owner}&birth_date=eq.${value}&select=id&limit=1`);
            if(!existing.length) await database('calculations',{method:'POST',body:JSON.stringify({user_id:user.id,birth_date:value,data:{day:parsed.getUTCDate(),month:parsed.getUTCMonth()+1,year:parsed.getUTCFullYear()}})});
            return reply({ok:true});
        }
        return reply({error:'UNKNOWN_ACTION'},400);
    } catch(error) {
        const code=error instanceof Error?error.message:'INTERNAL_ERROR';
        if(code==='UNAUTHORIZED') return reply({error:code},401);
        if(code==='AUTH_NOT_CONFIGURED') return reply({error:code},503);
        return reply({error:'REQUEST_FAILED'},500);
    }
});
