// Provides filtering capabilities (same as catalog page)
import { FilterProvider } from "./lib/FilterProvider";

// Hook to access user's favorite plants (their saved garden)
import { useFavorites } from "./lib/FavoritesProvider";

// Reuse the same grid component to display plants
import FilterableGrid from "./FilterableGrid";

// React Bootstrap layout components
import { Container } from "react-bootstrap";

/**
 * Inner component that handles the logic of displaying the user's garden
 */
function MyGardenInner() {
  // Get list of favorite plant IDs
  const { favorites } = useFavorites();

  // If no plants saved, show message
  if (favorites.length === 0) {
    return (
      <p className="text-center mt-5 text-muted">
        No plants in your garden yet — star some from the Catalog!
      </p>
    );
  }

  // Otherwise, display only favorite plants using the grid
  return <FilterableGrid ids={favorites} />;
}

/**
 * Main Garden Page Component
 */
export default function MyGarden() {
  return (
    // Wrap with FilterProvider (needed because FilterableGrid depends on it)
    <FilterProvider>
      <>
        {/* Page header / intro */}
        <section className="py-5 text-center">
          <Container>
            <h1 className="fw-bold">My Garden</h1>
            <p className="text-muted">
              View and manage the plants you’ve saved.
            </p>
          </Container>
        </section>

        {/* Garden content (favorites list or empty state) */}
        <section className="py-4">
          <Container>
            <MyGardenInner />
          </Container>
        </section>
      </>
    </FilterProvider>
  );
}
