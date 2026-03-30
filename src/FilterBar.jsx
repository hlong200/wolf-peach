import { Dropdown, InputGroup, Stack, Button, FormControl, Form, DropdownButton } from "react-bootstrap";
import { useState } from "react";

function FilterBar({
    textFilter,
    setTextFilter,
    sunFilter,
    setSunFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortBy,
    setSortBy
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
        <>
            <Stack direction="horizontal" gap={2} className="mb-4">
                <InputGroup>
                    <Form>
                        <Form.Label>Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="cherokee purple"
                            value={textFilter}
                            onChange={e => setTextFilter(e.target.value)} />
                    </Form>
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
                <DropdownButton title={SORT_LABELS[sortBy]}>
                    <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSortBy('days')}>Days to maturity</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSortBy('difficulty')}>Difficulty</Dropdown.Item>
                </DropdownButton>
            </Stack>
        </>
    )
};

export default FilterBar;