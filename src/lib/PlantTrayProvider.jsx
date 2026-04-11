import { createContext, useContext, useState, useCallback, useRef } from 'react';

const PlantTrayContext = createContext(null);

export function PlantTrayProvider({ children }) {
    const [trayPlants, setTrayPlants] = useState([]); // [{ id, name, culinary_type }]
    const [lastAdded, setLastAdded] = useState(null);  // id, cleared after 600ms
    const lastAddedTimerRef = useRef(null);

    const addToTray = useCallback((id, name, culinaryType) => {
        setTrayPlants(prev => {
            if (prev.some(p => p.id === id)) return prev;
            return [...prev, { id, name, culinary_type: culinaryType }];
        });
        clearTimeout(lastAddedTimerRef.current);
        setLastAdded(id);
        lastAddedTimerRef.current = setTimeout(() => setLastAdded(null), 600);
    }, []);

    const removeFromTray = useCallback((id) => {
        setTrayPlants(prev => prev.filter(p => p.id !== id));
    }, []);

    const clearTray = useCallback(() => setTrayPlants([]), []);

    return (
        <PlantTrayContext.Provider value={{ trayPlants, addToTray, removeFromTray, clearTray, lastAdded }}>
            {children}
        </PlantTrayContext.Provider>
    );
}

export function usePlantTray() {
    return useContext(PlantTrayContext);
}
