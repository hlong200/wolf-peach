import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    const toggleFavorite = useCallback(async (id) => {
        if (user) {
            const isFav = favorites.includes(id);
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
    }, [user, favorites]);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}
