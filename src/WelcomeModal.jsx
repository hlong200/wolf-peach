import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import './WelcomeModal.css';

const STORAGE_KEY = 'wolf-peach:welcomed';

export default function WelcomeModal({ forceShow = false, onHide }) {
    const [show, setShow] = useState(() => !localStorage.getItem(STORAGE_KEY));

    useEffect(() => {
        if (forceShow) setShow(true);
    }, [forceShow]);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setShow(false);
        onHide?.();
    };

    return (
        <Modal show={show} onHide={dismiss} centered className="welcome-modal" size="lg">
            <Modal.Body className="welcome-body">
                <div className="welcome-stamp">🍅</div>

                <h2 className="welcome-title">Wolf Peach</h2>
                <p className="welcome-subtitle">A field guide to growing vegetables</p>

                <hr className="welcome-rule" />

                <div className="welcome-sections">
                    <div className="welcome-section">
                        <span className="welcome-section-label">The Catalog</span>
                        <p>Browse over 50 heirloom and open-pollinated vegetable varieties. Each card shows days to maturity, sun requirements, difficulty, and growing season at a glance.</p>
                    </div>

                    <div className="welcome-section">
                        <span className="welcome-section-label">Filtering & Sorting</span>
                        <p>Use the filter bar to narrow by difficulty or sun exposure, sort by name, days to maturity, or difficulty, and search by variety name, type, or species.</p>
                    </div>

                    <div className="welcome-section">
                        <span className="welcome-section-label">Quick View</span>
                        <p>Expand any card to see companion planting suggestions — which plants grow well together and which to keep apart — plus a growing tip.</p>
                    </div>

                    <div className="welcome-section">
                        <span className="welcome-section-label">My Garden</span>
                        <p>Star any variety to add it to your personal garden list. Sign in to keep your garden saved across devices.</p>
                    </div>
                </div>

                <hr className="welcome-rule" />

                <Button className="welcome-btn" onClick={dismiss}>
                    Start browsing →
                </Button>

                <p className="welcome-revisit">Find this guide again with the <strong>?</strong> button.</p>
            </Modal.Body>
        </Modal>
    );
}
