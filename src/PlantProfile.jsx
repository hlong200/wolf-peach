import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { supabase } from './lib/supabase';
import { usePlantThumbnail } from './lib/usePlantThumbnails';
import { useFavorites } from './lib/FavoritesProvider';
import { usePlantTray } from './lib/PlantTrayProvider';
import { ICONS } from './lib/plantIcons';
import './PlantProfile.css';

const SUN   = { full:'Full sun', partial:'Partial shade', shade:'Full shade' };
const WATER = { moderate:'Moderate', low:'Low', high:'High' };
const fmt   = t => t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

function GalleryLightbox({ images, startIdx, onClose }) {
    const [idx, setIdx] = useState(startIdx);
    const prev = (idx - 1 + images.length) % images.length;
    const next = (idx + 1) % images.length;

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape')      onClose();
            if (e.key === 'ArrowLeft')   setIdx(i => (i - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight')  setIdx(i => (i + 1) % images.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [images.length, onClose]);

    return createPortal(
        <div className="lb-backdrop" onClick={onClose}>
            <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
            <div className="lb-stage" onClick={e => e.stopPropagation()}>
                {images.length > 1 && (
                    <div className="lb-peek lb-peek-prev" onClick={() => setIdx(prev)}>
                        <img src={images[prev].displayUrl} alt={images[prev].alt || ''} />
                        <span className="lb-arrow">‹</span>
                    </div>
                )}
                <div className="lb-main">
                    <img src={images[idx].displayUrl} alt={images[idx].alt || ''} />
                    {images[idx].alt && <p className="lb-caption">{images[idx].alt}</p>}
                </div>
                {images.length > 1 && (
                    <div className="lb-peek lb-peek-next" onClick={() => setIdx(next)}>
                        <img src={images[next].displayUrl} alt={images[next].alt || ''} />
                        <span className="lb-arrow">›</span>
                    </div>
                )}
            </div>
            {images.length > 1 && (
                <div className="lb-dots" onClick={e => e.stopPropagation()}>
                    {images.map((_, i) => (
                        <button
                            key={i}
                            className={`pgallery-dot${i === idx ? ' pgallery-dot-active' : ''}`}
                            onClick={() => setIdx(i)}
                            aria-label={`Image ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}

export default function PlantProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { favorites, toggleFavorite } = useFavorites();
    const { addToTray } = usePlantTray();
    const thumbnailUrl = usePlantThumbnail(plant?.id);

    const [gallery, setGallery]           = useState([]);
    const [galleryIdx, setGalleryIdx]     = useState(0);
    const [paused, setPaused]             = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const timerRef                        = useRef(null);

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
                    companions_good: data.companions?.filter(c => c.sentiment === 'good').map(c => c.companion) || [],
                    companions_bad: data.companions?.filter(c => c.sentiment === 'bad').map(c => c.companion) || [],
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

    // Fetch gallery images once the plant id is known
    useEffect(() => {
        if (!plant?.id) return;
        let active = true;
        async function fetchGallery() {
            const { data: rows } = await supabase
                .from('plant_images').select('*').eq('plant_id', plant.id).order('sort_order');
            if (!rows?.length || !active) return;
            // Primary image first, then ascending sort_order
            const sorted = [...rows].sort((a, b) => {
                if (a.is_primary && !b.is_primary) return -1;
                if (!a.is_primary && b.is_primary) return  1;
                return (a.sort_order ?? 99) - (b.sort_order ?? 99);
            });
            const { data: signed } = await supabase.storage
                .from('plant-images').createSignedUrls(sorted.map(r => r.url), 3600);
            const urlMap = {};
            signed?.forEach(({ path, signedUrl }) => { urlMap[path] = signedUrl; });
            if (active) setGallery(sorted.map(r => ({ ...r, displayUrl: urlMap[r.url] ?? null })));
        }
        fetchGallery();
        return () => { active = false; };
    }, [plant?.id]);

    // Auto-advance the gallery; pause on hover
    useEffect(() => {
        if (gallery.length <= 1 || paused) return;
        timerRef.current = setInterval(() => {
            setGalleryIdx(i => (i + 1) % gallery.length);
        }, 3500);
        return () => clearInterval(timerRef.current);
    }, [gallery.length, paused]);

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
                        <div
                            className="plant-profile-gallery"
                            onMouseEnter={() => setPaused(true)}
                            onMouseLeave={() => setPaused(false)}
                            onClick={() => gallery.length > 0 && setLightboxOpen(true)}
                        >
                            {gallery.length > 0 ? (
                                <>
                                    {gallery.map((img, i) => (
                                        <img
                                            key={img.id}
                                            src={img.displayUrl}
                                            alt={img.alt || plant.name}
                                            className={`pgallery-slide${i === galleryIdx ? ' pgallery-slide-active' : ''}`}
                                        />
                                    ))}
                                    {gallery.length > 1 && (
                                        <div className="pgallery-dots">
                                            {gallery.map((_, i) => (
                                                <button
                                                    key={i}
                                                    className={`pgallery-dot${i === galleryIdx ? ' pgallery-dot-active' : ''}`}
                                                    onClick={e => { e.stopPropagation(); setGalleryIdx(i); }}
                                                    aria-label={`Image ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="pgallery-hint">
                                        <span className="pgallery-hint-icon">⛶</span>
                                        <span>View gallery</span>
                                    </div>
                                </>
                            ) : thumbnailUrl || plant.thumbnail_url ? (
                                <img
                                    src={thumbnailUrl || plant.thumbnail_url}
                                    alt={plant.name}
                                    className="pgallery-slide pgallery-slide-active"
                                />
                            ) : (
                                <span className="pgallery-emoji">{ICONS[plant.culinary_type] || '🌱'}</span>
                            )}
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
                                    <span className="profile-pill profile-pill-days">{plant.days_to_maturity} days to maturity</span>
                                    <span className={`profile-pill profile-pill-diff-${plant.difficulty}`}>{fmt(plant.difficulty)} difficulty</span>
                                    <span className="profile-pill profile-pill-type">{fmt(plant.culinary_type)}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="plant-profile-section-label">Growing needs</div>
                                <Row className="mt-3 gy-3">
                                    <Col xs={6}><div className="plant-profile-stat">Sun<div>{SUN[plant.sun] || 'Any'}</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Water<div>{WATER[plant.water] || (plant.water ? fmt(plant.water) : 'Moderate')}</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Maturity<div>{plant.days_to_maturity} days</div></div></Col>
                                    <Col xs={6}><div className="plant-profile-stat">Spacing<div>{plant.spacing_in ? `${plant.spacing_in} in` : 'Standard'}</div></div></Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <div className="plant-profile-section-label">Companion planting</div>
                                <div className="mt-2">
                                    <p className="plant-profile-detail"><strong>Good with</strong></p>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {plant.companions_good?.map(c => (
                                            <span key={c} className="plant-profile-chip plant-profile-chip-good">{c}</span>
                                        ))}
                                    </div>
                                    <p className="plant-profile-detail"><strong>Keep away</strong></p>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {plant.companions_bad?.map(c => (
                                            <span key={c} className="plant-profile-chip plant-profile-chip-bad">{c}</span>
                                        ))}
                                    </div>
                                    {plant.tip && (
                                        <p className="plant-profile-tip">"{plant.tip}"</p>
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
                                    <li><strong>Spacing:</strong> {plant.spacing_in ? `${plant.spacing_in} inches` : 'Typical spacing'}.</li>
                                    <li><strong>Harvest:</strong> Around {plant.days_to_maturity} days after sowing.</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {lightboxOpen && gallery.length > 0 && (
                <GalleryLightbox
                    images={gallery}
                    startIdx={galleryIdx}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
