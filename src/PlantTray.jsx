import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlantTray } from './lib/PlantTrayProvider';
import { useDragState } from './lib/DragStateProvider';
import { useFavorites } from './lib/FavoritesProvider';
import { useIsMobile } from './lib/customHooks';
import TrayCard from './TrayCard';
import GhostFlyAnimation from './GhostFlyAnimation';
import './PlantTray.css';

export const TRAY_WIDTH = 280;
const TRAY_MIN_HEIGHT = 120;
export const TRAY_MAX_BODY_HEIGHT = 400;
const SNAP_THRESHOLD = 150;
const PAD = 16;
const MIN_SNAP_GAP = 24; // minimum px gap between adjacent snap point edges

// Each snap point has a position and a glowAnchor — the viewport corner/edge
// the glow radiates from (the point that will be half off-screen)
function getSnapPoints(trayHeight) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const tw = TRAY_WIDTH;
    const th = trayHeight;

    const corners = {
        tl: { x: PAD,              y: PAD,               glowAnchor: [0, 0] },
        tr: { x: W - tw - PAD,     y: PAD,               glowAnchor: [W, 0] },
        bl: { x: PAD,              y: H - th - PAD,       glowAnchor: [0, H] },
        br: { x: W - tw - PAD,     y: H - th - PAD,       glowAnchor: [W, H] },
    };

    const points = { ...corners };

    // Top/bottom center — only if enough horizontal room so it doesn't crowd corners
    const cx = W / 2 - tw / 2;
    const tcx = PAD + tw;           // right edge of tl
    const trx = W - tw - PAD;      // left edge of tr
    if (cx - tcx >= MIN_SNAP_GAP && trx - (cx + tw) >= MIN_SNAP_GAP) {
        points.tc = { x: cx, y: PAD,          glowAnchor: [W / 2, 0] };
        points.bc = { x: cx, y: H - th - PAD, glowAnchor: [W / 2, H] };
    }

    // Left/right center — only on large screens and if enough vertical room
    if (W >= 1200) {
        const cy = H / 2 - th / 2;
        const tly = PAD + th;           // bottom edge of tl
        const bly = H - th - PAD;      // top edge of bl
        if (cy - tly >= MIN_SNAP_GAP && bly - (cy + th) >= MIN_SNAP_GAP) {
            points.ml = { x: PAD,          y: cy, glowAnchor: [0, H / 2] };
            points.mr = { x: W - tw - PAD, y: cy, glowAnchor: [W, H / 2] };
        }
    }

    return points;
}

function getNearestSnap(x, y, trayHeight) {
    const cx = x + TRAY_WIDTH / 2;
    const cy = y + trayHeight / 2;
    const points = getSnapPoints(trayHeight);
    let best = null;
    let bestDist = SNAP_THRESHOLD;
    for (const [key, pos] of Object.entries(points)) {
        const pcx = pos.x + TRAY_WIDTH / 2;
        const pcy = pos.y + trayHeight / 2;
        const dist = Math.hypot(cx - pcx, cy - pcy);
        if (dist < bestDist) { bestDist = dist; best = key; }
    }
    return best;
}

function snapPosition(key, trayHeight) {
    return getSnapPoints(trayHeight)[key] ?? null;
}

