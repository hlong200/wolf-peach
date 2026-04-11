import { createContext, useContext, useState, useCallback } from 'react';

const DragStateContext = createContext(null);

export function DragStateProvider({ children }) {
    // null | { id, name, culinary_type, sourceRect }
    const [dragging, setDragging] = useState(null);
    const clearDragging = useCallback(() => setDragging(null), []);

    return (
        <DragStateContext.Provider value={{ dragging, setDragging, clearDragging }}>
            {children}
        </DragStateContext.Provider>
    );
}

export function useDragState() {
    return useContext(DragStateContext);
}
