import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from './lib/supabase';

// onSuccess is called after a successful sign-in/sign-up instead of onHide,
// so callers that manage their own visibility (e.g. RequireAuth) can let
// auth state drive the UI update rather than closing the modal explicitly.
export default function LoginModal({ show, onHide, onSuccess }) {
    const [mode, setMode] = useState('signin');   // 'signin' | 'signup' | 'reset'
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

        if (mode === 'reset') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            setLoading(false);
            if (error) setError(error.message);
            else setMessage('Check your email for a password reset link.');
            return;
        }

        const result = mode === 'signin'
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        setLoading(false);

        if (result.error) {
            setError(result.error.message);
        } else if (mode === 'signup' && !result.data.session) {
            setMessage('Check your email to confirm your account.');
        } else {
            reset();
            onSuccess ? onSuccess() : onHide();
        }
    };

    const title = { signin: 'Sign in', signup: 'Create account', reset: 'Reset password' }[mode];

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
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

                    {mode !== 'reset' && (
                        <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between align-items-baseline">
                                <Form.Label className="mb-0">Password</Form.Label>
                                {mode === 'signin' && (
                                    <a
                                        href="#"
                                        className="small"
                                        onClick={e => { e.preventDefault(); switchMode('reset'); }}
                                    >
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </Form.Group>
                    )}

                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                        {loading
                            ? 'Please wait…'
                            : mode === 'signin' ? 'Sign in'
                            : mode === 'signup' ? 'Create account'
                            : 'Send reset link'}
                    </Button>
                </Form>
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                {mode === 'signin' && (
                    <small>No account? <a href="#" onClick={e => { e.preventDefault(); switchMode('signup'); }}>Sign up</a></small>
                )}
                {mode === 'signup' && (
                    <small>Have an account? <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }}>Sign in</a></small>
                )}
                {mode === 'reset' && (
                    <small>Back to <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }}>Sign in</a></small>
                )}
            </Modal.Footer>
        </Modal>
    );
}
