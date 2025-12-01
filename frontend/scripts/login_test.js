const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aadzzhdouuxkvelxyoyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTczNjksImV4cCI6MjA3OTI5MzM2OX0.O5sQG5s74WSlsTTkGwLmHjTSKiAtXKJBD3Fv8yN8Gxs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'test_admin@wezet.com';
    const password = 'password123';

    console.log(`Attempting login for ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login failed:', error.message);
    } else {
        console.log('Login successful!');
        console.log('Session access token:', data.session?.access_token ? 'Present' : 'Missing');
    }
}

testLogin();
