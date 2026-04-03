import { useVegetableList } from "./lib/customHooks";
import { FilterProvider } from "./lib/FilterProvider";
import FilterableGrid from "./FilterableGrid";

function CatalogInner() {
    const { data, loading, error } = useVegetableList();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;

    return <FilterableGrid plants={data} />;
}

export default function Catalog() {
    return (
        <FilterProvider>
            <CatalogInner />
        </FilterProvider>
    );
}
