import { Dropdown, Button, Form, InputGroup } from "react-bootstrap";
import { createPortal } from "react-dom";
import { useFilters } from "./lib/FilterProvider";
import './FilterBar.css';

function FilterBar({ compact = false }) {
    const { textFilter, setTextFilter, sunFilter, setSunFilter,
            difficultyFilter, setDifficultyFilter, seasonFilter, setSeasonFilter,
            sortBy, setSortBy, sortOrder, setSortOrder } = useFilters();

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
            {/* ── Search ── */}
            <div className="filter-group filter-group-search">
                <InputGroup size="sm">
                    <Form.Control
                        type="text"
                        placeholder="cherokee purple"
                        value={textFilter}
                        onChange={e => setTextFilter(e.target.value)} />
                    {textFilter && (
                        <Button variant="outline-secondary" onClick={() => setTextFilter('')}>✕</Button>
                    )}
                </InputGroup>
            </div>

            <span className="filter-sep" />

            {/* ── Plant traits: difficulty + sun ── */}
            <div className="filter-group">
                {['easy', 'moderate', 'hard'].map(option => (
                    <Button
                        key={option}
                        size="sm"
                        className={`rounded-pill py-0 text-nowrap${difficultyFilter === option ? ' filter-active-difficulty' : ''}`}
                        variant="outline-secondary"
                        onClick={() => setDifficultyFilter(difficultyFilter === option ? null : option)}
                    >
                        {option}
                    </Button>
                ))}
                {['full', 'partial', 'shade'].map(option => (
                    <Button
                        key={option}
                        size="sm"
                        className={`rounded-pill py-0 text-nowrap${sunFilter === option ? ' filter-active-sun' : ''}`}
                        variant="outline-secondary"
                        onClick={() => setSunFilter(sunFilter === option ? null : option)}
                    >
                        {SUN_LABELS[option]}
                    </Button>
                ))}
            </div>

            <span className="filter-sep" />

            {/* ── Season ── */}
            <div className="filter-group">
                {[
                    { value: 'harvest',       label: 'In Season' },
                    { value: 'planting',      label: 'Plant Now' },
                    { value: 'out-of-season', label: 'Out of Season' },
                ].map(({ value, label }) => (
                    <Button
                        key={value}
                        size="sm"
                        className={`rounded-pill py-0 text-nowrap${seasonFilter === value ? ' filter-active-season' : ''}`}
                        variant="outline-secondary"
                        onClick={() => setSeasonFilter(seasonFilter === value ? null : value)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            <span className="filter-sep" />

            {/* ── Sort ── */}
            <div className="filter-group">
                {compact ? (() => {
                    const keys = Object.keys(SORT_LABELS);
                    const next = keys[(keys.indexOf(sortBy) + 1) % keys.length];
                    return (
                        <Button
                            size="sm"
                            className="rounded-pill py-0 text-nowrap filter-active-sort"
                            variant="outline-secondary"
                            onClick={() => setSortBy(next)}
                        >
                            {SORT_LABELS[sortBy]}
                        </Button>
                    );
                })() : (
                    <Dropdown>
                        <Dropdown.Toggle size="sm" variant="outline-secondary" className="filter-active-sort">
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
            </div>
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
            <div className="d-flex align-items-center gap-0">
                {controls}
            </div>
        </div>
    );
}

export default FilterBar;
