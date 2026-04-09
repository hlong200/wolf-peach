import { useRef, useLayoutEffect, useMemo } from "react";
import { Row, Col } from "react-bootstrap";
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

// Sets min-height directly on each .plant-card to match the tallest card in its row.
// Targets the card element (not the grid cell) because height:100% on a child only
// resolves when the parent has an explicit height — min-height alone isn't enough.
// Runs synchronously before paint so there's no visible layout jump.
// align-items:start on the grid lets accordions expand freely beyond min-height
// without stretching sibling cards.
function equalizeRows(gridEl) {
    if (!gridEl) return;
    const items = Array.from(gridEl.children);

    // Reset min-heights on the cards themselves
    items.forEach(el => {
        const card = el.querySelector('.plant-card');
        if (card) card.style.minHeight = '';
    });

    // Group cells by their vertical position to identify rows
    const rows = new Map();
    items.forEach(el => {
        const top = Math.round(el.getBoundingClientRect().top);
        if (!rows.has(top)) rows.set(top, []);
        rows.get(top).push(el);
    });

    // Apply the tallest card's height as min-height on every card in the row
    rows.forEach(row => {
        const max = Math.max(...row.map(el => el.getBoundingClientRect().height));
        row.forEach(el => {
            const card = el.querySelector('.plant-card');
            if (card) card.style.minHeight = `${max}px`;
        });
    });
}

// Optional `ids` prop scopes the grid to a subset of plants (used by My Garden)
export default function FilterableGrid({ ids } = {}) {
    const { sortBy, sortOrder } = useFilters();
    const { data, loading, error } = useFilteredPlants({ ids });
    const isMobile = useIsMobile();
    // colCount is passed as a CSS variable so grid columns are responsive without media queries
    const colCount = useColumnCount();

    const grouped = useMemo(() => groupPlants(data, sortBy), [data, sortBy]);
    const keys = useMemo(() => sortKeys(Object.keys(grouped), sortBy, sortOrder), [grouped, sortBy, sortOrder]);

    // Re-equalize row heights whenever data, sort, or column count changes
    const gridRefs = useRef({});
    useLayoutEffect(() => {
        Object.values(gridRefs.current).forEach(equalizeRows);
    }, [data, sortBy, sortOrder, colCount]);

    return (
        <>
            {/* FilterBar is always mounted to preserve text input focus across re-renders;
                compact (mobile) version portals itself to document.body */}
            {!isMobile && <FilterBar />}

            {/* pe-5 on mobile reserves space for the fixed alphabet scrubber on the right */}
            {/* pe-5 always reserves right clearance for the FAB (right:24px, width:48px = 72px from edge).
                pb-5/mb-4 only on mobile reserves bottom clearance for the compact FilterBar. */}
            <div className={`pe-5${isMobile ? ' pb-5 mb-4' : ''}`}>
                {error   && <p>Something went wrong.</p>}
                {loading && <p className="text-muted">Loading...</p>}
                {!loading && !error && keys.map(key => (
                    <div key={key} id={sectionId(key)} className="catalog-section">
                        <div className={`section-header ${!isMobile ? 'section-header-sticky' : ''}`}>
                            {formatHeader(key, sortBy)}
                        </div>

                        {isMobile ? (
                            // Mobile: simple Bootstrap responsive grid, no tilts
                            // mx-0 removes Row's default negative gutter margins to prevent overflow
                            <Row xs={1} sm={2} className="g-3 mx-0">
                                {grouped[key].map(plant => (
                                    <Col key={plant.id}>
                                        <PlantCard plant={plant} />
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            // Desktop: CSS Grid with align-items:start so accordion expansion
                            // only grows the one card. JS equalizeRows sets min-height per row
                            // to match the tallest closed card.
                            <div
                                className="masonry-grid"
                                style={{ '--col-count': colCount }}
                                ref={el => gridRefs.current[key] = el}
                            >
                                {grouped[key].map(plant => (
                                    <div key={plant.id} className="masonry-item">
                                        <PlantCard plant={plant} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isMobile && (
                <>
                    {sortBy === 'name' && <AlphabetScrubber availableLetters={keys} />}
                    <FilterBar compact />
                </>
            )}
        </>
    );
}
