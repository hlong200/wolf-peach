import { Container, Row, Col } from "react-bootstrap";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import './FilterableGrid.css';
import AlphabetScrubber from "./AlphabetScrubber";
import { useFilters } from "./lib/FilterProvider";
import { useIsMobile, useColumnCount } from "./lib/customHooks";
import { useFilteredPlants } from "./lib/useFilteredPlants";

const DIFF_ORDER = ['easy', 'moderate', 'hard'];

// Groups days into 5-day bucket labels for section headers (e.g. "30 – 34 days")
function getDaysLabel(days) {
    const start = Math.floor(days / 5) * 5;
    return `${start} – ${start + 4} days`;
}

// Parses the numeric start of a bucket label so we can sort them numerically
function parseDaysBucketStart(label) {
    return parseInt(label, 10);
}

// Groups a flat plant list into an object keyed by section header
function groupPlants(plants, sortBy) {
    return plants.reduce((acc, plant) => {
        let key;
        if (sortBy === 'name')            key = plant.name[0].toUpperCase();
        else if (sortBy === 'difficulty') key = plant.difficulty;
        else if (sortBy === 'days')       key = getDaysLabel(plant.days_to_maturity);
        if (!acc[key]) acc[key] = [];
        acc[key].push(plant);
        return acc;
    }, {});
}

// Sorts section header keys respecting each sort mode's natural ordering
function sortKeys(keys, sortBy, sortOrder) {
    if (sortBy === 'name') {
        return [...keys].sort((a, b) =>
            sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        );
    }
    if (sortBy === 'difficulty') {
        const order = sortOrder === 'asc' ? DIFF_ORDER : [...DIFF_ORDER].reverse();
        return [...keys].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    if (sortBy === 'days') {
        return [...keys].sort((a, b) => {
            const cmp = parseDaysBucketStart(a) - parseDaysBucketStart(b);
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }
    return keys;
}

function formatHeader(key, sortBy) {
    if (sortBy === 'difficulty') return key[0].toUpperCase() + key.slice(1);
    return key;
}

// Produces a DOM-safe id for alphabet scrubber scroll targets
function sectionId(key) {
    return `section-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

// Optional `ids` prop scopes the grid to a subset of plants (used by My Garden)
export default function FilterableGrid({ ids } = {}) {
    const { sortBy, sortOrder } = useFilters();
    const { data, loading, error } = useFilteredPlants({ ids });
    const isMobile = useIsMobile();
    // colCount is passed as a CSS variable so grid columns are responsive without media queries
    const colCount = useColumnCount();

    const grouped = groupPlants(data, sortBy);
    const keys = sortKeys(Object.keys(grouped), sortBy, sortOrder);

    return (
        <>
            {/* FilterBar is always mounted to preserve text input focus across re-renders;
                compact (mobile) version portals itself to document.body */}
            {!isMobile && <FilterBar />}

            {/* pe-5 on mobile reserves space for the fixed alphabet scrubber on the right */}
            <Container className={isMobile ? 'pb-5 mb-4 pe-5' : ''}>
                {error   && <p>Something went wrong.</p>}
                {loading && <p className="text-muted">Loading...</p>}
                {!loading && !error && keys.map(key => (
                    <div key={key} id={sectionId(key)} className="catalog-section">
                        <div className={`section-header ${!isMobile ? 'section-header-sticky' : ''}`}>
                            {formatHeader(key, sortBy)}
                        </div>

                        {isMobile ? (
                            // Mobile: simple Bootstrap responsive grid, no tilts
                            <Row xs={1} sm={2} className="g-3">
                                {grouped[key].map(plant => (
                                    <Col key={plant.id}>
                                        <PlantCard plant={plant} />
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            // Desktop: CSS Grid with equal row heights and slight card tilts.
                            // --col-count drives grid-template-columns in CSS.
                            <div className="masonry-grid" style={{ '--col-count': colCount }}>
                                {grouped[key].map(plant => (
                                    <div key={plant.id} className="masonry-item">
                                        <PlantCard plant={plant} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </Container>

            {isMobile && (
                <>
                    {sortBy === 'name' && <AlphabetScrubber availableLetters={keys} />}
                    <FilterBar compact />
                </>
            )}
        </>
    );
}
