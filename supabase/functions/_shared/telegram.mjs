const encoder = new TextEncoder();
async function hmac(key, value) {
    const cryptoKey = await crypto.subtle.importKey('raw', typeof key === 'string' ? encoder.encode(key) : key, {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value)));
}
export async function verifyTelegram(initData, token, now = Math.floor(Date.now()/1000)) {
    if (!token) throw new Error('AUTH_NOT_CONFIGURED');
    if (typeof initData !== 'string' || !initData || initData.length > 16384) throw new Error('UNAUTHORIZED');
    const params = new URLSearchParams(initData);
    if (new Set(params.keys()).size !== [...params.keys()].length) throw new Error('UNAUTHORIZED');
    const hash = params.get('hash');
    if (!/^[a-f0-9]{64}$/.test(hash || '')) throw new Error('UNAUTHORIZED');
    params.delete('hash');
    const check = [...params.entries()].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([key,value])=>`${key}=${value}`).join('\n');
    const secret = await hmac('WebAppData', token);
    const expected = await hmac(secret, check);
    const supplied = Uint8Array.from(hash.match(/../g), value=>parseInt(value,16));
    let mismatch=0; expected.forEach((byte,i)=>{mismatch |= byte ^ supplied[i];});
    if (mismatch) throw new Error('UNAUTHORIZED');
    const authDate = Number(params.get('auth_date'));
    if (!Number.isInteger(authDate) || authDate <= 0 || authDate > now+60 || now-authDate > 86400) throw new Error('UNAUTHORIZED');
    let user;
    try { user=JSON.parse(params.get('user') || 'null'); } catch { throw new Error('UNAUTHORIZED'); }
    if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('UNAUTHORIZED');
    return user;
}
