import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useFilteredPlants } from './lib/useFilteredPlants';
import { useFilters } from './lib/FilterProvider';
import FilterBar from './FilterBar';
import './SeasonalCalendar.css';

const PLANTING_SEASONS = {
  lettuce:       { spring: [6,7,8,9,10,11,12,13], fall: [24,25,26,27,28,29,30] },
  spinach:       { spring: [6,7,8,9,10,11,12,13], fall: [24,25,26,27,28,29,30] },
  broccoli:      { spring: [6,7,8,9], fall: [24,25,26,27] },
  cabbage:       { spring: [6,7,8,9], fall: [24,25,26,27] },
  carrot:        { spring: [6,7,8,9,10,11,12,13], fall: [24,25,26,27,28,29,30] },
  pea:           { spring: [6,7,8,9], fall: [24,25,26,27] },
  radish:        { spring: [6,7,8,9,10,11,12,13,14,15], fall: [24,25,26,27,28,29,30,31,32] },
  onion:         { spring: [6,7,8,9], fall: [27,28,29,30] },
  tomato:        { spring: [10,11,12,13,14,15,16] },
  pepper:        { spring: [10,11,12,13,14,15,16] },
  cucumber:      { spring: [14,15,16,17,18] },
  corn:          { spring: [14,15,16,17,18] },
  bean:          { spring: [14,15,16,17,18,19,20,21] },
  squash:        { spring: [14,15,16,17,18] },
  'sweet-potato':{ spring: [14,15,16,17,18] },
  potato:        { spring: [10,11,12,13,14] },
  beet:          { spring: [10,11,12,13,14], fall: [24,25,26,27,28] },
};

const WEEK_HEADERS = [
  'Jan 1-7',  'Jan 8-14',  'Jan 15-31',
  'Feb 1-7',  'Feb 8-14',  'Feb 15-28',
  'Mar 1-7',  'Mar 8-14',  'Mar 15-21', 'Mar 22-31',
  'Apr 1-7',  'Apr 8-14',  'Apr 15-30',
  'May 1-7',  'May 8-14',  'May 15-21', 'May 22-31',
  'Jun 1-7',  'Jun 8-14',  'Jun 15-30',
  'Jul 1-7',  'Jul 8-14',  'Jul 15-21', 'Jul 22-31',
  'Aug 1-7',  'Aug 8-14',  'Aug 15-31',
  'Sep 1-7',  'Sep 8-14',  'Sep 15-30',
  'Oct 1-7',  'Oct 8-14',  'Oct 15-21', 'Oct 22-31',
  'Nov 1-7',  'Nov 8-14',  'Nov 15-30',
  'Dec 1-7',  'Dec 8-14',  'Dec 15-21', 'Dec 22-31',
];

const WEEK_COUNT = WEEK_HEADERS.length;

const COLORS = {
  spring: '#4CAF50',
  fall:   '#FF9800',
  summer: '#FFC107',
};

// Maps month index → { offset, weeks } based on WEEK_HEADERS layout
const MONTH_OFFSETS     = [0, 3, 6, 10, 13, 17, 20, 24, 27, 30, 34, 37];
const MONTH_WEEK_COUNTS = [3, 3, 4,  3,  4,  3,  4,  3,  3,  4,  3,  4];

function getCurrentWeekIndex() {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), m + 1, 0).getDate();
  const weekInMonth = Math.min(
    Math.floor((d - 1) / daysInMonth * MONTH_WEEK_COUNTS[m]),
    MONTH_WEEK_COUNTS[m] - 1,
  );
  return MONTH_OFFSETS[m] + weekInMonth;
}

function normalizeCulinaryType(type) {
  if (!type) return null;
  return type.toLowerCase().trim().replace(/\s+/g, '-');
}

function getPlantingPeriods(culinaryType) {
  const key = normalizeCulinaryType(culinaryType);
  return PLANTING_SEASONS[key] || { spring: [], fall: [], summer: [] };
}

// Builds a CSS linear-gradient string with a hard stop per week — O(WEEK_COUNT)
function buildSeasonBg(seasons) {
  const springSet = new Set(seasons.spring || []);
  const fallSet   = new Set(seasons.fall   || []);
  const summerSet = new Set(seasons.summer || []);
  const stops = [];
  for (let i = 0; i < WEEK_COUNT; i++) {
    const color = springSet.has(i) ? COLORS.spring
                : fallSet.has(i)   ? COLORS.fall
                : summerSet.has(i) ? COLORS.summer
                : 'transparent';
    const s = (i       / WEEK_COUNT * 100).toFixed(3);
    const e = ((i + 1) / WEEK_COUNT * 100).toFixed(3);
    stops.push(`${color} ${s}%`, `${color} ${e}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

const PlantRow = memo(function PlantRow({ plant, seasonBg, onNavigate }) {
  return (
    <div className="plant-row">
      <div className="plant-label clickable" onClick={() => onNavigate(plant.id)}>
        <span className="plant-emoji">{plant.emoji}</span>
        <span className="plant-name">{plant.name}</span>
        <span className="plant-type">{plant.culinary_type}</span>
      </div>
      <div className="calendar-cells" style={{ background: seasonBg }} />
    </div>
  );
});

export default function SeasonalCalendar() {
  const navigate = useNavigate();
  const { seasonFilter } = useFilters();
  const { data: plants, loading, error } = useFilteredPlants();
  const currentWeek = useMemo(() => getCurrentWeekIndex(), []);

  const onNavigate = useCallback((id) => navigate(`/plant/${id}`), [navigate]);

  // Precompute gradients once per plants change
  const plantRows = useMemo(() =>
    plants.map(plant => {
      const seasons = getPlantingPeriods(plant.culinary_type);
      return { plant, seasons, seasonBg: buildSeasonBg(seasons) };
    }),
    [plants],
  );

  // Apply season filter client-side using PLANTING_SEASONS week data
  const visibleRows = useMemo(() => {
    if (!seasonFilter) return plantRows;
    return plantRows.filter(({ seasons }) => {
      const allWeeks = [
        ...(seasons.spring || []),
        ...(seasons.fall   || []),
        ...(seasons.summer || []),
      ];
      const active = allWeeks.includes(currentWeek);
      if (seasonFilter === 'planting') return active;
      if (seasonFilter === 'out-of-season') return !active;
      return true; // 'harvest' — no harvest data in PLANTING_SEASONS, show all
    });
  }, [plantRows, seasonFilter, currentWeek]);

  if (loading) {
    return (
      <Container className="seasonal-calendar">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="seasonal-calendar">
      <div className="calendar-header">
        <h1>Seasonal Planting Calendar</h1>
        <p className="text-muted">Plan your garden with optimal planting times for each crop</p>
      </div>

      <FilterBar />

      <div className="calendar-container">
        <div className="calendar-grid">
          <div className="week-headers">
            <div className="plant-label" />
            {WEEK_HEADERS.map((week, i) => (
              <div key={i} className="week-header">
                <div className="week-label">{week}</div>
              </div>
            ))}
          </div>

          {visibleRows.map(({ plant, seasonBg }) => (
            <PlantRow
              key={plant.id}
              plant={plant}
              seasonBg={seasonBg}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <div className="calendar-legend">
        <h5>Legend</h5>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: COLORS.spring }}></div>
            <span>Spring Planting 🌱</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: COLORS.fall }}></div>
            <span>Fall Planting 🍂</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: COLORS.summer }}></div>
            <span>Summer Planting ☀️</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
