// React Bootstrap components used for layout and buttons
import { Row, Col, Button } from 'react-bootstrap';

// FilterProvider gives access to the filtering system for the plant catalog
import { FilterProvider } from "./lib/FilterProvider";

// FilterableGrid is the existing component that displays the filtered plant cards
import FilterableGrid from "./FilterableGrid";
import './Catalog.css';

export default function Catalog() {
  return (
    // Wrap the whole catalog page in FilterProvider
    // so any child component that needs filter state can access it
    <FilterProvider>
      <>
        {/* Decorative botanical border — hidden on mobile */}
        <img src="/plant-left.png" className="catalog-plant-left" alt="" aria-hidden="true" />
        <img src="/plant-right.png" className="catalog-plant-right" alt="" aria-hidden="true" />
        {/* Hero / intro section — py-3 on mobile, py-5 on desktop */}
        <section className="py-3 py-md-5">
          <Row className="align-items-center mx-0 g-3">

            {/* Left column: heading scales down on mobile */}
            <Col md={7}>
              <h1 className="fs-2 fs-md-1 fw-bold">Wolf Peach Garden Guidebook</h1>
              <p className="lead">
                Explore vegetables, plan your garden, and grow with confidence.
              </p>

              {/* Buttons for future actions/navigation */}
              <div className="d-flex gap-3">
                <Button variant="primary">Browse Plants</Button>
                <Button variant="outline-secondary">Learn More</Button>
              </div>
            </Col>

            {/* Right column: hidden on mobile to keep the hero compact */}
            <Col md={5} className="d-none d-md-block">
              <div className="p-4 border rounded bg-light text-center">
                <h4>Quick Stats</h4>
                <p className="mb-1">Sunlight</p>
                <p className="mb-1">Water Needs</p>
                <p className="mb-0">Growing Season</p>
              </div>
            </Col>
          </Row>
        </section>

        {/* FilterableGrid manages its own layout internally */}
        <FilterableGrid />
      </>
    </FilterProvider>
  );
}
