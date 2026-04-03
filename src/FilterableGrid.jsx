import { Container, Row, Col } from "react-bootstrap";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import AlphabetScrubber from "./AlphabetScrubber";
import { useFilters } from "./lib/FilterProvider";
import { useIsMobile, useColumnCount } from "./lib/customHooks";

const DIFF_ORDER = ['easy', 'moderate', 'hard'];

function groupByFirstLetter(plants) {
    return plants.reduce((acc, plant) => {
        const letter = plant.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(plant);
        return acc;
    }, {});
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

    const grouped = groupByFirstLetter(filtered);
    const letters = Object.keys(grouped).sort();

    return (
        <>
            {!isMobile && <FilterBar />}

            <Container className={isMobile ? 'pb-5 mb-4 pe-5' : ''}>
                {letters.map(letter => (
                    <div key={letter} id={`section-${letter}`} className="catalog-section">
                        <div className={`section-header ${!isMobile ? 'section-header-sticky' : ''}`}>
                            {letter}
                        </div>

                        {isMobile ? (
                            <Row xs={1} sm={2} className="g-3">
                                {grouped[letter].map(plant => (
                                    <Col key={plant.id}>
                                        <PlantCard plant={plant} />
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div className="masonry-grid">
                                {splitIntoColumns(grouped[letter], colCount).map((col, ci) => (
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
                    <AlphabetScrubber availableLetters={letters} />
                    <FilterBar compact />
                </>
            )}
        </>
    );
}
