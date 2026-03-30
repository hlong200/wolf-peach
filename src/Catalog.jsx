import { Container, Row, Col } from "react-bootstrap";
import { useVegetableList } from "./lib/customHooks";
import PlantCard from "./PlantCard";
import FilterBar from "./FilterBar";
import { useState } from "react";

function Catalog() {
    const {data, loading, error} = useVegetableList();
    const [sunFilter, setSunFilter] = useState(null);
    const [difficultyFilter, setDifficultyFilter] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [textFilter, setTextFilter] = useState('');

    if(loading) return <p>Loading...</p>;
    if(error) return <p>Something went wrong.</p>;

    return (
        <>
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
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {data
                    .filter(element => {
                        return (
                            element.name?.toLowerCase().includes(textFilter.toLowerCase())
                            || element.culinary_type?.toLowerCase().includes(textFilter.toLowerCase())
                        )
                    })
                    .filter(element => {
                        return difficultyFilter === null ? true : element.difficulty === difficultyFilter
                    })
                    .filter(element => {
                        return sunFilter === null ? true : element.sun === sunFilter
                    })
                    .sort((a, b) => {
                        if(sortBy === 'name') {
                            return a.name > b.name;
                        } else if(sortBy === 'days') {
                            return a.days > b.days;
                        } else if(sortBy === 'difficulty') {
                            if(a.difficulty === b.difficulty) {
                                return false;
                            } else if(a.difficulty === 'easy' && b.difficulty === 'moderate') {
                                return false;
                            } else if(a.difficulty === 'easy' && b.difficulty === 'hard') {
                                return false;
                            } else if(a.difficulty === 'moderate' && b.difficulty === 'hard') {
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return false;
                        }
                    })
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