import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { useFilters } from './FilterProvider';
import { fetchThumbnailUrls } from './usePlantThumbnails';

const DEBOUNCE_MS = 300;
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 min — just under signed URL expiry

const queryCache = new Map(); // key → { data, ts }

function getCacheKey(filters) {
    return JSON.stringify(filters);
}

function getCached(key) {
    const entry = queryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) { queryCache.delete(key); return null; }
    return entry.data;
}

function setCached(key, data) {
    queryCache.set(key, { data, ts: Date.now() });
}

export function useFilteredPlants({ ids } = {}) {
    const { sunFilter, difficultyFilter, sortBy, sortOrder, textFilter } = useFilters();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (ids && ids.length === 0) {
            setData([]);
            setLoading(false);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            const cacheKey = getCacheKey({ sunFilter, difficultyFilter, sortBy, sortOrder, textFilter, ids: ids?.join(',') });
            const cached = getCached(cacheKey);
            if (cached) { setData(cached); setLoading(false); return; }

            setLoading(true);
            setError(null);

            try {
                let query = supabase.from('catalog').select(`
                    *,
                    plant_tags ( tags ( name ) ),
                    companions ( companion, sentiment, reason ),
                    plant_seasons ( start_indoors_weeks, direct_sow_weeks, transplant_weeks,
                                    harvest_start_weeks_from_frost, harvest_end_weeks_from_frost )
                `);

                if (ids)              query = query.in('id', ids);
                if (sunFilter)        query = query.eq('sun', sunFilter);
                if (difficultyFilter) query = query.eq('difficulty', difficultyFilter);

                if (textFilter) {
                    query = query.or(
                        `name.ilike.%${textFilter}%,` +
                        `culinary_type.ilike.%${textFilter}%,` +
                        `species.ilike.%${textFilter}%`
                    );
                }

                const dbColumn = sortBy === 'days' ? 'days_to_maturity' : sortBy;
                query = query.order(dbColumn, { ascending: sortOrder === 'asc' });

                const { data, error } = await query;
                if (error) throw error;

                const thumbnailUrls = await fetchThumbnailUrls(data.map(p => p.id));

                const mapped = data.map(p => ({
                    ...p,
                    thumbnail_url: thumbnailUrls[String(p.id)] ?? null,
                    tags: p.plant_tags.map(pt => pt.tags.name),
                    plant_tags: undefined,
                    season: Array.isArray(p.plant_seasons) ? (p.plant_seasons[0] ?? null) : (p.plant_seasons ?? null),
                    plant_seasons: undefined,
                    companions_good: p.companions
                        .filter(c => c.sentiment === 'good')
                        .map(c => c.companion),
                    companions_bad: p.companions
                        .filter(c => c.sentiment === 'bad')
                        .map(c => c.companion),
                    companions_neutral: p.companions
                        .filter(c => c.sentiment === 'neutral')
                        .map(c => c.companion),
                    companions: undefined,
                }));
                setCached(cacheKey, mapped);
                setData(mapped);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sunFilter, difficultyFilter, sortBy, sortOrder, textFilter, ids?.join(',')]);

    return { data, loading, error };
}
