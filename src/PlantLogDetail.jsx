import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { usePlantLogInstance } from './lib/usePlantLogInstance';
import { usePlantLogs } from './lib/usePlantLogs';
import LogEventModal from './LogEventModal';
import JournalEntryModal from './JournalEntryModal';
import { ICONS } from './lib/plantIcons';
import './PlantLogDetail.css';

const EVENT_META = {
    sowed:        { icon: '🌰', label: 'Sowed' },
    germinated:   { icon: '🌱', label: 'Germinated' },
    transplanted: { icon: '🪴', label: 'Transplanted' },
    harvested:    { icon: '🧺', label: 'Harvested' },
    issue:        { icon: '⚠️', label: 'Issue' },
    observation:  { icon: '👁️', label: 'Observation' },
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}

function formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function daysSince(dateStr) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function LogItem({ item }) {
    const meta = EVENT_META[item.event_type] ?? { icon: '📋', label: item.event_type };
    return (
        <div className="pld-timeline-item">
            <div className="pld-dot pld-dot-log">{meta.icon}</div>
            <div className="pld-content">
                <div className="pld-row">
                    <span className="pld-label">{meta.label}</span>
                    <span className="pld-date">{formatDateShort(item.logged_at)}</span>
                </div>
                {(item.quantity != null || item.location) && (
                    <div className="pld-details">
                        {item.quantity != null && (
                            <span className="pld-detail">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
                        )}
                        {item.location && (
                            <span className="pld-detail">📍 {item.location}</span>
                        )}
                    </div>
                )}
                {item.body && <p className="pld-body">{item.body}</p>}
            </div>
        </div>
    );
}

function JournalItem({ item }) {
    const [expanded, setExpanded] = useState(false);
    const preview = item.body.length > 160 && !expanded
        ? item.body.slice(0, 160) + '…'
        : item.body;

    return (
        <div className="pld-timeline-item">
            <div className="pld-dot pld-dot-journal">✍️</div>
            <div className="pld-content">
                <div className="pld-row">
                    <span className="pld-label pld-label-journal">
                        {item.title || 'Journal Entry'}
                        {item.is_private && <span className="pld-private">🔒</span>}
                    </span>
                    <span className="pld-date">{formatDateShort(item.created_at)}</span>
                </div>
                <p className="pld-body pld-body-journal">{preview}</p>
                {item.body.length > 160 && (
                    <button className="pld-expand" onClick={() => setExpanded(v => !v)}>
                        {expanded ? 'Show less' : 'Read more'}
                    </button>
                )}
            </div>
        </div>
    );
}

function PrintLabel({ plant, location, sowDate, qrUrl }) {
    const emoji = ICONS[plant?.culinary_type] ?? '🌱';
    return (
        <div className="print-label">
            <div className="print-label-inner">
                <div className="print-label-emoji">{emoji}</div>
                <div className="print-label-name">{plant?.name}</div>
                {location && <div className="print-label-loc">📍 {location}</div>}
                {sowDate && <div className="print-label-date">Sowed {formatDateShort(sowDate)}</div>}
                <div className="print-label-qr">
                    <QRCodeSVG value={qrUrl} size={110} />
                </div>
                <div className="print-label-footer">🌿 Wolf Peach</div>
            </div>
        </div>
    );
}

