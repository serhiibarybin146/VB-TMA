// No Telegram token or database secret leaves this function.
// Only a privileged database connection can create jobs. The HTTP caller supplies
// a short-lived, one-use capability; never a Telegram method or message content.
const CHANNEL_ID = -1003731619748;
const METHODS = new Set(['sendMessage','editMessageText','pinChatMessage','unpinChatMessage','setChatTitle','setChatDescription']);
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const reply = (body: unknown, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
async function database(path: string, method: string, body: unknown) {
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!key) throw new Error('DATABASE_UNAVAILABLE');
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/telegram_admin_jobs${path}`, {
        method, headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},
        body:JSON.stringify(body), signal:AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('DATABASE_UNAVAILABLE');
    return response.json();
}
async function telegram(method: string, params: Record<string,unknown>) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('BOT_NOT_CONFIGURED');
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(params),signal:AbortSignal.timeout(15000)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(`TELEGRAM_${data.error_code || response.status}`);
    return data.result;
}
export async function executeJob(job: {method:string, parameters:Record<string,unknown>, user_request:string}) {
    if (!job.user_request?.trim()) throw new Error('NOT_AUTHORIZED');
    const params = job.parameters;
    if (params.chat_id !== CHANNEL_ID) throw new Error('CHAT_NOT_ALLOWED');
    if (job.method === 'inspect') {
        const bot = await telegram('getMe', {});
        if (bot.username !== 'My_NumerologistBot') throw new Error('WRONG_BOT');
        const chat = await telegram('getChat', {chat_id:CHANNEL_ID});
        const member = await telegram('getChatMember', {chat_id:CHANNEL_ID,user_id:bot.id});
        return {bot:bot.username,chat:{id:chat.id,title:chat.title,type:chat.type,description:chat.description,linked_chat_id:chat.linked_chat_id},rights:{status:member.status,can_post_messages:!!member.can_post_messages,can_edit_messages:!!member.can_edit_messages,can_change_info:!!member.can_change_info,can_delete_messages:!!member.can_delete_messages}};
    }
    if (!METHODS.has(job.method)) throw new Error('METHOD_NOT_ALLOWED');
    // Do not allow extra Bot API fields to change the target or request semantics.
    const fields: Record<string,string[]> = {
        sendMessage:['text','parse_mode','reply_markup','disable_notification','link_preview_options'],
        editMessageText:['message_id','text','parse_mode','reply_markup','link_preview_options'],
        pinChatMessage:['message_id','disable_notification'],unpinChatMessage:['message_id'],
        setChatTitle:['title'],setChatDescription:['description']
    };
    const clean: Record<string,unknown> = {chat_id:CHANNEL_ID};
    for (const field of fields[job.method]) if (params[field] !== undefined) clean[field]=params[field];
    const result = await telegram(job.method, clean);
    return typeof result==='boolean' ? {ok:result} : {ok:true,message_id:result.message_id,chat_id:result.chat?.id};
}
Deno.serve(async req=>{
    if (req.method!=='POST') return reply({error:'METHOD_NOT_ALLOWED'},405);
    let id: string | undefined;
    try {
        const text = await req.text();
        if(text.length>1024) return reply({error:'UNAUTHORIZED'},401);
        const body=JSON.parse(text);
        if(typeof body.id!=='string'||typeof body.execution_key!=='string'||!uuid.test(body.id)||!uuid.test(body.execution_key)) return reply({error:'UNAUTHORIZED'},401);
        const claimed=await database(`?id=eq.${body.id}&execution_key=eq.${body.execution_key}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,'PATCH',{status:'running'});
        if(claimed.length!==1) return reply({error:'UNAUTHORIZED'},401);
        id=body.id;
        const result=await executeJob(claimed[0]);
        await database(`?id=eq.${id}`,'PATCH',{status:'done',result,completed_at:new Date().toISOString()});
        // Results are private; read them over the privileged Supabase connection.
        return reply({ok:true});
    } catch(error) {
        if(id) {
            const message=error instanceof Error && /^(TELEGRAM_\d+|CHAT_NOT_ALLOWED|WRONG_BOT|NOT_AUTHORIZED|METHOD_NOT_ALLOWED|BOT_NOT_CONFIGURED)$/.test(error.message)?error.message:'EXECUTION_UNCERTAIN';
            try { await database(`?id=eq.${id}`,'PATCH',{status:'failed',result:{error:message},completed_at:new Date().toISOString()}); } catch { /* Never retry Telegram writes automatically. */ }
        }
        return reply({error:'REQUEST_FAILED'},500);
    }
});
