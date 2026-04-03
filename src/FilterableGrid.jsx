import { Container, Row, Col } from "react-bootstrap";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import { useFilters } from "./lib/FilterProvider";
import { useIsMobile } from "./lib/customHooks";

const DIFF_ORDER = ['easy', 'moderate', 'hard'];

export default function FilterableGrid({ plants }) {
    const { sunFilter, difficultyFilter, sortBy, sortOrder, textFilter } = useFilters();
    const isMobile = useIsMobile();

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

    return (
        <>
            {!isMobile && <FilterBar />}
            <Container className={isMobile ? 'pb-5 mb-4' : ''}>
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {filtered.map(plant => (
                        <Col key={plant.id}>
                            <PlantCard plant={plant} />
                        </Col>
                    ))}
                </Row>
            </Container>
            {isMobile && <FilterBar compact />}
        </>
    );
}
