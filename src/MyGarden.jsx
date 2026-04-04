import { FilterProvider } from "./lib/FilterProvider";
import { useFavorites } from "./lib/FavoritesProvider";
import FilterableGrid from "./FilterableGrid";

function MyGardenInner() {
    const { favorites } = useFavorites();

    if (favorites.length === 0) {
        return (
            <p className="text-center mt-5 text-muted">
                No plants in your garden yet — star some from the Catalog!
            </p>
        );
    }

    return <FilterableGrid ids={favorites} />;
}

export default function MyGarden() {
    return (
        <FilterProvider>
            <MyGardenInner />
        </FilterProvider>
    );
}
