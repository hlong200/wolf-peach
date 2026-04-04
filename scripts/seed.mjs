import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const plants = JSON.parse(
    readFileSync(join(__dirname, '../public/data/vegetables.json'), 'utf-8')
);

async function upsert(table, rows, conflict) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
    if (error) { console.error(`${table} failed:`, error.message); process.exit(1); }
}

// ── 1. culinary_types ────────────────────────────────────────────────────────
console.log('Seeding culinary_types...');
const culinaryTypes = [...new Map(
    plants.map(p => [p.culinary_type, { id: p.culinary_type, emoji: p.emoji }])
).values()];
await upsert('culinary_types', culinaryTypes, 'id');

// ── 2. catalog ───────────────────────────────────────────────────────────────
console.log(`Seeding ${plants.length} plants...`);
const catalogRows = plants.map(({ quick_view, emoji, tags, ...plant }) => ({
    ...plant,
    spacing_in: quick_view.spacing_in,
    tip:        quick_view.tip,
}));
await upsert('catalog', catalogRows, 'id');

// ── 3. tags + plant_tags ─────────────────────────────────────────────────────
console.log('Seeding tags...');
const uniqueTags = [...new Set(plants.flatMap(p => p.tags))];
await upsert('tags', uniqueTags.map(name => ({ name })), 'name');

// Fetch tag name → id mapping
const { data: tagRows, error: tagFetchErr } = await supabase.from('tags').select('id, name');
if (tagFetchErr) { console.error('tag fetch failed:', tagFetchErr.message); process.exit(1); }
const tagIdMap = Object.fromEntries(tagRows.map(t => [t.name, t.id]));

console.log('Seeding plant_tags...');
const plantTagRows = plants.flatMap(p =>
    [...new Set(p.tags)].map(tag => ({ plant_id: p.id, tag_id: tagIdMap[tag] }))
);
await upsert('plant_tags', plantTagRows, 'plant_id,tag_id');

console.log('Done.');
