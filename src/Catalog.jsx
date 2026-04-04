import { FilterProvider } from "./lib/FilterProvider";
import FilterableGrid from "./FilterableGrid";

export default function Catalog() {
    return (
        <FilterProvider>
            <FilterableGrid />
        </FilterProvider>
    );
}
