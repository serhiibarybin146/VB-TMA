/**
 * Supabase Client Initialization
 */

const SUPABASE_URL = 'https://mekxxekswaunqhfkyosc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BYmpKyyZVcbaqE07wsga8g_V71CTl0O';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');
