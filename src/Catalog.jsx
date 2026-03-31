import { Container, Row, Col } from "react-bootstrap";
import { useIsMobile, useVegetableList } from "./lib/customHooks";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import { useState } from "react";

function Catalog() {
    const {data, loading, error} = useVegetableList();

    // Move these states to context hook FilterProvider?
    const [sunFilter, setSunFilter] = useState(null);
    const [difficultyFilter, setDifficultyFilter] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [textFilter, setTextFilter] = useState('');

    if(loading) return <p>Loading...</p>;
    if(error) return <p>Something went wrong.</p>;

    const DIFF_ORDER = ['easy', 'moderate', 'hard'];

    return (
        <>
            { /* 
                Might want to make a context hook to not have to pass so many props making FilterBar more modular
                TODO: Add conditional rendering for mobile
            */ }
            <FilterBar
                textFilter={textFilter}
                setTextFilter={setTextFilter}
                sunFilter={sunFilter}
                setSunFilter={setSunFilter}
                difficultyFilter={difficultyFilter}
                setDifficultyFilter={setDifficultyFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            <Container>
                { /* Catalog grid displaying different number of columns based on screen size */ }
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {
                    [...data]
                    .filter(element => {
                        return (
                            element.name?.toLowerCase().includes(textFilter.toLowerCase())
                            || element.culinary_type?.toLowerCase().includes(textFilter.toLowerCase())
                            || element.species?.toLowerCase().includes(textFilter.toLowerCase())
                        )
                    })
                    // Checks if filtering on difficulty; if so, return true if the filtered difficulty matches the plant's difficulty
                    .filter(element => {
                        return difficultyFilter === null ? true : element.difficulty === difficultyFilter
                    })
                    // Sun filter
                    .filter(element => {
                        return sunFilter === null ? true : element.sun === sunFilter
                    })
                    // Sort based on the selected sorting variable
                    .sort((a, b) => {
                        if(sortBy === 'name') {
                            return a.name.localeCompare(b.name);
                        }
                        if(sortBy === 'days') {
                            return a.days_to_maturity - b.days_to_maturity;
                        }
                        if(sortBy === 'difficulty') {
                            return DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty);
                        }
                        return 0;
                    })
                    // Render filtered, sorted list of plant cards
                    .map(veggie => (
                        <Col key={veggie.id}>
                            <PlantCard plant={veggie} />
                        </Col>
                    ))}
                </Row>
            </Container>
        </>
    )
};

export default Catalog;