export default function PlantTray() {
    const { trayPlants, addToTray, removeFromTray, clearTray, lastAdded } = usePlantTray();
    const { dragging, clearDragging } = useDragState();
    const { favorites, toggleFavorite } = useFavorites();
    const isMobile = useIsMobile();

    const [open, setOpen] = useState(true);
    const [minimized, setMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 120 });
    const [snappedTo, setSnappedTo] = useState(null);
    const [snapPreview, setSnapPreview] = useState(null);
    const [isWindowDragging, setIsWindowDragging] = useState(false);
    const [trayHeight, setTrayHeight] = useState(TRAY_MIN_HEIGHT);
    const [ghost, setGhost] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const dropZoneRef = useRef(null);
    const trayWindowRef = useRef(null);
    const draggingWindow = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Track actual rendered tray height via ResizeObserver so snap points stay accurate.
    // If the tray grows and the current snap key is no longer valid, clear it so
    // the tray falls back to its free position rather than crashing.
    useEffect(() => {
        if (isMobile || !trayWindowRef.current) return;
        const ro = new ResizeObserver(entries => {
            const h = entries[0]?.contentRect.height;
            if (!h) return;
            setTrayHeight(h);
            setSnappedTo(prev => {
                if (!prev) return prev;
                const stillValid = snapPosition(prev, h) !== null;
                return stillValid ? prev : null;
            });
        });
        ro.observe(trayWindowRef.current);
        return () => ro.disconnect();
    }, [isMobile, minimized]);

    // Desktop window dragging
    const onHandleMouseDown = useCallback((e) => {
        if (isMobile) return;
        draggingWindow.current = true;
        setIsWindowDragging(true);
        dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        e.preventDefault();
    }, [isMobile, position]);

    useEffect(() => {
        if (isMobile) return;
        const onMove = (e) => {
            if (!draggingWindow.current) return;
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            setPosition({ x, y });
            setSnappedTo(null);
            setSnapPreview(getNearestSnap(x, y, trayHeight));
        };
        const onUp = (e) => {
            if (!draggingWindow.current) return;
            draggingWindow.current = false;
            setIsWindowDragging(false);
            const x = e.clientX - dragOffset.current.x;
            const y = e.clientY - dragOffset.current.y;
            const key = getNearestSnap(x, y, trayHeight);
            if (key) {
                setSnappedTo(key);
                setPosition(snapPosition(key, trayHeight));
            }
            setSnapPreview(null);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isMobile, trayHeight]);

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    };

    const onDragLeave = () => setDragOver(false);

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        clearDragging();
        let plantData;
        try { plantData = JSON.parse(e.dataTransfer.getData('application/x-plant')); }
        catch { return; }
        const { id, name, culinary_type, sourceRect } = plantData;
        addToTray(id, name, culinary_type);
        const toRect = dropZoneRef.current?.getBoundingClientRect();
        if (sourceRect && toRect) {
            setGhost({ plant: { id, name, culinary_type }, fromRect: sourceRect, toRect });
        }
    };

    const handleAddAll = () => {
        trayPlants.forEach(p => {
            if (!favorites.includes(p.id)) toggleFavorite(p.id, p.name);
        });
    };

    const count = trayPlants.length;

    // Mobile bottom sheet
    if (isMobile) {
        return createPortal(
            <>
                <button className="tray-fab" onClick={() => setOpen(v => !v)} aria-label="Plant tray">
                    🌿{count > 0 && <span className="tray-badge">{count}</span>}
                </button>
                <div className={`tray-sheet${open ? ' tray-sheet-open' : ''}`}>
                    <div className="tray-sheet-handle-bar" />
                    <TrayHeader count={count} onClear={clearTray} onAddAll={handleAddAll} showAddAll={count > 0} onClose={() => setOpen(false)} />
                    <TrayBody trayPlants={trayPlants} lastAdded={lastAdded} removeFromTray={removeFromTray} dropZoneRef={dropZoneRef} dragOver={false} />
                </div>
                {ghost && <GhostFlyAnimation plant={ghost.plant} fromRect={ghost.fromRect} toRect={ghost.toRect} onComplete={() => setGhost(null)} />}
            </>,
            document.body
        );
    }

    if (minimized) {
        return createPortal(
            <button className="tray-minimized" onClick={() => setMinimized(false)} aria-label="Open plant tray">
                🌿 Tray {count > 0 && <span className="tray-badge">{count}</span>}
            </button>,
            document.body
        );
    }

    const snappedPos = snappedTo ? snapPosition(snappedTo, trayHeight) : null;
    const pos = snappedPos ?? position;

    // Glow indicators — anchored to screen edges, partially off-screen
    const glowIndicators = isWindowDragging
        ? Object.entries(getSnapPoints(trayHeight)).map(([key, point]) => (
            <div
                key={key}
                className={`tray-snap-glow${snapPreview === key ? ' tray-snap-glow-active' : ''}`}
                style={{ left: point.glowAnchor[0], top: point.glowAnchor[1] }}
            />
        ))
        : null;

    return createPortal(
        <>
            {glowIndicators}
            <div
                ref={trayWindowRef}
                className={`tray-window${dragging ? ' tray-drop-ready' : ''}`}
                style={{ left: pos.x, top: pos.y, width: TRAY_WIDTH }}
            >
                <div className="tray-header" onMouseDown={onHandleMouseDown}>
                    <span className="tray-title">🌿 Plant Tray {count > 0 && <span className="tray-badge">{count}</span>}</span>
                    <div className="tray-header-actions">
                        {count > 0 && <button className="tray-action-btn" onClick={handleAddAll} title="Add all to garden">★ All</button>}
                        {count > 0 && <button className="tray-action-btn tray-action-clear" onClick={clearTray} title="Clear tray">✕ Clear</button>}
                        <button className="tray-action-btn" onClick={() => setMinimized(true)} title="Minimize">─</button>
                    </div>
                </div>
                <TrayBody
                    trayPlants={trayPlants}
                    lastAdded={lastAdded}
                    removeFromTray={removeFromTray}
                    dropZoneRef={dropZoneRef}
                    dragOver={dragOver}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                />
            </div>
            {ghost && <GhostFlyAnimation plant={ghost.plant} fromRect={ghost.fromRect} toRect={ghost.toRect} onComplete={() => setGhost(null)} />}
        </>,
        document.body
    );
}

function TrayHeader({ count, onClear, onAddAll, showAddAll, onClose }) {
    return (
        <div className="tray-sheet-header">
            <span className="tray-title">🌿 Plant Tray {count > 0 && <span className="tray-badge">{count}</span>}</span>
            <div className="tray-header-actions">
                {showAddAll && <button className="tray-action-btn" onClick={onAddAll}>★ Add all</button>}
                {count > 0 && <button className="tray-action-btn tray-action-clear" onClick={onClear}>✕ Clear</button>}
                {onClose && <button className="tray-action-btn" onClick={onClose} aria-label="Close tray">╲╱</button>}
            </div>
        </div>
    );
}

function TrayBody({ trayPlants, lastAdded, removeFromTray, dropZoneRef, dragOver, onDragOver, onDragLeave, onDrop }) {
    return (
        <div
            ref={dropZoneRef}
            className={`tray-body${dragOver ? ' tray-body-dragover' : ''}${trayPlants.length === 0 ? ' tray-body-empty' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {trayPlants.length === 0 ? (
                <p className="tray-empty-hint">Drag plants here to collect them</p>
            ) : (
                trayPlants.map(p => (
                    <TrayCard key={p.id} plant={p} isNew={lastAdded === p.id} onRemove={removeFromTray} />
                ))
            )}
        </div>
    );
}