export default function PlantLogDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { instance, loading, error, refetch } = usePlantLogInstance(id);
    const { createLogEvent, createJournalEntry } = usePlantLogs();

    const [showLogModal,     setShowLogModal]     = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);

    const qrUrl = `${window.location.origin}${import.meta.env.BASE_URL}#/log/${id}`;

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="secondary" />
            </Container>
        );
    }

    if (error || !instance) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">Plant log not found.</Alert>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>Go back</Button>
            </Container>
        );
    }

    const { plant, location, isOwner, logs, journalEntries } = instance;
    const emoji = ICONS[plant?.culinary_type] ?? '🌱';

    const sowLog = logs.find(l => l.event_type === 'sowed') ?? logs[0];
    const sowDate = sowLog?.logged_at ?? null;
    const daysGrown = sowDate ? daysSince(sowDate) : null;
    const daysToMaturity = plant?.days_to_maturity ?? null;
    const daysRemaining = daysToMaturity && daysGrown != null
        ? Math.max(0, daysToMaturity - daysGrown)
        : null;

    const timeline = [
        ...logs.map(l => ({ ...l, _kind: 'log',     _sortDate: new Date(l.logged_at) })),
        ...journalEntries.map(j => ({ ...j, _kind: 'journal', _sortDate: new Date(j.created_at) })),
    ].sort((a, b) => a._sortDate - b._sortDate);

    // Wrap createLogEvent/createJournalEntry to refetch after
    const handleSaveLog = async (data) => {
        await createLogEvent(data);
        await refetch();
    };

    const handleSaveJournal = async (data) => {
        await createJournalEntry(data);
        await refetch();
    };

    // The instance represented as a single-item array for JournalEntryModal's selector
    const instanceAsSingleList = [{
        key:       `${plant?.id}::${location ?? ''}`,
        rootLogId: id,
        plant,
        location,
    }];

    return (
        <>
            {/* Print label — hidden on screen, visible only when printing */}
            <PrintLabel plant={plant} location={location} sowDate={sowDate} qrUrl={qrUrl} />

            <Container className="pld-page pb-5">
                <Row>
                    <Col md={4} className="pld-left-panel">
                        {/* Left panel is now available for other content */}
                    </Col>
                    <Col md={8}>
                        {/* Back */}
                        <button className="pld-back" onClick={() => navigate(-1)}>
                            ← Back
                        </button>

                        {/* Plant header */}
                        <div className="pld-header">
                            <span className="pld-header-emoji">{emoji}</span>
                            <div className="pld-header-info">
                                <h1 className="pld-plant-name">{plant?.name ?? 'Unknown plant'}</h1>
                                <div className="pld-badges">
                                    {plant?.culinary_type && (
                                        <span className="pld-badge">{plant.culinary_type}</span>
                                    )}
                                    {location && (
                                        <span className="pld-badge pld-badge-loc">📍 {location}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats row */}
                        {(sowDate || daysToMaturity) && (
                            <div className="pld-stats">
                                {sowDate && (
                                    <div className="pld-stat">
                                        <span className="pld-stat-label">Sowed</span>
                                        <span className="pld-stat-value">{formatDate(sowDate)}</span>
                                    </div>
                                )}
                                {daysGrown != null && (
                                    <div className="pld-stat">
                                        <span className="pld-stat-label">Days grown</span>
                                        <span className="pld-stat-value">{daysGrown}</span>
                                    </div>
                                )}
                                {daysRemaining != null && (
                                    <div className="pld-stat">
                                        <span className="pld-stat-label">Est. days to harvest</span>
                                        <span className="pld-stat-value">{daysRemaining > 0 ? daysRemaining : '—  Ready'}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* QR section */}
                        <div className="pld-qr-section">
                            <QRCodeSVG value={qrUrl} size={96} className="pld-qr-code" />
                            <div className="pld-qr-info">
                                <p className="pld-qr-hint">Scan to open this plant's log</p>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => window.print()}
                                >
                                    🖨️ Print Label
                                </Button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="pld-section-label">Timeline</div>
                        {timeline.length === 0 ? (
                            <p className="text-muted small">No entries yet.</p>
                        ) : (
                            <div className="pld-timeline">
                                {timeline.map(item =>
                                    item._kind === 'log'
                                        ? <LogItem     key={item.id} item={item} />
                                        : <JournalItem key={item.id} item={item} />
                                )}
                            </div>
                        )}

                        {/* Owner actions */}
                        {isOwner && (
                            <div className="pld-actions">
                                <Button variant="outline-secondary" size="sm" onClick={() => setShowLogModal(true)}>
                                    + Log Event
                                </Button>
                                <Button variant="outline-secondary" size="sm" onClick={() => setShowJournalModal(true)}>
                                    + Journal Entry
                                </Button>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <LogEventModal
                show={showLogModal}
                onHide={() => setShowLogModal(false)}
                onSave={handleSaveLog}
                defaultPlant={plant}
            />
            <JournalEntryModal
                show={showJournalModal}
                onHide={() => setShowJournalModal(false)}
                onSave={handleSaveJournal}
                instances={instanceAsSingleList}
                defaultInstance={instanceAsSingleList[0]}
            />
        </>
    );
}
