import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from './lib/plantIcons';
import './GhostFlyAnimation.css';

export default function GhostFlyAnimation({ plant, fromRect, toRect, onComplete }) {
    const elRef = useRef(null);

    useEffect(() => {
        const el = elRef.current;
        if (!el || !fromRect || !toRect) return;

        const dx = toRect.x - fromRect.x;
        const dy = toRect.y - fromRect.y;
        const scaleX = toRect.width / fromRect.width;
        const scaleY = toRect.height / fromRect.height;

        // Let browser paint initial position, then trigger transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
                el.style.opacity = '0';
            });
        });

        const onEnd = () => onComplete?.();
        el.addEventListener('transitionend', onEnd, { once: true });
        return () => el.removeEventListener('transitionend', onEnd);
    }, [fromRect, toRect, onComplete]);

    return createPortal(
        <div
            ref={elRef}
            className="ghost-fly"
            style={{
                left: fromRect.x,
                top: fromRect.y,
                width: fromRect.width,
                height: fromRect.height,
            }}
        >
            <span className="ghost-fly-emoji">{ICONS[plant.culinary_type] || '🌱'}</span>
            <span className="ghost-fly-name">{plant.name}</span>
        </div>,
        document.body
    );
}
