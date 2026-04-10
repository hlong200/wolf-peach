import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthProvider';

const STORAGE_KEY = 'wolf-peach:favorites';

function readStorage() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
        return [];
    }
}

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [deferRemovals, setDeferRemovals] = useState(false);
    const [pendingRemoval, setPendingRemoval] = useState(null); // { id, name }
    const pendingTimerRef = useRef(null);

    // Load favorites whenever auth state changes
    useEffect(() => {
        if (user) {
            supabase
                .from('user_plants')
                .select('plant_id')
                .then(({ data }) => {
                    if (data) setFavorites(data.map(r => r.plant_id));
                });
        } else {
            setFavorites(readStorage());
        }
    }, [user]);

    const doDelete = useCallback(async (id) => {
        if (user) {
            await supabase.from('user_plants').delete().eq('plant_id', id);
        } else {
            setFavorites(prev => {
                const next = prev.filter(f => f !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                return next;
            });
        }
    }, [user]);

    const commitPendingRemoval = useCallback(() => {
        if (!pendingRemoval) return;
        clearTimeout(pendingTimerRef.current);
        doDelete(pendingRemoval.id);
        setPendingRemoval(null);
    }, [pendingRemoval, doDelete]);

    const undoRemoval = useCallback(() => {
        if (!pendingRemoval) return;
        clearTimeout(pendingTimerRef.current);
        setFavorites(prev => [...prev, pendingRemoval.id]);
        setPendingRemoval(null);
    }, [pendingRemoval]);

    const toggleFavorite = useCallback(async (id, name) => {
        const isFav = favorites.includes(id);

        // If removing while in defer mode, optimistically remove and schedule the delete
        if (isFav && deferRemovals) {
            // Commit any existing pending removal before starting a new one
            if (pendingRemoval) {
                clearTimeout(pendingTimerRef.current);
                doDelete(pendingRemoval.id);
            }
            setFavorites(prev => prev.filter(f => f !== id));
            setPendingRemoval({ id, name });
            pendingTimerRef.current = setTimeout(() => {
                doDelete(id);
                setPendingRemoval(null);
            }, 5000);
            return;
        }

        if (user) {
            if (isFav) {
                await supabase.from('user_plants').delete().eq('plant_id', id);
            } else {
                await supabase.from('user_plants').insert({ user_id: user.id, plant_id: id });
            }
            setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
        } else {
            setFavorites(prev => {
                const next = prev.includes(id)
                    ? prev.filter(f => f !== id)
                    : [...prev, id];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                return next;
            });
        }
    }, [user, favorites, deferRemovals, pendingRemoval, doDelete]);

    return (
        <FavoritesContext.Provider value={{
            favorites, toggleFavorite,
            deferRemovals, setDeferRemovals,
            pendingRemoval, undoRemoval, commitPendingRemoval,
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}
