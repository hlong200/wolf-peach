import { Container, Row, Col } from "react-bootstrap";
import { useVegetableList } from "./lib/customHooks";
import PlantCard from "./PlantCard";

function Catalog() {
    const {data, loading, error} = useVegetableList();

    if(loading) return <p>Loading...</p>;
    if(error) return <p>Something went wrong.</p>;

    return (
        <>
            <Container>
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {data.map(veggie => (
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