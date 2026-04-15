// Pure utilities for computing a plant's current season status.
// No Supabase dependency — all inputs are plain values.

function addWeeks(date, weeks) {
    const d = new Date(date);
    d.setDate(d.getDate() + Math.round(weeks * 7));
    return d;
}

function frostDateThisYear(mmdd) {
    const [m, d] = mmdd.split('-').map(Number);
    return new Date(new Date().getFullYear(), m - 1, d);
}

// Returns 'harvest' | 'planting' | null
//   'harvest'  — today falls within the harvest window
//   'planting' — today falls within any sow/transplant window (±1 week buffer)
//   null       — out of season, missing data, or frost-free zone with no logic yet
export function computeSeasonStatus(season, lastFrost, today = new Date()) {
    if (!season || !lastFrost) return null;

    const frostDate = frostDateThisYear(lastFrost);

    const harvestStart = addWeeks(frostDate, season.harvest_start_weeks_from_frost);
    const harvestEnd   = addWeeks(frostDate, season.harvest_end_weeks_from_frost);

    if (today >= harvestStart && today <= harvestEnd) return 'harvest';

    const weekOffsets = [
        season.start_indoors_weeks,
        season.direct_sow_weeks,
        season.transplant_weeks,
    ].filter(w => w != null);

    if (weekOffsets.length > 0) {
        const plantStart = addWeeks(frostDate, Math.min(...weekOffsets) - 1);
        const plantEnd   = addWeeks(frostDate, Math.max(...weekOffsets) + 1);
        if (today >= plantStart && today <= plantEnd) return 'planting';
    }

    return null;
}
