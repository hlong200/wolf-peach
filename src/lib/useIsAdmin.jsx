import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

export function useIsAdmin() {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { setIsAdmin(false); setLoading(false); return; }
        supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                setIsAdmin(data?.is_admin ?? false);
                setLoading(false);
            });
    }, [user]);

    return { isAdmin, loading };
}
