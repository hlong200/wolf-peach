import { createPortal } from 'react-dom';
import './AlphabetScrubber.css';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function scrollToSection(letter) {
    const el = document.getElementById(`section-${letter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function AlphabetScrubber({ availableLetters }) {
    const handleTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el?.dataset?.letter && availableLetters.includes(el.dataset.letter)) {
            scrollToSection(el.dataset.letter);
        }
    };

    return createPortal(
        <div className="alphabet-scrubber" onTouchMove={handleTouchMove} onTouchStart={handleTouchMove}>
            {ALL_LETTERS.map(letter => {
                const active = availableLetters.includes(letter);
                return (
                    <span
                        key={letter}
                        data-letter={letter}
                        className={`scrubber-letter ${active ? 'scrubber-letter-active' : 'scrubber-letter-inactive'}`}
                        onClick={() => active && scrollToSection(letter)}
                    >
                        {letter}
                    </span>
                );
            })}
        </div>,
        document.body
    );
}
