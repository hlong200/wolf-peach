import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Tabs, Tab, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { supabase } from './lib/supabase';
import { bustThumbnailCache } from './lib/usePlantThumbnails';

const EMPTY_CORE = {
    id: '', name: '', culinary_type: '', species: '', subtype: '',
    difficulty: 'easy', days_to_maturity: '', sun: 'full', water: 'moderate',
    spacing_in: '', tip: '', description: '', history: '', seasonal_quirks: '',
    harvest_cues: '', variety_notes: '', preservation: '',
    culinary_uses: '', pests_diseases: '',
};

const EMPTY_SEASON = {
    start_indoors_weeks: '', direct_sow_weeks: '', transplant_weeks: '',
    harvest_start_weeks_from_frost: '', harvest_end_weeks_from_frost: '', notes: '',
};

const EMPTY_COMPANION = { companion: '', sentiment: 'good', reason: '' };


function arrToText(arr) {
    if (!arr) return '';
    return Array.isArray(arr) ? arr.join('\n') : arr;
}

function textToArr(text) {
    return text.split('\n').map(s => s.trim()).filter(Boolean);
}

export default function AdminPlantForm() {
    const { id } = useParams();
    const isNew = !id || id === 'new';
    const navigate = useNavigate();

    const [core, setCore] = useState(EMPTY_CORE);
    const [season, setSeason] = useState(EMPTY_SEASON);
    const [companions, setCompanions] = useState([]);
    const [tags, setTags] = useState([]);        // selected tag names
    const [newTag, setNewTag] = useState('');
    const [allTags, setAllTags] = useState([]);  // all tags in DB
    const [culinaryTypes, setCulinaryTypes] = useState([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Load reference data and existing plant on mount
    useEffect(() => {
        async function load() {
            const [{ data: types }, { data: tagRows }] = await Promise.all([
                supabase.from('culinary_types').select('id').order('id'),
                supabase.from('tags').select('id, name').order('name'),
            ]);
            setCulinaryTypes(types ?? []);
            setAllTags(tagRows ?? []);

            if (isNew) return;

            const [{ data: plant }, { data: compData }, { data: tagData }, { data: seasonData }] =
                await Promise.all([
                    supabase.from('catalog').select('*').eq('id', id).single(),
                    supabase.from('companions').select('*').eq('plant_id', id),
                    supabase.from('plant_tags').select('tags(name)').eq('plant_id', id),
                    supabase.from('plant_seasons').select('*').eq('plant_id', id).maybeSingle(),
                ]);

            if (plant) {
                setCore({
                    ...plant,
                    culinary_uses: arrToText(plant.culinary_uses),
                    pests_diseases: arrToText(plant.pests_diseases),
                });
            }
            if (compData) setCompanions(compData.map(c => ({ companion: c.companion, sentiment: c.sentiment, reason: c.reason ?? '' })));
            if (tagData)  setTags(tagData.map(t => t.tags.name));
            if (seasonData) {
                setSeason(Object.fromEntries(
                    Object.keys(EMPTY_SEASON).map(k => [k, seasonData[k] ?? ''])
                ));
            }
            setLoading(false);
        }
        load();
    }, [id, isNew]);

    function setField(setter) {
        return e => setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    // Companion helpers
    function updateCompanion(i, field, value) {
        setCompanions(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
    }
    function removeCompanion(i) {
        setCompanions(prev => prev.filter((_, idx) => idx !== i));
    }

    // Tag helpers
    function toggleTag(name) {
        setTags(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
    }
    function addNewTag() {
        const t = newTag.trim().toLowerCase();
        if (!t || tags.includes(t)) return;
        setTags(prev => [...prev, t]);
        if (!allTags.find(tag => tag.name === t)) {
            setAllTags(prev => [...prev, { id: null, name: t }]);
        }
        setNewTag('');
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const plantId = core.id.trim();

            const catalogPayload = {
                id: plantId,
                name: core.name,
                culinary_type: core.culinary_type,
                species: core.species,
                subtype: core.subtype,
                difficulty: core.difficulty,
                days_to_maturity: parseInt(core.days_to_maturity, 10),
                sun: core.sun,
                water: core.water,
                spacing_in: parseInt(core.spacing_in, 10),
                tip: core.tip,
                description: core.description,
                history: core.history,
                seasonal_quirks: core.seasonal_quirks,
                harvest_cues: core.harvest_cues,
                variety_notes: core.variety_notes,
                preservation: core.preservation,
                culinary_uses: textToArr(core.culinary_uses),
                pests_diseases: textToArr(core.pests_diseases),
            };

            const NUM_SEASON_KEYS = [
                'start_indoors_weeks', 'direct_sow_weeks', 'transplant_weeks',
                'harvest_start_weeks_from_frost', 'harvest_end_weeks_from_frost',
            ];
            const hasSeasonData = NUM_SEASON_KEYS.some(k => season[k] !== '');
            const seasonPayload = hasSeasonData
                ? Object.fromEntries(
                    Object.entries(season).map(([k, v]) =>
                        [k, NUM_SEASON_KEYS.includes(k) ? (v === '' ? null : parseInt(v, 10)) : v]
                    )
                  )
                : null;

            const { error } = await supabase.rpc('admin_upsert_plant', {
                p_id:         plantId,
                p_catalog:    catalogPayload,
                p_season:     seasonPayload,
                p_companions: companions.filter(c => c.companion.trim()),
                p_tag_names:  tags,
            });

            if (error) throw error;

            navigate('/admin');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>;

    return (
        <div className="py-4" style={{ maxWidth: 800 }}>
            <div className="d-flex align-items-center gap-3 mb-4">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate('/admin')}>← Back</Button>
                <h2 className="mb-0">{isNew ? 'Add plant' : `Edit — ${core.name}`}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <Form onSubmit={handleSave}>
                <Tabs defaultActiveKey="core" className="mb-3">

                    {/* ── CORE ── */}
                    <Tab eventKey="core" title="Core">
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>ID <span className="text-muted small">(slug)</span></Form.Label>
                                    <Form.Control
                                        name="id" value={core.id}
                                        onChange={setField(setCore)}
                                        readOnly={!isNew}
                                        placeholder="cherokee-purple"
                                        pattern="^[a-z0-9-]+$"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control name="name" value={core.name} onChange={setField(setCore)} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Type</Form.Label>
                                    <Form.Select name="culinary_type" value={core.culinary_type} onChange={setField(setCore)} required>
                                        <option value="">Select…</option>
                                        {culinaryTypes.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Species</Form.Label>
                                    <Form.Control name="species" value={core.species} onChange={setField(setCore)} required className="fst-italic" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Subtype</Form.Label>
                                    <Form.Control name="subtype" value={core.subtype} onChange={setField(setCore)} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Difficulty</Form.Label>
                                    <Form.Select name="difficulty" value={core.difficulty} onChange={setField(setCore)}>
                                        <option value="easy">Easy</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="hard">Hard</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Days to maturity</Form.Label>
                                    <Form.Control type="number" name="days_to_maturity" value={core.days_to_maturity} onChange={setField(setCore)} required min={1} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Sun</Form.Label>
                                    <Form.Select name="sun" value={core.sun} onChange={setField(setCore)}>
                                        <option value="full">Full sun</option>
                                        <option value="partial">Partial shade</option>
                                        <option value="shade">Full shade</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Water</Form.Label>
                                    <Form.Select name="water" value={core.water} onChange={setField(setCore)}>
                                        <option value="low">Low</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="high">High</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Spacing (in)</Form.Label>
                                    <Form.Control type="number" name="spacing_in" value={core.spacing_in} onChange={setField(setCore)} required min={1} />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label>Tip</Form.Label>
                                    <Form.Control name="tip" value={core.tip} onChange={setField(setCore)} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Tab>

                    {/* ── DETAILS ── */}
                    <Tab eventKey="details" title="Details">
                        <Row className="g-3">
                            {[
                                ['description',    'Description'],
                                ['history',        'History'],
                                ['seasonal_quirks','Seasonal quirks'],
                                ['harvest_cues',   'Harvest cues'],
                                ['variety_notes',  'Variety notes'],
                                ['preservation',   'Preservation'],
                            ].map(([name, label]) => (
                                <Col xs={12} key={name}>
                                    <Form.Group>
                                        <Form.Label>{label}</Form.Label>
                                        <Form.Control as="textarea" rows={3} name={name} value={core[name]} onChange={setField(setCore)} />
                                    </Form.Group>
                                </Col>
                            ))}
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Culinary uses <span className="text-muted small">(one per line)</span></Form.Label>
                                    <Form.Control as="textarea" rows={4} name="culinary_uses" value={core.culinary_uses} onChange={setField(setCore)} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Pests &amp; diseases <span className="text-muted small">(one per line)</span></Form.Label>
                                    <Form.Control as="textarea" rows={4} name="pests_diseases" value={core.pests_diseases} onChange={setField(setCore)} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Tab>

                    {/* ── SEASON ── */}
                    <Tab eventKey="season" title="Season">
                        <p className="text-muted small mb-3">All values in weeks relative to last spring frost. Negative = before frost, positive = after.</p>
                        <Row className="g-3">
                            {[
                                ['start_indoors_weeks',            'Start indoors'],
                                ['direct_sow_weeks',               'Direct sow'],
                                ['transplant_weeks',               'Transplant'],
                                ['harvest_start_weeks_from_frost', 'Harvest start'],
                                ['harvest_end_weeks_from_frost',   'Harvest end'],
                            ].map(([name, label]) => (
                                <Col md={4} key={name}>
                                    <Form.Group>
                                        <Form.Label>{label} <span className="text-muted small">wks</span></Form.Label>
                                        <Form.Control type="number" name={name} value={season[name]} onChange={setField(setSeason)} placeholder="null" />
                                    </Form.Group>
                                </Col>
                            ))}
                            <Col xs={12}>
                                <Form.Group>
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="notes" value={season.notes} onChange={setField(setSeason)} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Tab>

                    {/* ── COMPANIONS ── */}
                    <Tab eventKey="companions" title="Companions">
                        <div className="d-flex flex-column gap-2 mb-3">
                            {companions.map((c, i) => (
                                <Row key={i} className="g-2 align-items-center">
                                    <Col md={4}>
                                        <Form.Control
                                            placeholder="Plant name"
                                            value={c.companion}
                                            onChange={e => updateCompanion(i, 'companion', e.target.value)}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={c.sentiment} onChange={e => updateCompanion(i, 'sentiment', e.target.value)}>
                                            <option value="good">Good</option>
                                            <option value="bad">Bad</option>
                                        </Form.Select>
                                    </Col>
                                    <Col>
                                        <Form.Control
                                            placeholder="Reason (optional)"
                                            value={c.reason}
                                            onChange={e => updateCompanion(i, 'reason', e.target.value)}
                                        />
                                    </Col>
                                    <Col xs="auto">
                                        <Button variant="outline-danger" size="sm" onClick={() => removeCompanion(i)}>✕</Button>
                                    </Col>
                                </Row>
                            ))}
                        </div>
                        <Button variant="outline-secondary" size="sm" onClick={() => setCompanions(prev => [...prev, { ...EMPTY_COMPANION }])}>
                            + Add companion
                        </Button>
                    </Tab>

                    {/* ── TAGS ── */}
                    <Tab eventKey="tags" title="Tags">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {allTags.map(t => (
                                <Button
                                    key={t.name}
                                    size="sm"
                                    variant={tags.includes(t.name) ? 'secondary' : 'outline-secondary'}
                                    className="rounded-pill"
                                    onClick={() => toggleTag(t.name)}
                                >
                                    {t.name}
                                </Button>
                            ))}
                        </div>
                        <div className="d-flex gap-2" style={{ maxWidth: 300 }}>
                            <Form.Control
                                size="sm"
                                placeholder="New tag"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewTag(); } }}
                            />
                            <Button size="sm" variant="outline-secondary" onClick={addNewTag}>Add</Button>
                        </div>
                    </Tab>
                </Tabs>

                <div className="d-flex gap-2 mt-4 pt-3 border-top">
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving…' : isNew ? 'Create plant' : 'Save changes'}
                    </Button>
                    <Button variant="outline-secondary" onClick={() => navigate('/admin')} disabled={saving}>
                        Cancel
                    </Button>
                </div>
            </Form>
        </div>
    );
}
