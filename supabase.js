
const SUPABASE_URL  = 'https://nahmaxxhaganhbdycooo.supabase.co';  
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haG1heHhoYWdhbmhiZHljb29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTc5MjIsImV4cCI6MjA5MzkzMzkyMn0.HjB4Gqf7zY3uEcoRmF-yz61XiQT1g39EHuGs1LTrIDo';      

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

const SITE_URL = window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1'
  ? window.location.origin
  : 'https://rostislav77-hub.github.io/To-Do-List';