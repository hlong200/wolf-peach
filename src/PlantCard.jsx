import { useState } from 'react';
import { Card, Badge, Accordion } from 'react-bootstrap';
import { useFavorites } from './lib/FavoritesProvider';
import './PlantCard.css';

const ICONS = {
  tomato:'🍅', pepper:'🌶️', squash:'🎃', cabbage:'🥬', broccoli:'🥦',
  carrot:'🥕', corn:'🌽', bean:'🫘', spinach:'🌿', lettuce:'🥗',
  cucumber:'🥒', onion:'🧅', beet:'🫜', radish:'🫜', pea:'🫛',
  potato: '🥔', 'sweet-potato': '🍠'
};

const SUN = { full:'Full sun', partial:'Partial shade', shade:'Full shade' };
const SEASON_TAGS = ['cool-season','warm-season','overwintering'];
const GROWTH_TAGS = ['indeterminate','determinate'];

const fmt = t => t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export default function PlantCard({ plant, species }) {
  const seasonTag = plant.tags.find(t => SEASON_TAGS.includes(t));
  const growthTag = plant.tags.find(t => GROWTH_TAGS.includes(t));
  const qv = plant.quick_view;
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(plant.id);
  const [popping, setPopping] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleFavorite(plant.id);
    setPopping(true);
  };

  return (
    <Card
      className={`plant-card h-100${popping ? ' plant-card-pop' : ''}`}
      onAnimationEnd={() => setPopping(false)}
    >
      <div
        className={`fav-ribbon ${isFav ? 'fav-ribbon-on' : 'fav-ribbon-off'}${popping ? ' fav-ribbon-snap' : ''}`}
        onClick={handleToggle}
        title={isFav ? 'Remove from garden' : 'Add to garden'}
      >
        {isFav ? '★' : '☆'}
      </div>
      <div className="plant-img-area">
        {plant.thumbnail_url
          ? <img
              src={plant.thumbnail_url}
              alt={plant.name}
              className="plant-thumbnail"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
          : null}
        <span
          className="plant-emoji"
          style={{ display: plant.thumbnail_url ? 'none' : 'block' }}
        >
          {ICONS[plant.culinary_type] || '🌱'}
        </span>
      </div>

      <Card.Body className="pt-1 pb-2 px-3">
        <Card.Title>{plant.name} {fmt(plant.culinary_type)}</Card.Title>
        <Card.Subtitle>{plant.species}</Card.Subtitle>

        <div className="d-flex flex-wrap gap-1 mb-1">
          <Badge className="pill-days">{plant.days_to_maturity} days</Badge>
          <Badge className="pill-sun">{SUN[plant.sun] || plant.sun}</Badge>
          <Badge className={`pill-${plant.difficulty}`}>{fmt(plant.difficulty)}</Badge>
          {growthTag && <Badge className="pill-tag">{fmt(growthTag)}</Badge>}
          {seasonTag && (
            <Badge className="pill-season">
              {fmt(seasonTag.replace('-season', ''))} season
            </Badge>
          )}
        </div>

        {qv && (
          <Accordion className="plant-accordion mt-1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Quick view</Accordion.Header>
              <Accordion.Body>
                <div className="companion-label mt-2">Good with</div>
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {qv.companions_good.map(c => (
                    <span key={c} className="chip-good">{c}</span>
                  ))}
                </div>

                <div className="companion-label">Keep away</div>
                <div className="d-flex flex-wrap gap-1">
                  {qv.companions_bad.map(c => (
                    <span key={c} className="chip-bad">{c}</span>
                  ))}
                </div>

                {qv.tip && <p className="tip-text mb-0">{qv.tip}</p>}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
}