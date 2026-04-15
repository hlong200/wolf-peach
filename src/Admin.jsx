import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Modal, Alert, Spinner } from 'react-bootstrap';
import { supabase } from './lib/supabase';

const fmt = s => s ? s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '—';

export default function Admin() {
    const navigate = useNavigate();
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // plant to confirm deletion
    const [deleting, setDeleting] = useState(false);

    async function fetchPlants() {
        setLoading(true);
        const { data, error } = await supabase
            .from('catalog')
            .select('id, name, culinary_type, species, difficulty, days_to_maturity, sun')
            .order('name');
        if (error) setError(error.message);
        else setPlants(data);
        setLoading(false);
    }

    useEffect(() => { fetchPlants(); }, []);

    async function handleDelete() {
        setDeleting(true);
        const { error } = await supabase.from('catalog').delete().eq('id', deleteTarget.id);
        setDeleting(false);
        setDeleteTarget(null);
        if (error) setError(error.message);
        else setPlants(prev => prev.filter(p => p.id !== deleteTarget.id));
    }

    return (
        <div className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Plant Catalog</h2>
                <Button variant="primary" size="sm" onClick={() => navigate('/admin/plant/new')}>
                    Add plant
                </Button>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
            ) : (
                <Table striped hover responsive size="sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Species</th>
                            <th>Difficulty</th>
                            <th>Days</th>
                            <th>Sun</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {plants.map(p => (
                            <tr key={p.id}>
                                <td className="text-muted font-monospace small">{p.id}</td>
                                <td>{p.name}</td>
                                <td>{fmt(p.culinary_type)}</td>
                                <td className="fst-italic">{p.species}</td>
                                <td>{fmt(p.difficulty)}</td>
                                <td>{p.days_to_maturity}</td>
                                <td>{fmt(p.sun)}</td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => navigate(`/admin/plant/${p.id}`)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => setDeleteTarget(p)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete plant</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Permanently delete <strong>{deleteTarget?.name}</strong>?</p>
                    <p className="text-muted small mb-0">
                        Companions, tags, season data, and plant logs referencing this entry will also be removed.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
