import { Dropdown, Button, Form, InputGroup } from "react-bootstrap";
import { createPortal } from "react-dom";
import { useFilters } from "./lib/FilterProvider";
import './FilterBar.css';

function FilterBar({ compact = false }) {
    const { textFilter, setTextFilter, sunFilter, setSunFilter,
            difficultyFilter, setDifficultyFilter, sortBy, setSortBy,
            sortOrder, setSortOrder } = useFilters();

    const SORT_LABELS = {
        name: 'Name',
        days: 'Days',
        difficulty: 'Difficulty',
        culinary_type: 'Type',
    };

    const SUN_LABELS = {
        full: "full sun",
        partial: "part shade",
        shade: "shade"
    };

    const controls = (
        <>
            <InputGroup size="sm" style={{ minWidth: compact ? 120 : 180 }}>
                <Form.Control
                    type="text"
                    placeholder="cherokee purple"
                    value={textFilter}
                    onChange={e => setTextFilter(e.target.value)} />
                {textFilter && (
                    <Button variant="outline-secondary" onClick={() => setTextFilter('')}>✕</Button>
                )}
            </InputGroup>
            {['easy', 'moderate', 'hard'].map(option => (
                <Button
                    key={option}
                    size="sm"
                    className="rounded-pill py-0 text-nowrap"
                    variant={difficultyFilter === option ? 'success' : 'outline-secondary'}
                    onClick={() => setDifficultyFilter(difficultyFilter === option ? null : option)}
                >
                    {option}
                </Button>
            ))}
            {['full', 'partial', 'shade'].map(option => (
                <Button
                    key={option}
                    size="sm"
                    className="rounded-pill py-0 text-nowrap"
                    variant={sunFilter === option ? 'success' : 'outline-secondary'}
                    onClick={() => setSunFilter(sunFilter === option ? null : option)}
                >
                    {SUN_LABELS[option]}
                </Button>
            ))}
            {compact ? (() => {
                const keys = Object.keys(SORT_LABELS);
                const next = keys[(keys.indexOf(sortBy) + 1) % keys.length];
                const SORT_VARIANTS = {
                    name: 'outline-secondary',
                    days: 'success',
                    difficulty: 'danger',
                    culinary_type: 'warning',
                };
                return (
                    <Button
                        size="sm"
                        className="rounded-pill py-0 text-nowrap"
                        variant={SORT_VARIANTS[sortBy]}
                        onClick={() => setSortBy(next)}
                    >
                        {SORT_LABELS[sortBy]}
                    </Button>
                );
            })() : (
                <Dropdown>
                    <Dropdown.Toggle size="sm" variant="secondary">
                        {SORT_LABELS[sortBy]}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy('days')}>Days to maturity</Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy('difficulty')}>Difficulty</Dropdown.Item>
                        <Dropdown.Item onClick={() => setSortBy('culinary_type')}>Type</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )}
            <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
                {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
        </>
    );

    if (compact) {
        return createPortal(
            <div className="filterbar-compact">
                <div className="filterbar-compact-inner">
                    {controls}
                </div>
            </div>,
            document.body
        );
    }

    return (
        <div className="filterbar-desktop sticky-top py-2">
            <div className="d-flex align-items-center gap-2">
                {controls}
            </div>
        </div>
    );
}

export default FilterBar;
