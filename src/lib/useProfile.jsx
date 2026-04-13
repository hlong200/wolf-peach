import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        try {
            const [{ data: profileData, error: profileError }, { data: goalsData, error: goalsError }] = await Promise.all([
                supabase.from('user_profiles').select('*').eq('id', user.id).single(),
                supabase.from('user_goals').select('goal').eq('user_id', user.id),
            ]);
            if (profileError) throw profileError;
            if (goalsError) throw goalsError;
            setProfile(profileData);
            setGoals(goalsData.map(g => g.goal));
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const updateProfile = async (updates) => {
        const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id);
        if (error) throw error;
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const updateGoals = async (newGoals) => {
        await supabase.from('user_goals').delete().eq('user_id', user.id);
        if (newGoals.length > 0) {
            const { error } = await supabase.from('user_goals').insert(
                newGoals.map(goal => ({ user_id: user.id, goal }))
            );
            if (error) throw error;
        }
        setGoals(newGoals);
    };

    return { profile, goals, loading, error, updateProfile, updateGoals, refetch: fetchProfile };
}
