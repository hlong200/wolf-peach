import { Dropdown, Button, Form, DropdownButton } from "react-bootstrap";
import { useFilters } from "./lib/FilterProvider";

function FilterBar({ compact = false }) {
    const { textFilter, setTextFilter, sunFilter, setSunFilter,
            difficultyFilter, setDifficultyFilter, sortBy, setSortBy,
            sortOrder, setSortOrder } = useFilters();

    const SORT_LABELS = {
        name: 'Name',
        days: "Days",
        difficulty: 'Difficulty'
    };

    const SUN_LABELS = {
        full: "full sun",
        partial: "part shade",
        shade: "shade"
    };

    const controls = (
        <>
            <Form.Control
                type="text"
                size="sm"
                placeholder="cherokee purple"
                value={textFilter}
                onChange={e => setTextFilter(e.target.value)}
                style={{ minWidth: compact ? 120 : undefined }} />
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
            <DropdownButton size="sm" title={SORT_LABELS[sortBy]}>
                <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
                <Dropdown.Item onClick={() => setSortBy('days')}>Days to maturity</Dropdown.Item>
                <Dropdown.Item onClick={() => setSortBy('difficulty')}>Difficulty</Dropdown.Item>
            </DropdownButton>
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
        return (
            <div className="filterbar-compact">
                <div className="filterbar-compact-inner">
                    {controls}
                </div>
            </div>
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
