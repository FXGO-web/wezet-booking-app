const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Configuration
const EXPORT_CSV = path.resolve(__dirname, '../../../User Export.csv');
const STRIPE_CSV = path.resolve(__dirname, '../../../Stripe clients .csv');
const OUTPUT_SQL = path.resolve(__dirname, '../fix_customers.sql');

console.log('Generating SQL script...');

let emails = new Set();

// 1. Process User Export
if (fs.existsSync(EXPORT_CSV)) {
    const content = fs.readFileSync(EXPORT_CSV, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    records.forEach(r => {
        if (r.user_email) emails.add(r.user_email.toLowerCase());
    });
    console.log(`Loaded ${records.length} from User Export.`);
}

// 2. Process Stripe Export
if (fs.existsSync(STRIPE_CSV)) {
    let content = fs.readFileSync(STRIPE_CSV, 'utf8');
    // Handle Stripe header hack
    const lines = content.split('\n');
    if (lines[0].trim() === 'unified_customers-2') {
        content = lines.slice(1).join('\n');
    }
    const delimiter = content.includes(';') ? ';' : ',';

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: delimiter,
        trim: true
    });
    records.forEach(r => {
        const email = r.user_email || r.Email || r.email;
        if (email) emails.add(email.toLowerCase());
    });
    console.log(`Loaded ${records.length} from Stripe Export.`);
}

const emailList = Array.from(emails).map(e => `'${e}'`).join(',\n    ');

const sql = `
-- Fix Missing Customers in team_members table
-- This script inserts users into team_members if they exist in auth.users but are missing from team_members.

INSERT INTO public.team_members (id, email, name, role, status, created_at)
SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    'Client' as role,
    'active' as status,
    NOW() as created_at
FROM auth.users au
WHERE au.email IN (
    ${emailList}
)
AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.id = au.id
);

-- Output results
SELECT count(*) as inserted_customers FROM public.team_members 
WHERE created_at > NOW() - INTERVAL '1 minute';
`;

fs.writeFileSync(OUTPUT_SQL, sql);
console.log(`Generated SQL at ${OUTPUT_SQL}`);
console.log(`Total unique emails: ${emails.size}`);
