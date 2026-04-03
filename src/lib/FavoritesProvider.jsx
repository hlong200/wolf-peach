import { createContext, useContext, useState, useCallback } from 'react';

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
    const [favorites, setFavorites] = useState(readStorage);

    const toggleFavorite = useCallback((id) => {
        setFavorites(prev => {
            const next = prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}
