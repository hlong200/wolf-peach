import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { useFilters } from './FilterProvider';

const DEBOUNCE_MS = 300;
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 min — just under signed URL expiry
const URL_TTL_S = 7 * 24 * 60 * 60; // 7 days — Supabase signed URL max
const URL_TTL_MS = URL_TTL_S * 1000;
const URL_REFRESH_MS = 60 * 60 * 1000; // regenerate if < 1 hour left on the URL
const LS_KEY = 'wolf-peach:thumbnails'; // { [plantId]: { url, expires } }

// Module-level caches survive filter changes and re-mounts within a session
let thumbnailPathById = null;
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

function loadThumbnailCache() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function saveThumbnailCache(cache) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch {}
}

async function getThumbnailPathById() {
    if (thumbnailPathById) return thumbnailPathById;
    const { data: files } = await supabase.storage
        .from('plant-images')
        .list('thumbnail', { limit: 10000 });
    thumbnailPathById = {};
    files?.forEach(({ name }) => {
        const stem = name.replace(/\.[^.]+$/, '');
        thumbnailPathById[stem] = `thumbnail/${name}`;
    });
    return thumbnailPathById;
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
                    companions ( companion, sentiment, reason )
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

                const dbColumn =
                    sortBy === 'days' ? 'days_to_maturity' : sortBy;
                query = query.order(dbColumn, { ascending: sortOrder === 'asc' });

                const { data, error } = await query;
                if (error) throw error;

                const pathById = await getThumbnailPathById();
                const thumbnailCache = loadThumbnailCache();

                // Only regenerate URLs that are missing or expiring within the hour
                const stale = data.filter(p => {
                    const entry = thumbnailCache[String(p.id)];
                    return pathById[String(p.id)] && (!entry || Date.now() > entry.expires - URL_REFRESH_MS);
                });

                if (stale.length) {
                    const pathToPlantId = {};
                    stale.forEach(p => { pathToPlantId[pathById[String(p.id)]] = String(p.id); });

                    const { data: signed } = await supabase.storage
                        .from('plant-images')
                        .createSignedUrls(stale.map(p => pathById[String(p.id)]), URL_TTL_S);

                    signed?.forEach(({ path, signedUrl }) => {
                        const plantId = pathToPlantId[path];
                        if (plantId && signedUrl)
                            thumbnailCache[plantId] = { url: signedUrl, expires: Date.now() + URL_TTL_MS };
                    });
                    saveThumbnailCache(thumbnailCache);
                }

                const mapped = data.map(p => ({
                    ...p,
                    thumbnail_url: thumbnailCache[String(p.id)]?.url ?? null,
                    tags: p.plant_tags.map(pt => pt.tags.name),
                    plant_tags: undefined,
                    quick_view: {
                        companions_good: p.companions
                            .filter(c => c.sentiment === 'good')
                            .map(c => c.companion),
                        companions_bad: p.companions
                            .filter(c => c.sentiment === 'bad')
                            .map(c => c.companion),
                        tip: p.tip,
                    },
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
