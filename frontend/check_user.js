
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://aadzzhdouuxkvelxyoyf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHp6aGRvdXV4a3ZlbHh5b3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcxNzM2OSwiZXhwIjoyMDc5MjkzMzY5fQ.AUVvOxgVg2zxO4M97CPLG9lyvcqUYda5alB3KiNFPFI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkUser(email) {
    console.log(`Checking user: ${email}`);

    // Check auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
    }

    const authUser = users.find(u => u.email === email);
    console.log('Auth User:', authUser ? { id: authUser.id, email: authUser.email, metadata: authUser.user_metadata } : 'Not found');

    // Check public.profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Profile:', profile || 'Not found');
    }
}

checkUser('hello@samisamuraj.com');
