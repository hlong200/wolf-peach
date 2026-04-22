import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Tab, Nav } from 'react-bootstrap';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/AuthProvider';

const ZONES = [
    '1a','1b','2a','2b','3a','3b','4a','4b','5a','5b','6a','6b','7a','7b',
    '8a','8b','9a','9b','10a','10b','11a','11b','12a','12b','13a','13b',
];

const GOAL_OPTIONS = [
    { value: 'regenerative',       label: 'Regenerative' },
    { value: 'self_sufficiency',   label: 'Self-Sufficiency' },
    { value: 'hobby',              label: 'Hobby' },
    { value: 'enthusiast',         label: 'Enthusiast' },
    { value: 'seed_preservation',  label: 'Seed Preservation' },
    { value: 'market_garden',      label: 'Market Garden' },
    { value: 'companion_planting', label: 'Companion Planting' },
    { value: 'organic',            label: 'Organic' },
    { value: 'permaculture',       label: 'Permaculture' },
];

export default function EditProfileModal({ show, onHide, profile, goals, onSave }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // Profile fields
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // Garden fields
    const [zone, setZone] = useState('');
    const [gardenType, setGardenType] = useState('');
    const [gardenSize, setGardenSize] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');

    // Goals
    const [selectedGoals, setSelectedGoals] = useState([]);

    // Save state
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        if (!show) return;
        setDisplayName(profile?.display_name ?? '');
        setBio(profile?.bio ?? '');
        setZone(profile?.zone ?? '');
        setGardenType(profile?.garden_type ?? '');
        setGardenSize(profile?.garden_size ?? '');
        setExperienceLevel(profile?.experience_level ?? '');
        setSelectedGoals(goals ?? []);
        setActiveTab('profile');
        setSaveError(null);
        setPasswordError(null);
        setPasswordSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, [show, profile, goals]);

    const toggleGoal = (value) => {
        setSelectedGoals(prev =>
            prev.includes(value) ? prev.filter(g => g !== value) : [...prev, value]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            await onSave(
                {
                    display_name:     displayName || null,
                    bio:              bio || null,
                    zone:             zone || null,
                    garden_type:      gardenType || null,
                    garden_size:      gardenSize || null,
                    experience_level: experienceLevel || null,
                },
                selectedGoals
            );
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
        if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
        setPasswordLoading(true);

        // Verify current password before allowing the change
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });
        if (authError) {
            setPasswordLoading(false);
            setPasswordError('Current password is incorrect.');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setPasswordLoading(false);
        if (error) {
            setPasswordError(error.message);
        } else {
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="tabs" className="px-3 pt-3">
                        <Nav.Item><Nav.Link eventKey="profile">Profile</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="garden">Garden</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="goals">Goals</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="security">Security</Nav.Link></Nav.Item>
                    </Nav>
                    <Tab.Content className="p-3">

                        <Tab.Pane eventKey="profile">
                            {saveError && <Alert variant="danger" className="py-2">{saveError}</Alert>}
                            <Form.Group className="mb-3">
                                <Form.Label>Display Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="How you'd like to be known"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Bio</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="A little about you and your garden..."
                                />
                            </Form.Group>
                        </Tab.Pane>

                        <Tab.Pane eventKey="garden">
                            {saveError && <Alert variant="danger" className="py-2">{saveError}</Alert>}
                            <Form.Group className="mb-3">
                                <Form.Label>USDA Hardiness Zone</Form.Label>
                                <Form.Select value={zone} onChange={e => setZone(e.target.value)}>
                                    <option value="">Select your zone...</option>
                                    {ZONES.map(z => (
                                        <option key={z} value={z}>Zone {z}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Garden Type</Form.Label>
                                <Form.Select value={gardenType} onChange={e => setGardenType(e.target.value)}>
                                    <option value="">Select type...</option>
                                    <option value="raised_beds">Raised Beds</option>
                                    <option value="in_ground">In Ground</option>
                                    <option value="container">Container</option>
                                    <option value="greenhouse">Greenhouse</option>
                                    <option value="mixed">Mixed</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Garden Size</Form.Label>
                                <Form.Select value={gardenSize} onChange={e => setGardenSize(e.target.value)}>
                                    <option value="">Select size...</option>
                                    <option value="small">Small (&lt;100 sq ft)</option>
                                    <option value="medium">Medium (100–500 sq ft)</option>
                                    <option value="large">Large (500–1000 sq ft)</option>
                                    <option value="acreage">Acreage (1000+ sq ft)</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Experience Level</Form.Label>
                                <Form.Select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                                    <option value="">Select level...</option>
                                    <option value="first_season">First Season</option>
                                    <option value="few_years">A Few Years</option>
                                    <option value="experienced">Experienced</option>
                                    <option value="lifelong">Lifelong Gardener</option>
                                </Form.Select>
                            </Form.Group>
                        </Tab.Pane>

                        <Tab.Pane eventKey="goals">
                            {saveError && <Alert variant="danger" className="py-2">{saveError}</Alert>}
                            <p className="text-muted small mb-3">Select all that describe your growing goals.</p>
                            <div className="edit-goal-grid">
                                {GOAL_OPTIONS.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`edit-goal-pill${selectedGoals.includes(value) ? ' edit-goal-pill-active' : ''}`}
                                        onClick={() => toggleGoal(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </Tab.Pane>

                        <Tab.Pane eventKey="security">
                            <p className="text-muted small mb-3">Change your password.</p>
                            {passwordError   && <Alert variant="danger"  className="py-2">{passwordError}</Alert>}
                            {passwordSuccess && <Alert variant="success" className="py-2">Password updated successfully.</Alert>}
                            <Form onSubmit={handlePasswordChange}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary" disabled={passwordLoading}>
                                    {passwordLoading ? 'Updating…' : 'Update Password'}
                                </Button>
                            </Form>
                        </Tab.Pane>

                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
                {activeTab !== 'security' && (
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}
