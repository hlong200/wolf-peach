import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

// Fetches the current user's zone and that zone's frost dates in a single join.
// Returns { lastFrost: 'MM-DD' | null, firstFrost: 'MM-DD' | null, zone: string | null }
export function useZoneFrostDates() {
    const { user } = useAuth();
    const [lastFrost, setLastFrost]   = useState(undefined); // undefined = loading
    const [firstFrost, setFirstFrost] = useState(undefined);
    const [zone, setZone]             = useState(null);

    useEffect(() => {
        if (!user) {
            setLastFrost(null);
            setFirstFrost(null);
            return;
        }

        (async () => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('zone, zone_frost_dates!inner(last_frost, first_frost)')
                .eq('id', user.id)
                .maybeSingle();

            if (error || !data) {
                setLastFrost(null);
                setFirstFrost(null);
                return;
            }

            setZone(data.zone ?? null);
            setLastFrost(data.zone_frost_dates?.last_frost ?? null);
            setFirstFrost(data.zone_frost_dates?.first_frost ?? null);
        })();
    }, [user]);

    return { lastFrost, firstFrost, zone };
}
