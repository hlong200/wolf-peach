import { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
    const [sunFilter, setSunFilter] = useState(null);
    const [difficultyFilter, setDifficultyFilter] = useState(null);
    const [seasonFilter, setSeasonFilter] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [textFilter, setTextFilter] = useState('');

    return (
        <FilterContext.Provider value={{
            sunFilter, setSunFilter,
            difficultyFilter, setDifficultyFilter,
            seasonFilter, setSeasonFilter,
            sortBy, setSortBy,
            sortOrder, setSortOrder,
            textFilter, setTextFilter
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export function useFilters() {
    return useContext(FilterContext);
};