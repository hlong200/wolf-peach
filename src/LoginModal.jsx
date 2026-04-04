import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from './lib/supabase';

export default function LoginModal({ show, onHide }) {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const reset = () => { setError(null); setMessage(null); setEmail(''); setPassword(''); };

    const switchMode = (m) => { setMode(m); reset(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        let result;
        if (mode === 'signin') {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }

        setLoading(false);

        if (result.error) {
            setError(result.error.message);
        } else if (mode === 'signup' && !result.data.session) {
            setMessage('Check your email to confirm your account.');
        } else {
            reset();
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{mode === 'signin' ? 'Sign in' : 'Create account'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error   && <Alert variant="danger"  className="py-2">{error}</Alert>}
                {message && <Alert variant="success" className="py-2">{message}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                        {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </Button>
                </Form>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                {mode === 'signin' ? (
                    <small>No account? <a href="#" onClick={e => { e.preventDefault(); switchMode('signup'); }}>Sign up</a></small>
                ) : (
                    <small>Have an account? <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }}>Sign in</a></small>
                )}
            </Modal.Footer>
        </Modal>
    );
}
