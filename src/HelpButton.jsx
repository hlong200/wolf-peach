import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'react-bootstrap';
import WelcomeModal from './WelcomeModal';
import './HelpButton.css';

export default function HelpButton() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('wolf-peach:welcomed'));
    const [showChat, setShowChat] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const openGuide = () => { setMenuOpen(false); setShowGuide(true); };
    const openChat  = () => { setMenuOpen(false); setShowChat(true); };

    return createPortal(
        <>
            <div className="help-fab-wrap" ref={menuRef}>
                {menuOpen && (
                    <div className="help-menu">
                        <button className="help-menu-item" onClick={openGuide}>
                            <span className="help-menu-icon">📖</span> Field Guide
                        </button>
                        <button className="help-menu-item" onClick={openChat}>
                            <span className="help-menu-icon">🌱</span> Ask the gardener
                        </button>
                    </div>
                )}
                <button
                    className={`help-fab${menuOpen ? ' help-fab-open' : ''}`}
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Help"
                >
                    ?
                </button>
            </div>

            <WelcomeModal forceShow={showGuide} onHide={() => setShowGuide(false)} />

            {showChat && (
                <GardenChat onClose={() => setShowChat(false)} />
            )}
        </>,
        document.body
    );
}

function GardenChat({ onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I\'m your garden guide. Ask me anything about growing vegetables, companion planting, or the plants in this catalog.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        setLoading(true);
        try {
            const history = messages.map(m => ({ role: m.role, content: m.text }));
            history.push({ role: 'user', content: text });
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wolf-peach-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ messages: history }),
            });
            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I couldn\'t reach the garden server. Try again in a moment.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <div className="garden-chat">
            <div className="chat-header">
                <span>🌿 Garden Guide</span>
                <button className="chat-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>{m.text}</div>
                ))}
                {loading && <div className="chat-bubble chat-bubble-assistant chat-typing">…</div>}
                <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
                <textarea
                    className="chat-input"
                    rows={2}
                    placeholder="Ask about growing, companions, timing…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                />
                <Button className="chat-send" onClick={send} disabled={loading || !input.trim()}>
                    Send
                </Button>
            </div>
        </div>
    );
}
