import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { usePlantLogs } from './lib/usePlantLogs';
import LogEventModal from './LogEventModal';
import JournalEntryModal from './JournalEntryModal';
import { ICONS } from './lib/plantIcons';
import './JournalTab.css';

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
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function LogItem({ item }) {
    const meta = EVENT_META[item.event_type] ?? { icon: '📋', label: item.event_type };
    return (
        <div className="timeline-item">
            <div className="timeline-dot timeline-dot-log">{meta.icon}</div>
            <div className="timeline-content">
                <div className="timeline-row">
                    <span className="timeline-label timeline-label-log">{meta.label}</span>
                    <span className="timeline-date">{formatDate(item.logged_at)}</span>
                </div>
                {(item.quantity != null || item.location) && (
                    <div className="timeline-details">
                        {item.quantity != null && (
                            <span className="timeline-detail">
                                {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                        )}
                        {item.location && (
                            <span className="timeline-detail">📍 {item.location}</span>
                        )}
                    </div>
                )}
                {item.body && <p className="timeline-body">{item.body}</p>}
            </div>
        </div>
    );
}

function JournalItem({ item }) {
    const [expanded, setExpanded] = useState(false);
    const preview = item.body.length > 120 && !expanded
        ? item.body.slice(0, 120) + '…'
        : item.body;

    return (
        <div className="timeline-item">
            <div className="timeline-dot timeline-dot-journal">✍️</div>
            <div className="timeline-content">
                <div className="timeline-row">
                    <span className="timeline-label timeline-label-journal">
                        {item.title || 'Journal Entry'}
                        {item.is_private && <span className="timeline-private">🔒</span>}
                    </span>
                    <span className="timeline-date">{formatDate(item.created_at)}</span>
                </div>
                <p className="timeline-body timeline-body-journal">{preview}</p>
                {item.body.length > 120 && (
                    <button className="timeline-expand" onClick={() => setExpanded(v => !v)}>
                        {expanded ? 'Show less' : 'Read more'}
                    </button>
                )}
            </div>
        </div>
    );
}

function PlantInstance({ instance, onAddLog, onAddEntry }) {
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();

    const timeline = [
        ...instance.logs.map(l => ({ ...l, _sortDate: new Date(l.logged_at), _kind: 'log' })),
        ...instance.journalEntries.map(j => ({ ...j, _sortDate: new Date(j.created_at), _kind: 'journal' })),
    ].sort((a, b) => a._sortDate - b._sortDate);

    const latestDate = timeline.length > 0
        ? timeline[timeline.length - 1]._sortDate
        : null;

    const emoji = ICONS[instance.plant?.culinary_type] ?? '🌱';

    return (
        <div className={`plant-instance${expanded ? ' plant-instance-open' : ''}`}>
            <button className="plant-instance-header" onClick={() => setExpanded(v => !v)}>
                <span className="plant-instance-emoji">{emoji}</span>
                <div className="plant-instance-info">
                    <span className="plant-instance-name">{instance.plant?.name ?? 'Unknown plant'}</span>
                    {instance.location && (
                        <span className="plant-instance-loc">📍 {instance.location}</span>
                    )}
                </div>
                <div className="plant-instance-meta">
                    <span className="plant-instance-count">
                        {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
                    </span>
                    {latestDate && (
                        <span className="plant-instance-date">{formatDate(latestDate)}</span>
                    )}
                </div>
                <span className="plant-instance-chevron">{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <div className="plant-instance-body">
                    <div className="timeline">
                        {timeline.map(item =>
                            item._kind === 'log'
                                ? <LogItem     key={item.id} item={item} />
                                : <JournalItem key={item.id} item={item} />
                        )}
                    </div>
                    <div className="plant-instance-actions">
                        <Button size="sm" variant="outline-secondary" onClick={() => onAddLog(instance)}>
                            + Log Event
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => onAddEntry(instance)}>
                            + Journal Entry
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/log/${instance.rootLogId}`)}>
                            View detail →
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function JournalTab() {
    const { instances, loading, createLogEvent, createJournalEntry } = usePlantLogs();
    const [showLogModal,     setShowLogModal]     = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [activeInstance,   setActiveInstance]   = useState(null);

    const openAddLog = (instance = null) => {
        setActiveInstance(instance);
        setShowLogModal(true);
    };

    const openAddEntry = (instance = null) => {
        setActiveInstance(instance);
        setShowJournalModal(true);
    };

    if (loading) {
        return <div className="text-center mt-4"><Spinner animation="border" variant="secondary" /></div>;
    }

    return (
        <>
            <div className="journal-toolbar">
                <Button variant="outline-secondary" size="sm" onClick={() => openAddLog()}>
                    + Log Event
                </Button>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => openAddEntry()}
                    disabled={instances.length === 0}
                >
                    + Journal Entry
                </Button>
            </div>

            {instances.length === 0 ? (
                <div className="journal-empty">
                    <p className="text-muted mb-2">No plant logs yet.</p>
                    <Button variant="outline-secondary" size="sm" onClick={() => openAddLog()}>
                        Log your first plant
                    </Button>
                </div>
            ) : (
                <div className="plant-instances">
                    {instances.map(inst => (
                        <PlantInstance
                            key={inst.key}
                            instance={inst}
                            onAddLog={openAddLog}
                            onAddEntry={openAddEntry}
                        />
                    ))}
                </div>
            )}

            <LogEventModal
                show={showLogModal}
                onHide={() => setShowLogModal(false)}
                onSave={createLogEvent}
                defaultPlant={activeInstance?.plant ?? null}
            />
            <JournalEntryModal
                show={showJournalModal}
                onHide={() => setShowJournalModal(false)}
                onSave={createJournalEntry}
                instances={instances}
                defaultInstance={activeInstance}
            />
        </>
    );
}
