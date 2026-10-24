const SUPABASE_URL = 'https://mekxxekswaunqhfkyosc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1la3h4ZWtzd2F1bnFoZmt5b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzY4NjIsImV4cCI6MjA4NTcxMjg2Mn0.Q5S0O3g5UVlG0C48uUGnEqfSxG-cKr6RIBI9MGqHFi8';

let supabaseClient;

if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase Client Initialized');
} else {
    console.error('Supabase library not found!');
}

// No caller-provided user ID is sent to the private data API.
async function privateApi(action, payload = {}) {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) throw new Error('TELEGRAM_REQUIRED');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/user-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
        body: JSON.stringify({ ...payload, action, initData }),
        cache: 'no-store'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'REQUEST_FAILED');
    return data;
}
