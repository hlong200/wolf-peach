import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from './lib/AuthProvider';
import LoginModal from './LoginModal';
import './Navigator.css';

function Navigator() {
    const { user, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    return (
        <>
            <Navbar bg="primary" data-bs-theme="dark" expand="md">
                <Container>
                    <Navbar.Toggle aria-controls="main-nav" />
                    <LinkContainer to="/"><Navbar.Brand>🍅 Wolf Peach</Navbar.Brand></LinkContainer>
                    <Navbar.Collapse id="main-nav">
                        <Nav className="me-auto">
                            <LinkContainer to="/catalog">
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
                        <Nav className="align-items-center gap-2">
                            {user ? (
                                <>
                                    <span className="nav-user-email">{user.email}</span>
                                    <Button size="sm" variant="outline-light" onClick={signOut}>
                                        Sign out
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline-light" onClick={() => setShowLogin(true)}>
                                    Sign in
                                </Button>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <LoginModal show={showLogin} onHide={() => setShowLogin(false)} />
        </>
    );
}

export default Navigator;
