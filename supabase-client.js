const SUPABASE_URL = 'https://mekxxekswaunqhfkyosc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1la3h4ZWtzd2F1bnFoZmt5b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzY4NjIsImV4cCI6MjA4NTcxMjg2Mn0.Q5S0O3g5UVlG0C48uUGnEqfSxG-cKr6RIBI9MGqHFi8';

let supabase;

if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase Client Initialized');
} else {
    console.error('Supabase library not found!');
}
