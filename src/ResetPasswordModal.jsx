import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from './lib/supabase';

export default function ResetPasswordModal({ onHide }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) setError(error.message);
        else onHide();
    };

    return (
        <Modal show onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Set new password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>New password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoFocus
                            minLength={8}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Confirm password</Form.Label>
                        <Form.Control
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            minLength={8}
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                        {loading ? 'Updating…' : 'Update password'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
