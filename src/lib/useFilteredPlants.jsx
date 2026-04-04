import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { useFilters } from './FilterProvider';

const DEBOUNCE_MS = 300;

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
                setData(data.map(p => ({
                    ...p,
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
                })));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }, textFilter ? DEBOUNCE_MS : 0);

        return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sunFilter, difficultyFilter, sortBy, sortOrder, textFilter, ids?.join(',')]);

    return { data, loading, error };
}
