import { Container, Row, Col } from "react-bootstrap";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import AlphabetScrubber from "./AlphabetScrubber";
import { useFilters } from "./lib/FilterProvider";
import { useIsMobile, useColumnCount } from "./lib/customHooks";

const DIFF_ORDER = ['easy', 'moderate', 'hard'];

function getDaysLabel(days) {
    const start = Math.floor(days / 5) * 5;
    return `${start} – ${start + 4} days`;
}

function parseDaysBucketStart(label) {
    return parseInt(label, 10);
}

function groupPlants(plants, sortBy) {
    return plants.reduce((acc, plant) => {
        let key;
        if (sortBy === 'name')       key = plant.name[0].toUpperCase();
        else if (sortBy === 'difficulty') key = plant.difficulty;
        else if (sortBy === 'days')  key = getDaysLabel(plant.days_to_maturity);
        if (!acc[key]) acc[key] = [];
        acc[key].push(plant);
        return acc;
    }, {});
}

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

function sectionId(key) {
    return `section-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

function splitIntoColumns(items, colCount) {
    const cols = Array.from({ length: colCount }, () => []);
    items.forEach((item, i) => cols[i % colCount].push(item));
    return cols;
}

export default function FilterableGrid({ plants }) {
    const { sunFilter, difficultyFilter, sortBy, sortOrder, textFilter } = useFilters();
    const isMobile = useIsMobile();
    const colCount = useColumnCount();

    const filtered = [...plants]
        .filter(p =>
            p.name?.toLowerCase().includes(textFilter.toLowerCase())
            || p.culinary_type?.toLowerCase().includes(textFilter.toLowerCase())
            || p.species?.toLowerCase().includes(textFilter.toLowerCase())
            || p.tags.some(t => t?.includes(textFilter.toLowerCase()))
        )
        .filter(p => difficultyFilter === null || p.difficulty === difficultyFilter)
        .filter(p => sunFilter === null || p.sun === sunFilter)
        .sort((a, b) => {
            let cmp = 0;
            if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortBy === 'days') cmp = a.days_to_maturity - b.days_to_maturity;
            else if (sortBy === 'difficulty') cmp = DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty);
            return sortOrder === 'asc' ? cmp : -cmp;
        });

    const grouped = groupPlants(filtered, sortBy);
    const keys = sortKeys(Object.keys(grouped), sortBy, sortOrder);

    return (
        <>
            {!isMobile && <FilterBar />}

            <Container className={isMobile ? 'pb-5 mb-4 pe-5' : ''}>
                {keys.map(key => (
                    <div key={key} id={sectionId(key)} className="catalog-section">
                        <div className={`section-header ${!isMobile ? 'section-header-sticky' : ''}`}>
                            {formatHeader(key, sortBy)}
                        </div>

                        {isMobile ? (
                            <Row xs={1} sm={2} className="g-3">
                                {grouped[key].map(plant => (
                                    <Col key={plant.id}>
                                        <PlantCard plant={plant} />
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div className="masonry-grid">
                                {splitIntoColumns(grouped[key], colCount).map((col, ci) => (
                                    <div key={ci} className="masonry-col">
                                        {col.map(plant => (
                                            <div key={plant.id} className="masonry-item">
                                                <PlantCard plant={plant} />
                                            </div>
                                        ))}
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
