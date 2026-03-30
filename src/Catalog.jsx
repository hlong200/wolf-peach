import { ListGroup } from "react-bootstrap";
import { useVegetableList } from "./lib/customHooks";
import PlantCard from "./PlantCard";

function Catalog() {
    const {data, loading, error} = useVegetableList();

    if(loading) return <p>Loading...</p>;
    if(error) return <p>Something went wrong.</p>;

    return (
        <>
            <ListGroup variant='flush'>
                {
                    data.map(veggie => (
                        <ListGroup.Item key={veggie.id}>

                            <PlantCard plant={veggie} />
                            
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    )
};

export default Catalog;