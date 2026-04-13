import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

export function usePlantLogInstance(rootLogId) {
    const { user } = useAuth();
    const [instance, setInstance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInstance = useCallback(async () => {
        if (!rootLogId) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Root log entry — gives us plant_id, user_id, location, and catalog join
            const { data: rootLog, error: rootError } = await supabase
                .from('plant_logs')
                .select('*, catalog(id, name, culinary_type, days_to_maturity, sun, difficulty)')
                .eq('id', rootLogId)
                .single();
            if (rootError) throw rootError;

            // 2. All log events for this instance (same plant + owner + location)
            let logsQuery = supabase
                .from('plant_logs')
                .select('*')
                .eq('plant_id', rootLog.plant_id)
                .eq('user_id', rootLog.user_id)
                .order('logged_at', { ascending: true });

            logsQuery = rootLog.location
                ? logsQuery.eq('location', rootLog.location)
                : logsQuery.is('location', null);

            const { data: logs, error: logsError } = await logsQuery;
            if (logsError) throw logsError;

            // 3. Journal entries — hide private ones if the viewer is not the owner
            const isOwner = user?.id === rootLog.user_id;
            let journalQuery = supabase
                .from('journal_entries')
                .select('*')
                .eq('plant_log_id', rootLogId)
                .order('created_at', { ascending: true });

            if (!isOwner) journalQuery = journalQuery.eq('is_private', false);

            const { data: journalEntries, error: journalError } = await journalQuery;
            if (journalError) throw journalError;

            setInstance({
                rootLogId,
                plant:         rootLog.catalog,
                location:      rootLog.location ?? null,
                ownerId:       rootLog.user_id,
                isOwner,
                logs:          logs ?? [],
                journalEntries: journalEntries ?? [],
            });
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [rootLogId, user]);

    useEffect(() => { fetchInstance(); }, [fetchInstance]);

    return { instance, loading, error, refetch: fetchInstance };
}
