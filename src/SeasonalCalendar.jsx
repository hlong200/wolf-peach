import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import './SeasonalCalendar.css';

// Planting season data by culinary type (weeks are 0-indexed: 0=Week 1 of Jan, 40=Week 4 of Dec)
const PLANTING_SEASONS = {
  // Cool season crops - spring and fall planting
  lettuce: { spring: [6, 7, 8, 9, 10, 11, 12, 13], fall: [24, 25, 26, 27, 28, 29, 30] }, // Mar-Apr, Aug-Sep
  spinach: { spring: [6, 7, 8, 9, 10, 11, 12, 13], fall: [24, 25, 26, 27, 28, 29, 30] },
  broccoli: { spring: [6, 7, 8, 9], fall: [24, 25, 26, 27] },
  cabbage: { spring: [6, 7, 8, 9], fall: [24, 25, 26, 27] },
  carrot: { spring: [6, 7, 8, 9, 10, 11, 12, 13], fall: [24, 25, 26, 27, 28, 29, 30] },
  pea: { spring: [6, 7, 8, 9], fall: [24, 25, 26, 27] },
  radish: { spring: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], fall: [24, 25, 26, 27, 28, 29, 30, 31, 32] },
  onion: { spring: [6, 7, 8, 9], fall: [27, 28, 29, 30] },

  // Warm season crops - late spring/summer planting
  tomato: { spring: [10, 11, 12, 13, 14, 15, 16] }, // Apr-Jun
  pepper: { spring: [10, 11, 12, 13, 14, 15, 16] },
  cucumber: { spring: [14, 15, 16, 17, 18] }, // May-Jun
  corn: { spring: [14, 15, 16, 17, 18] },
  bean: { spring: [14, 15, 16, 17, 18, 19, 20, 21] }, // May-Jul
  squash: { spring: [14, 15, 16, 17, 18] },
  'sweet-potato': { spring: [14, 15, 16, 17, 18] },

  // Root vegetables
  potato: { spring: [10, 11, 12, 13, 14] }, // Apr-May
  beet: { spring: [10, 11, 12, 13, 14], fall: [24, 25, 26, 27, 28] }
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Create week headers - each month condensed to 3-4 weeks
const WEEK_HEADERS = [
  // Jan (3 weeks)
  'Jan 1-7', 'Jan 8-14', 'Jan 15-31',
  // Feb (3 weeks)
  'Feb 1-7', 'Feb 8-14', 'Feb 15-28',
  // Mar (4 weeks)
  'Mar 1-7', 'Mar 8-14', 'Mar 15-21', 'Mar 22-31',
  // Apr (3 weeks)
  'Apr 1-7', 'Apr 8-14', 'Apr 15-30',
  // May (4 weeks)
  'May 1-7', 'May 8-14', 'May 15-21', 'May 22-31',
  // Jun (3 weeks)
  'Jun 1-7', 'Jun 8-14', 'Jun 15-30',
  // Jul (4 weeks)
  'Jul 1-7', 'Jul 8-14', 'Jul 15-21', 'Jul 22-31',
  // Aug (3 weeks)
  'Aug 1-7', 'Aug 8-14', 'Aug 15-31',
  // Sep (3 weeks)
  'Sep 1-7', 'Sep 8-14', 'Sep 15-30',
  // Oct (4 weeks)
  'Oct 1-7', 'Oct 8-14', 'Oct 15-21', 'Oct 22-31',
  // Nov (3 weeks)
  'Nov 1-7', 'Nov 8-14', 'Nov 15-30',
  // Dec (4 weeks)
  'Dec 1-7', 'Dec 8-14', 'Dec 15-21', 'Dec 22-31'
];

const COLORS = {
  spring: '#4CAF50',
  fall: '#FF9800',
  summer: '#FFC107'
};

export default function SeasonalCalendar() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch plants from Supabase
    const fetchPlants = async () => {
      try {
        const response = await fetch('/data/vegetables.json');
        const data = await response.json();
        setPlants(data);
      } catch (error) {
        console.error('Error fetching plants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, []);

  const getPlantingPeriods = (culinaryType) => {
    return PLANTING_SEASONS[culinaryType] || { spring: [] };
  };

  const filteredPlants = plants.filter(plant => {
    if (filter === 'all') return true;
    return plant.culinary_type === filter;
  });

  const uniqueTypes = [...new Set(plants.map(p => p.culinary_type))].sort();

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

        <Form.Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
          style={{ maxWidth: '200px' }}
        >
          <option value="all">All Plants</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="calendar-container">
        {/* Week headers */}
        <div className="calendar-grid">
          <div className="week-headers">
            <div className="plant-label"></div>
            {WEEK_HEADERS.map((week, index) => (
              <div key={index} className="week-header">
                <div className="week-label">{week}</div>
              </div>
            ))}
          </div>

          {/* Plant rows */}
          {filteredPlants.map(plant => {
            const seasons = getPlantingPeriods(plant.culinary_type);

            return (
              <div key={plant.id} className="plant-row">
                <div 
                  className="plant-label clickable"
                  onClick={() => navigate(`/plant/${plant.id}`)}
                >
                  <span className="plant-emoji">{plant.emoji}</span>
                  <span className="plant-name">{plant.name}</span>
                  <span className="plant-type">{plant.culinary_type}</span>
                </div>

                {WEEK_HEADERS.map((_, weekIndex) => {
                  let periodType = null;

                  // Check if this week is in any planting season
                  if (seasons.spring && seasons.spring.includes(weekIndex)) {
                    periodType = 'spring';
                  } else if (seasons.fall && seasons.fall.includes(weekIndex)) {
                    periodType = 'fall';
                  } else if (seasons.summer && seasons.summer.includes(weekIndex)) {
                    periodType = 'summer';
                  }

                  return (
                    <div
                      key={weekIndex}
                      className={`calendar-cell ${periodType ? 'active' : ''}`}
                      style={{
                        backgroundColor: periodType ? COLORS[periodType] : 'transparent'
                      }}
                    >
                      {periodType && (
                        <div className="planting-indicator">
                          {periodType === 'spring' && '🌱'}
                          {periodType === 'fall' && '🍂'}
                          {periodType === 'summer' && '☀️'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
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