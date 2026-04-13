import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

export function usePlantLogs() {
    const { user } = useAuth();
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const [
                { data: logsData,    error: logsError },
                { data: journalData, error: journalError },
            ] = await Promise.all([
                supabase
                    .from('plant_logs')
                    .select('*, catalog(id, name, culinary_type)')
                    .eq('user_id', user.id)
                    .order('logged_at', { ascending: true }),
                supabase
                    .from('journal_entries')
                    .select('*, plant_logs(id, plant_id, location)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true }),
            ]);
            if (logsError)    throw logsError;
            if (journalError) throw journalError;

            // Group log events into plant instances by plant_id + location.
            // The first log entry for a group becomes the root (its id is used by journal entries).
            const instanceMap = new Map();
            for (const log of logsData ?? []) {
                const key = `${log.plant_id}::${log.location ?? ''}`;
                if (!instanceMap.has(key)) {
                    instanceMap.set(key, {
                        key,
                        plant_id:   log.plant_id,
                        plant:      log.catalog,
                        location:   log.location ?? null,
                        rootLogId:  log.id,
                        logs:           [],
                        journalEntries: [],
                    });
                }
                instanceMap.get(key).logs.push(log);
            }

            // Attach journal entries to their instance via the linked plant_log's plant_id + location.
            for (const entry of journalData ?? []) {
                if (entry.plant_logs) {
                    const key = `${entry.plant_logs.plant_id}::${entry.plant_logs.location ?? ''}`;
                    if (instanceMap.has(key)) {
                        instanceMap.get(key).journalEntries.push(entry);
                    }
                }
            }

            // Sort instances by most recent activity descending.
            const sorted = Array.from(instanceMap.values()).sort((a, b) => {
                const latest = (inst) => Math.max(
                    ...inst.logs.map(l => new Date(l.logged_at).getTime()),
                    ...inst.journalEntries.map(j => new Date(j.created_at).getTime()),
                );
                return latest(b) - latest(a);
            });

            setInstances(sorted);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const createLogEvent = async (data) => {
        const { error } = await supabase
            .from('plant_logs')
            .insert({ ...data, user_id: user.id });
        if (error) throw error;
        await fetchAll();
    };

    const createJournalEntry = async (data) => {
        const { error } = await supabase
            .from('journal_entries')
            .insert({ ...data, user_id: user.id });
        if (error) throw error;
        await fetchAll();
    };

    const deleteLog = async (id) => {
        const { error } = await supabase.from('plant_logs').delete().eq('id', id);
        if (error) throw error;
        await fetchAll();
    };

    const deleteJournalEntry = async (id) => {
        const { error } = await supabase.from('journal_entries').delete().eq('id', id);
        if (error) throw error;
        await fetchAll();
    };

    return { instances, loading, error, createLogEvent, createJournalEntry, deleteLog, deleteJournalEntry };
}
