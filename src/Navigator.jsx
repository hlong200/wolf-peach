import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { LinkContainer } from 'react-router-bootstrap';
import './Navigator.css';

function Navigator() {
    return (
        <>
            <Navbar bg="primary" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand href="/">Wolf Peach</Navbar.Brand>
                    <Nav className="me-auto">
                        <LinkContainer to="/wolf-peach">
                            <Nav.Link>Catalog</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/garden">
                            <Nav.Link>My Garden</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="companion">
                            <Nav.Link>Companion Planting</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/seasons">
                            <Nav.Link>Seasonal Calendar</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Container>
            </Navbar>
        </>
    );
}

export default Navigator;