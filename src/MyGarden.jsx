import { FilterProvider } from "./lib/FilterProvider";
import { useFavorites } from "./lib/FavoritesProvider";
import { useVegetableList } from "./lib/customHooks";
import FilterableGrid from "./FilterableGrid";

function MyGardenInner() {
    const { data, loading, error } = useVegetableList();
    const { favorites } = useFavorites();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Something went wrong.</p>;

    const favoritedPlants = data.filter(p => favorites.includes(p.id));

    if (favoritedPlants.length === 0) {
        return (
            <p className="text-center mt-5 text-muted">
                No plants in your garden yet — star some from the Catalog!
            </p>
        );
    }

    return <FilterableGrid plants={favoritedPlants} />;
}

export default function MyGarden() {
    return (
        <FilterProvider>
            <MyGardenInner />
        </FilterProvider>
    );
}
