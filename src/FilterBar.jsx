import { Dropdown, Stack, Button, Form, DropdownButton } from "react-bootstrap";

function FilterBar({
    textFilter,
    setTextFilter,
    sunFilter,
    setSunFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortBy,
    setSortBy,
    compact
    }) {

    const SORT_LABELS = {
        name: 'Name',
        days: "Days to maturity",
        difficulty: 'Difficulty'
    };

    const SUN_LABELS = {
        full: "full sun",
        partial: "part shade",
        shade: "shade"
    };

    return (
        <div className="sticky-top py-2">
            <Stack direction="horizontal" gap={2} className="mb-4 shadow-sm rounded p-3">
                <div className="d-flex align-items-center gap-2">
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="cherokee purple"
                        value={textFilter}
                        onChange={e => setTextFilter(e.target.value)} />
                </div>
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
                <DropdownButton title={SORT_LABELS[sortBy]}>
                    <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSortBy('days')}>Days to maturity</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSortBy('difficulty')}>Difficulty</Dropdown.Item>
                </DropdownButton>
            </Stack>
        </div>
    )
};

export default FilterBar;