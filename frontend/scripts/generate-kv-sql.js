const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Configuration
const EXPORT_CSV = path.resolve(__dirname, '../../../User Export.csv');
const STRIPE_CSV = path.resolve(__dirname, '../../../Stripe clients .csv');
const OUTPUT_SQL = path.resolve(__dirname, '../fix_customers_kv.sql');

console.log('Generating KV Store SQL script...');

let users = new Map(); // Email -> Name

// 1. Process User Export
if (fs.existsSync(EXPORT_CSV)) {
    const content = fs.readFileSync(EXPORT_CSV, 'utf8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    records.forEach(r => {
        if (r.user_email) {
            const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.display_name || r.user_login;
            users.set(r.user_email.toLowerCase(), name);
        }
    });
}

// 2. Process Stripe Export
if (fs.existsSync(STRIPE_CSV)) {
    let content = fs.readFileSync(STRIPE_CSV, 'utf8');
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
        if (email) {
            let name = '';
            if (r.Name) name = r.Name;
            else if (r.first_name || r.last_name) name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
            else if (r.display_name) name = r.display_name;

            if (!users.has(email.toLowerCase())) {
                users.set(email.toLowerCase(), name);
            }
        }
    });
}

// Generate SQL
// We need to insert into kv_store_e0d9c111 (key, value)
// Key format: team-member:{uuid}
// Value format: { id, email, name, role: 'Client', status: 'active', ... }

// Since we don't know the UUIDs from Auth without querying, we have to rely on a subquery or just generate new UUIDs?
// Wait, if we generate new UUIDs, they won't match Auth UUIDs.
// The app seems to use `id` from Auth for team members in `useAuth.tsx` (sync logic).
// So we MUST use the Auth ID.

// SQL Strategy:
// INSERT INTO kv_store_e0d9c111 (key, value)
// SELECT 
//   'team-member:' || au.id,
//   jsonb_build_object(
//     'id', au.id,
//     'email', au.email,
//     'name', COALESCE(au.raw_user_meta_data->>'name', au.email),
//     'role', 'Client',
//     'status', 'active',
//     'createdAt', to_jsonb(now()),
//     'updatedAt', to_jsonb(now()),
//     'specialties', '[]'::jsonb,
//     'services', '[]'::jsonb
//   )
// FROM auth.users au
// WHERE au.email IN (...)
// AND NOT EXISTS (SELECT 1 FROM kv_store_e0d9c111 WHERE key = 'team-member:' || au.id);

const emailList = Array.from(users.keys()).map(e => `'${e}'`).join(',\n    ');

const sql = `
-- Fix Missing Customers in KV Store (kv_store_e0d9c111)
-- This script inserts users into the KV store if they exist in auth.users but are missing from the KV store.

INSERT INTO public.kv_store_e0d9c111 (key, value)
SELECT 
    'team-member:' || au.id,
    jsonb_build_object(
        'id', au.id,
        'email', au.email,
        'name', COALESCE(au.raw_user_meta_data->>'name', au.email),
        'role', 'Client',
        'status', 'active',
        'createdAt', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'updatedAt', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'specialties', '[]'::jsonb,
        'services', '[]'::jsonb
    )
FROM auth.users au
WHERE au.email IN (
    ${emailList}
)
AND NOT EXISTS (
    SELECT 1 FROM public.kv_store_e0d9c111 WHERE key = 'team-member:' || au.id
);

-- Output results
SELECT count(*) as inserted_customers FROM public.kv_store_e0d9c111
WHERE key LIKE 'team-member:%';
`;

fs.writeFileSync(OUTPUT_SQL, sql);
console.log(`Generated KV SQL at ${OUTPUT_SQL}`);
console.log(`Total unique emails: ${users.size}`);
