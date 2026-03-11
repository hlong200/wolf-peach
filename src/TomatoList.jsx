import { ListGroup, Card } from "react-bootstrap"
import { useTomatoList } from "./lib/customHooks"

function TomatoList() {
    const {data, loading, error} = useTomatoList()

    if(loading) return <p>Loading...</p>
    if(error) return <p>Something went wrong.</p>

    return (
        <>
            <ListGroup variant='flush'>
                {
                    data.map(tomato => (
                        <ListGroup.Item key={tomato.id}>
                            <Card style={{ width: '18rem' }}>
                                <Card.Body>
                                    <Card.Title>{tomato.name}</Card.Title>
                                    <Card.Subtitle className='mb-2 text-muted'>{tomato.id}</Card.Subtitle>
                                    <Card.Text>
                                        The {tomato.name} takes {tomato.days_to_maturity} days to mature, is {tomato.type} type, and is the color {tomato.color}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </ListGroup.Item>
                    ))
                }
            </ListGroup>
        </>
    )
}
export default TomatoList