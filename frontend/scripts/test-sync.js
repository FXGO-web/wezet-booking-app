const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const TEST_EMAIL = "camilla.holmblad@gmail.com";
const TEST_NAME = "Camilla Holmblad";
const TEST_ROLE = "Client"; // Matching CustomerList filter

// Env Vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const projectId = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : null;
const edgeFunctionName = "make-server-e0d9c111";

if (!supabaseUrl || !supabaseAnonKey || !projectId) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/${edgeFunctionName}`;

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API request failed');
        return data;
    } catch (error) {
        console.error(`API Request Failed (${endpoint}):`, error.message);
        throw error;
    }
}

async function testSync() {
    console.log(`Searching for ${TEST_EMAIL}...`);

    try {
        // Search for the user
        const result = await apiRequest(`/team-members?search=${encodeURIComponent(TEST_EMAIL)}`);
        console.log('Search Result:', JSON.stringify(result, null, 2));

        if (result.teamMembers && result.teamMembers.length > 0) {
            console.log('User found in DB!');
        } else {
            console.log('User NOT found in DB.');
        }
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

testSync();
