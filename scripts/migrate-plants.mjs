import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DATA_DIR = join(__dirname, '../public/data');

async function upsert(table, rows, conflict) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
    if (error) { console.error(`  ✗ ${table}:`, error.message); process.exit(1); }
}

async function updateCatalog(rows) {
    for (const row of rows) {
        const { id, ...fields } = row;
        const { error } = await supabase.from('catalog').update(fields).eq('id', id);
        if (error) { console.error(`  ✗ catalog update ${id}:`, error.message); process.exit(1); }
    }
}

const dirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

const catalogUpdates = [];
const companionRows = [];

for (const dir of dirs) {
    const files = readdirSync(join(DATA_DIR, dir)).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const plant = JSON.parse(readFileSync(join(DATA_DIR, dir, file), 'utf-8'));
        console.log(`Processing ${plant.id}...`);

        // Detail fields to merge into the catalog row
        catalogUpdates.push({
            id:              plant.id,
            subtype:         plant.subtype         ?? null,
            image:           plant.image           ?? null,
            image_alt:       plant.image_alt       ?? null,
            description:     plant.description     ?? null,
            history:         plant.history         ?? null,
            seasonal_quirks: plant.seasonal_quirks ?? null,
            harvest_cues:    plant.harvest_cues    ?? null,
            variety_notes:   plant.variety_notes   ?? null,
            preservation:    plant.preservation    ?? null,
            culinary_uses:   plant.culinary_uses   ?? [],
            pests_diseases:  plant.pests_diseases  ?? [],
        });

        // Companions
        for (const c of (plant.companions?.good ?? [])) {
            companionRows.push({
                plant_id:  plant.id,
                companion: c.plant,
                sentiment: 'good',
                reason:    c.reason ?? null,
            });
        }
        for (const c of (plant.companions?.bad ?? [])) {
            companionRows.push({
                plant_id:  plant.id,
                companion: c.plant,
                sentiment: 'bad',
                reason:    c.reason ?? null,
            });
        }
    }
}

console.log(`\nUpdating ${catalogUpdates.length} catalog rows...`);
await updateCatalog(catalogUpdates);

console.log(`Seeding ${companionRows.length} companion rows...`);
await upsert('companions', companionRows, 'plant_id,companion,sentiment');

console.log('Done.');
