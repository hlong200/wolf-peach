import { useState } from 'react';
import { Container, Tab, Nav, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useAuth } from './lib/AuthProvider';
import { useProfile } from './lib/useProfile';
import EditProfileModal from './EditProfileModal';
import JournalTab from './JournalTab';
import './Profile.css';

const GARDEN_TYPE_LABELS = {
    raised_beds: 'Raised Beds',
    in_ground:   'In Ground',
    container:   'Container',
    greenhouse:  'Greenhouse',
    mixed:       'Mixed',
};

const GARDEN_SIZE_LABELS = {
    small:   'Small (<100 sq ft)',
    medium:  'Medium (100–500 sq ft)',
    large:   'Large (500–1000 sq ft)',
    acreage: 'Acreage (1000+ sq ft)',
};

const EXPERIENCE_LABELS = {
    first_season: 'First Season',
    few_years:    'A Few Years',
    experienced:  'Experienced',
    lifelong:     'Lifelong Gardener',
};

const GOAL_LABELS = {
    regenerative:       'Regenerative',
    self_sufficiency:   'Self-Sufficiency',
    hobby:              'Hobby',
    enthusiast:         'Enthusiast',
    seed_preservation:  'Seed Preservation',
    market_garden:      'Market Garden',
    companion_planting: 'Companion Planting',
    organic:            'Organic',
    permaculture:       'Permaculture',
};

function AvatarCircle({ profile, user, size = 80 }) {
    const initials = profile?.display_name
        ? profile.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : (user?.email?.[0]?.toUpperCase() ?? '?');

    if (profile?.avatar_url) {
        return (
            <img
                src={profile.avatar_url}
                alt="Profile"
                className="profile-avatar"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="profile-avatar profile-avatar-initials"
            style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
            {initials}
        </div>
    );
}

function GardenTab({ profile, goals, onEdit }) {
    const hasDetails = profile?.zone || profile?.garden_type || profile?.garden_size || profile?.experience_level;

    if (!hasDetails && goals.length === 0) {
        return (
            <div className="profile-tab-content text-center text-muted mt-4">
                <p>No garden details set yet.</p>
                <Button variant="outline-secondary" size="sm" onClick={onEdit}>Set up your garden</Button>
            </div>
        );
    }

    return (
        <div className="profile-tab-content">
            {profile?.zone && (
                <div className="mb-4">
                    <div className="profile-section-label">Hardiness Zone</div>
                    <span className="zone-badge">Zone {profile.zone}</span>
                </div>
            )}

            {(profile?.garden_type || profile?.garden_size || profile?.experience_level) && (
                <Row className="g-3 mb-4">
                    {profile?.garden_type && (
                        <Col xs={6} md={4}>
                            <div className="profile-stat-card">
                                <div className="profile-stat-icon">🌱</div>
                                <div className="profile-stat-label">Garden Type</div>
                                <div className="profile-stat-value">
                                    {GARDEN_TYPE_LABELS[profile.garden_type] ?? profile.garden_type}
                                </div>
                            </div>
                        </Col>
                    )}
                    {profile?.garden_size && (
                        <Col xs={6} md={4}>
                            <div className="profile-stat-card">
                                <div className="profile-stat-icon">📐</div>
                                <div className="profile-stat-label">Garden Size</div>
                                <div className="profile-stat-value">
                                    {GARDEN_SIZE_LABELS[profile.garden_size] ?? profile.garden_size}
                                </div>
                            </div>
                        </Col>
                    )}
                    {profile?.experience_level && (
                        <Col xs={6} md={4}>
                            <div className="profile-stat-card">
                                <div className="profile-stat-icon">🌿</div>
                                <div className="profile-stat-label">Experience</div>
                                <div className="profile-stat-value">
                                    {EXPERIENCE_LABELS[profile.experience_level] ?? profile.experience_level}
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            )}

            {goals.length > 0 && (
                <div>
                    <div className="profile-section-label">Growing Goals</div>
                    <div className="profile-goals">
                        {goals.map(g => (
                            <span key={g} className="profile-goal-tag">
                                {GOAL_LABELS[g] ?? g}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function Profile() {
    const { user } = useAuth();
    const { profile, goals, loading, updateProfile, updateGoals } = useProfile();
    const [showEdit, setShowEdit] = useState(false);
    const [activeTab, setActiveTab] = useState('garden');

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" variant="secondary" />
            </div>
        );
    }

    const displayName = profile?.display_name || user?.email;

    return (
        <>
            <section className="profile-header py-4 py-md-5">
                <Container>
                    <div className="profile-header-inner">
                        <AvatarCircle profile={profile} user={user} size={80} />
                        <div className="profile-header-info">
                            <h1 className="profile-display-name">{displayName}</h1>
                            {profile?.display_name && (
                                <p className="profile-email text-muted mb-1">{user?.email}</p>
                            )}
                            {profile?.bio && (
                                <p className="profile-bio mb-0">{profile.bio}</p>
                            )}
                        </div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="profile-edit-btn"
                            onClick={() => setShowEdit(true)}
                        >
                            Edit Profile
                        </Button>
                    </div>
                </Container>
            </section>

            <Container className="pb-5 mt-4">
                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="underline" className="profile-tabs mb-4">
                        <Nav.Item>
                            <Nav.Link eventKey="garden">Garden</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="journal">Journal</Nav.Link>
                        </Nav.Item>
                    </Nav>
                    <Tab.Content>
                        <Tab.Pane eventKey="garden">
                            <GardenTab
                                profile={profile}
                                goals={goals}
                                onEdit={() => setShowEdit(true)}
                            />
                        </Tab.Pane>
                        <Tab.Pane eventKey="journal">
                            <JournalTab />
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Container>

            <EditProfileModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                profile={profile}
                goals={goals}
                onSave={async (profileUpdates, newGoals) => {
                    await updateProfile(profileUpdates);
                    await updateGoals(newGoals);
                    setShowEdit(false);
                }}
            />
        </>
    );
}
