import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    useEffect(() => {
        // Listener must be registered before getSession() so PASSWORD_RECOVERY
        // isn't missed if supabase-js processes the URL before React mounts.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
            if (event === 'USER_UPDATED')      setIsPasswordRecovery(false);
            if (event === 'SIGNED_OUT')        setIsPasswordRecovery(false);
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // Fallback: supabase-js may have already consumed the recovery token
            // from the URL hash before our listener registered. Detect it here.
            if (session && window.location.hash.includes('type=recovery')) {
                setIsPasswordRecovery(true);
                // Remove the token fragment so a page refresh doesn't re-trigger it
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = () => supabase.auth.signOut();
    const clearRecovery = () => setIsPasswordRecovery(false);

    return (
        <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, isPasswordRecovery, clearRecovery }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
