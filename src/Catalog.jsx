// React Bootstrap components used for layout and buttons
import { Container, Row, Col, Button } from 'react-bootstrap';

// FilterProvider gives access to the filtering system for the plant catalog
import { FilterProvider } from "./lib/FilterProvider";

// FilterableGrid is the existing component that displays the filtered plant cards
import FilterableGrid from "./FilterableGrid";

export default function Catalog() {
  return (
    // Wrap the whole catalog page in FilterProvider
    // so any child component that needs filter state can access it
    <FilterProvider>
      <>
        {/* Hero / intro section at the top of the catalog page */}
        <section className="py-5">
          <Container>
            <Row className="align-items-center">
              
              {/* Left column: main heading, short description, and action buttons */}
              <Col md={7}>
                <h1 className="display-4 fw-bold">Wolf Peach Garden Guidebook</h1>
                <p className="lead">
                  Explore vegetables, plan your garden, and grow with confidence.
                </p>

                {/* Buttons for future actions/navigation */}
                <div className="d-flex gap-3">
                  <Button variant="primary">Browse Plants</Button>
                  <Button variant="outline-secondary">Learn More</Button>
                </div>
              </Col>

              {/* Right column: placeholder card for quick information or highlights */}
              <Col md={5}>
                <div className="p-4 border rounded bg-light text-center">
                  <h4>Quick Stats</h4>
                  <p className="mb-1">Sunlight</p>
                  <p className="mb-1">Water Needs</p>
                  <p className="mb-0">Growing Season</p>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Main catalog section */}
        <section className="py-4">
          <Container>
            <h2 className="mb-4">Plant Catalog</h2>

            {/* Existing plant grid component stays here */}
            {/* It will display plants and still use the filter system */}
            <FilterableGrid />
          </Container>
        </section>
      </>
    </FilterProvider>
  );
}
