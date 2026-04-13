import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { supabase } from './lib/supabase';
import { ICONS } from './lib/plantIcons';

const EVENT_TYPES = [
    { value: 'sowed',        label: 'Sowed',        icon: '🌰' },
    { value: 'germinated',   label: 'Germinated',   icon: '🌱' },
    { value: 'transplanted', label: 'Transplanted', icon: '🪴' },
    { value: 'harvested',    label: 'Harvested',    icon: '🧺' },
    { value: 'issue',        label: 'Issue',        icon: '⚠️' },
    { value: 'observation',  label: 'Observation',  icon: '👁️' },
];

const UNITS = ['seeds', 'plants', 'lbs', 'kg', 'oz', 'g', 'cups', 'bunches'];

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

export default function LogEventModal({ show, onHide, onSave, defaultPlant }) {
    const [plantQuery, setPlantQuery]       = useState('');
    const [plantResults, setPlantResults]   = useState([]);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [showResults, setShowResults]     = useState(false);

    const [eventType, setEventType] = useState('sowed');
    const [loggedAt, setLoggedAt]   = useState(todayISO());
    const [location, setLocation]   = useState('');
    const [quantity, setQuantity]   = useState('');
    const [unit, setUnit]           = useState('');
    const [body, setBody]           = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    useEffect(() => {
        if (!show) return;
        setError(null);
        setSaving(false);
        setBody('');
        setQuantity('');
        setUnit('');
        setLocation('');
        setEventType('sowed');
        setLoggedAt(todayISO());
        if (defaultPlant) {
            setSelectedPlant(defaultPlant);
            setPlantQuery(defaultPlant.name);
        } else {
            setSelectedPlant(null);
            setPlantQuery('');
        }
        setPlantResults([]);
        setShowResults(false);
    }, [show, defaultPlant]);

    // Debounced catalog search
    useEffect(() => {
        if (!plantQuery.trim() || selectedPlant) { setPlantResults([]); return; }
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from('catalog')
                .select('id, name, culinary_type')
                .ilike('name', `%${plantQuery}%`)
                .limit(8);
            setPlantResults(data ?? []);
            setShowResults(true);
        }, 200);
        return () => clearTimeout(timer);
    }, [plantQuery, selectedPlant]);

    const selectPlant = (plant) => {
        setSelectedPlant(plant);
        setPlantQuery(plant.name);
        setPlantResults([]);
        setShowResults(false);
    };

    const clearPlant = () => {
        setSelectedPlant(null);
        setPlantQuery('');
        setPlantResults([]);
    };

    const handleSave = async () => {
        if (!selectedPlant) { setError('Please select a plant.'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave({
                plant_id:   selectedPlant.id,
                event_type: eventType,
                logged_at:  new Date(loggedAt).toISOString(),
                location:   location || null,
                quantity:   quantity ? Number(quantity) : null,
                unit:       unit || null,
                body:       body || null,
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
                <Modal.Title>Log Event</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}

                {/* Plant search */}
                <Form.Group className="mb-3">
                    <Form.Label>Plant</Form.Label>
                    <div className="plant-search-wrap">
                        <Form.Control
                            type="text"
                            placeholder="Search catalog..."
                            value={plantQuery}
                            onChange={e => { setPlantQuery(e.target.value); setSelectedPlant(null); }}
                            onFocus={() => plantResults.length > 0 && setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 150)}
                            autoComplete="off"
                        />
                        {selectedPlant && (
                            <button className="plant-search-clear" onClick={clearPlant} type="button" aria-label="Clear">&times;</button>
                        )}
                        {showResults && plantResults.length > 0 && (
                            <ul className="plant-search-results">
                                {plantResults.map(p => (
                                    <li key={p.id} onMouseDown={() => selectPlant(p)}>
                                        <span className="plant-search-icon">{ICONS[p.culinary_type] ?? '🌱'}</span>
                                        <span className="plant-search-name">{p.name}</span>
                                        <span className="plant-search-type">{p.culinary_type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Form.Group>

                {/* Event type grid */}
                <Form.Group className="mb-3">
                    <Form.Label>Event</Form.Label>
                    <div className="event-type-grid">
                        {EVENT_TYPES.map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                className={`event-type-btn${eventType === value ? ' event-type-btn-active' : ''}`}
                                onClick={() => setEventType(value)}
                            >
                                <span className="event-type-icon">{icon}</span>
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </Form.Group>

                {/* Date */}
                <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                        type="date"
                        value={loggedAt}
                        onChange={e => setLoggedAt(e.target.value)}
                    />
                </Form.Group>

                {/* Location */}
                <Form.Group className="mb-3">
                    <Form.Label>Location <span className="text-muted fw-normal small">(optional)</span></Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="e.g. Back bed, left corner"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    />
                </Form.Group>

                {/* Quantity + unit */}
                <Row className="mb-3">
                    <Col xs={6}>
                        <Form.Group>
                            <Form.Label>Quantity <span className="text-muted fw-normal small">(optional)</span></Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                step="any"
                                placeholder="0"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs={6}>
                        <Form.Group>
                            <Form.Label>Unit</Form.Label>
                            <Form.Select value={unit} onChange={e => setUnit(e.target.value)}>
                                <option value="">—</option>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {/* Notes */}
                <Form.Group>
                    <Form.Label>Notes <span className="text-muted fw-normal small">(optional)</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Brief objective observation..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || !selectedPlant}>
                    {saving ? 'Saving...' : 'Save Log'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
