import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { LinkContainer } from 'react-router-bootstrap';
import './Navigator.css';

function Navigator() {
    return (
        <Navbar bg="primary" data-bs-theme="dark" expand="md">
            <Container>
                <Navbar.Toggle aria-controls="main-nav" />
                <Navbar.Brand href="/">Wolf Peach</Navbar.Brand>
                <Navbar.Collapse id="main-nav">
                    <Nav>
                        <LinkContainer to="/wolf-peach">
                            <Nav.Link>Catalog</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/garden">
                            <Nav.Link>My Garden</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/companion">
                            <Nav.Link>Companion Planting</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/seasons">
                            <Nav.Link>Seasonal Calendar</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Navigator;
