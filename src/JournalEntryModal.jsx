import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { ICONS } from './lib/plantIcons';

export default function JournalEntryModal({ show, onHide, onSave, instances, defaultInstance }) {
    const [plantLogId, setPlantLogId] = useState('');
    const [title, setTitle]           = useState('');
    const [body, setBody]             = useState('');
    const [isPrivate, setIsPrivate]   = useState(true);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState(null);

    useEffect(() => {
        if (!show) return;
        setTitle('');
        setBody('');
        setIsPrivate(true);
        setError(null);
        setSaving(false);
        setPlantLogId(
            defaultInstance?.rootLogId ?? instances[0]?.rootLogId ?? ''
        );
    }, [show, defaultInstance, instances]);

    const handleSave = async () => {
        if (!body.trim())  { setError('Entry body is required.'); return; }
        if (!plantLogId)   { setError('Please select a plant.'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave({
                plant_log_id: plantLogId,
                title:        title.trim() || null,
                body:         body.trim(),
                is_private:   isPrivate,
            });
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Journal Entry</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Plant</Form.Label>
                    <Form.Select value={plantLogId} onChange={e => setPlantLogId(e.target.value)}>
                        <option value="">Select a plant...</option>
                        {instances.map(inst => (
                            <option key={inst.key} value={inst.rootLogId}>
                                {ICONS[inst.plant?.culinary_type] ?? '🌱'} {inst.plant?.name ?? 'Unknown'}
                                {inst.location ? ` — ${inst.location}` : ''}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Title <span className="text-muted fw-normal small">(optional)</span></Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="e.g. First flowers appeared"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Entry</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="What did you observe, feel, or notice about this plant today?"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                </Form.Group>

                <Form.Check
                    type="checkbox"
                    id="journal-private"
                    label="Keep private"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !plantLogId || !body.trim()}
                >
                    {saving ? 'Saving...' : 'Save Entry'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
