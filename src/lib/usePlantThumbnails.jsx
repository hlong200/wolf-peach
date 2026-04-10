import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const URL_TTL_S = 7 * 24 * 60 * 60; // 7 days — Supabase signed URL max
const URL_TTL_MS = URL_TTL_S * 1000;
const URL_REFRESH_MS = 60 * 60 * 1000; // regenerate if < 1 hour left on the URL
const LS_KEY = 'wolf-peach:thumbnails'; // { [plantId]: { url, expires } }

// Cached once per session so repeated calls don't re-list the bucket
let thumbnailPathById = null;

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

function loadThumbnailCache() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function saveThumbnailCache(cache) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch {}
}

// Resolves signed thumbnail URLs for an array of plant ids.
// Returns a map of { [id]: url } — null for plants with no image.
export async function fetchThumbnailUrls(ids) {
    const pathById = await getThumbnailPathById();
    const thumbnailCache = loadThumbnailCache();

    const stale = ids.filter(id => {
        const entry = thumbnailCache[String(id)];
        return pathById[String(id)] && (!entry || Date.now() > entry.expires - URL_REFRESH_MS);
    });

    if (stale.length) {
        const pathToId = {};
        stale.forEach(id => { pathToId[pathById[String(id)]] = String(id); });

        const { data: signed } = await supabase.storage
            .from('plant-images')
            .createSignedUrls(stale.map(id => pathById[String(id)]), URL_TTL_S);

        signed?.forEach(({ path, signedUrl }) => {
            const id = pathToId[path];
            if (id && signedUrl)
                thumbnailCache[id] = { url: signedUrl, expires: Date.now() + URL_TTL_MS };
        });
        saveThumbnailCache(thumbnailCache);
    }

    const result = {};
    ids.forEach(id => {
        result[String(id)] = thumbnailCache[String(id)]?.url ?? null;
    });
    return result;
}

// Hook form — useful for a single plant (e.g. detail page)
export function usePlantThumbnail(id) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetchThumbnailUrls([id]).then(map => setUrl(map[String(id)]));
    }, [id]);

    return url;
}
