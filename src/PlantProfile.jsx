import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { supabase } from './lib/supabase';
import { usePlantThumbnail } from './lib/usePlantThumbnails';
import { useFavorites } from './lib/FavoritesProvider';
import { usePlantTray } from './lib/PlantTrayProvider';
import { ICONS } from './lib/plantIcons';
import './PlantProfile.css';

const SUN = { full:'Full sun', partial:'Partial shade', shade:'Full shade' };
const WATER = { moderate: 'Moderate', low: 'Low', high: 'High' };
const fmt = t => t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export default function PlantProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { favorites, toggleFavorite } = useFavorites();
    const { addToTray } = usePlantTray();
    const thumbnailUrl = usePlantThumbnail(plant?.id);

    useEffect(() => {
        let active = true;
        const plantId = isNaN(Number(id)) ? id : Number(id);

        async function fetchPlant() {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase.from('catalog')
                    .select(`*, plant_tags ( tags ( name ) ), companions ( companion, sentiment, reason )`)
                    .eq('id', plantId)
                    .single();

                if (fetchError) throw fetchError;

                const mappedPlant = {
                    ...data,
                    tags: data.plant_tags?.map(pt => pt.tags.name) || [],
                    plant_tags: undefined,
                    quick_view: {
                        companions_good: data.companions?.filter(c => c.sentiment === 'good').map(c => c.companion) || [],
                        companions_bad: data.companions?.filter(c => c.sentiment === 'bad').map(c => c.companion) || [],
                        spacing_in: data.quick_view?.spacing_in ?? data.spacing_in ?? null,
                        tip: data.tip ?? data.quick_view?.tip ?? null,
                    },
                    companions: undefined,
                };

                if (active) setPlant(mappedPlant);
            } catch (err) {
                if (active) setError(err);
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchPlant();
        return () => { active = false; };
    }, [id]);

    const isFav = plant ? favorites.includes(plant.id) : false;

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="secondary" />
            </div>
        );
    }

    if (error || !plant) {
        return (
            <div className="text-center mt-5">
                <p className="text-muted">Plant not found.</p>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>Go back</Button>
            </div>
        );
    }

    return (
        <>
            <Container className="mb-3">
                <div className="d-flex flex-wrap gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/catalog')}>
                        Back to catalog
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/') }>
                        Home
                    </Button>
                </div>
            </Container>
            <section className="plant-profile-header py-4 py-md-5">
                <Container>
                    <div className="plant-profile-header-inner">
                        <div className="plant-profile-thumb">
                            {thumbnailUrl || plant.thumbnail_url
                                ? <img src={thumbnailUrl || plant.thumbnail_url} alt={plant.name} />
                                : <span>{ICONS[plant.culinary_type] || '🌱'}</span>
                            }
                        </div>
                        <div className="plant-profile-info">
                            <h1>{plant.name}</h1>
                            <p className="mb-1 text-muted">{plant.species}</p>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <Button
                                    variant={isFav ? 'secondary' : 'primary'}
                                    size="sm"
                                    onClick={() => toggleFavorite(plant.id, plant.name)}
                                >
                                    {isFav ? 'Remove from garden' : 'Add to garden'}
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => addToTray(plant.id, plant.name, plant.culinary_type)}
                                >
                                    Add to tray
                                </Button>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            <Container className="pb-5">
                <Row className="g-4">
                    <Col lg={7}>
                        <Card className="plant-profile-card p-4 h-100">
                            <div className="mb-4">
                                <div className="plant-profile-section-label">Overview</div>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    <Badge bg="success">{plant.days_to_maturity} days</Badge>
                                    <Badge bg="warning" text="dark">{SUN[plant.sun] || plant.sun}</Badge>
                                    <Badge bg="info">{WATER[plant.water] || (plant.water ? fmt(plant.water) : 'Moderate')}</Badge>
                                    <Badge bg={plant.difficulty === 'hard' ? 'danger' : plant.difficulty === 'moderate' ? 'warning' : 'secondary'}>
                                        {fmt(plant.difficulty)}
                                    </Badge>
                                    <Badge bg="secondary">{fmt(plant.culinary_type)}</Badge>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="plant-profile-section-label">Growing needs</div>
                                <Row className="mt-3 gy-3">
                                    <Col xs={6}><div className="plant-profile-stat">Sun<div>{SUN[plant.sun] || 'Any'}</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Water<div>{WATER[plant.water] || (plant.water ? fmt(plant.water) : 'Moderate')}</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Maturity<div>{plant.days_to_maturity} days</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Spacing<div>{plant.quick_view?.spacing_in ? `${plant.quick_view.spacing_in} in` : 'Standard'}</div></div></Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <div className="plant-profile-section-label">Companion planting</div>
                                <div className="mt-2">
                                    <p className="plant-profile-detail"><strong>Good with</strong></p>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {plant.quick_view?.companions_good?.map(c => (
                                            <span key={c} className="plant-profile-chip plant-profile-chip-good">{c}</span>
                                        ))}
                                    </div>
                                    <p className="plant-profile-detail"><strong>Keep away</strong></p>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {plant.quick_view?.companions_bad?.map(c => (
                                            <span key={c} className="plant-profile-chip plant-profile-chip-bad">{c}</span>
                                        ))}
                                    </div>
                                    {plant.quick_view?.tip && (
                                        <p className="plant-profile-tip">"{plant.quick_view.tip}"</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="plant-profile-section-label">Variety details</div>
                                <Row className="mt-3 gy-3">
                                    <Col xs={6}><div className="plant-profile-stat">Type<div>{fmt(plant.culinary_type)}</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Species<div>{plant.species}</div></div></Col>
                                </Row>
                            </div>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="plant-profile-card p-4 h-100">
                            <div className="plant-profile-section-label mb-3">Plant profile</div>
                            <p className="plant-profile-text">Review key trait badges and variety highlights before adding this plant to your garden or tray.</p>
                            <div className="mt-4">
                                <div className="plant-profile-subsection">Traits</div>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    {plant.tags.map(tag => (
                                        <Badge key={tag} bg="secondary">{fmt(tag)}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="plant-profile-subsection">Highlights</div>
                                <ul className="plant-profile-highlights">
                                    <li><strong>{plant.tags.includes('heirloom') ? 'Heirloom:' : 'Variety:'}</strong> {plant.tags.includes('heirloom') ? 'Traditional flavor and open-pollinated seed saving.' : 'A garden-friendly variety.'}</li>
                                    <li><strong>Spacing:</strong> {plant.quick_view?.spacing_in ? `${plant.quick_view.spacing_in} inches` : 'Typical spacing'}.</li>
                                    <li><strong>Harvest:</strong> Around {plant.days_to_maturity} days after sowing.</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
