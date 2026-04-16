import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Accordion } from 'react-bootstrap';
import { useFavorites } from './lib/FavoritesProvider';
import { usePlantTray } from './lib/PlantTrayProvider';
import { useDragState } from './lib/DragStateProvider';
import { useIsMobile } from './lib/customHooks';
import { ICONS } from './lib/plantIcons';
import { computeSeasonStatus } from './lib/seasonUtils';
import './PlantCard.css';

const SUN = { full:'Full sun', partial:'Partial shade', shade:'Full shade' };
const SEASON_TAGS = ['cool-season','warm-season','overwintering'];
const GROWTH_TAGS = ['indeterminate','determinate'];

// Converts hyphenated tag slugs to Title Case for display
const fmt = t => t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export default function PlantCard({ plant, lastFrost }) {
  const navigate = useNavigate();
  const seasonTag = plant.tags.find(t => SEASON_TAGS.includes(t));
  const growthTag = plant.tags.find(t => GROWTH_TAGS.includes(t));
  const seasonStatus = computeSeasonStatus(plant.season, lastFrost);
  const { favorites, toggleFavorite } = useFavorites();
  const { addToTray } = usePlantTray();
  const { setDragging, clearDragging } = useDragState();
  const isMobile = useIsMobile();
  const isFav = favorites.includes(plant.id);

  const [popping, setPopping] = useState(false);
  const [draggingThis, setDraggingThis] = useState(false);
  const [jiggling, setJiggling] = useState(false);
  const longPressTimer = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleFavorite(plant.id, plant.name);
    setPopping(true);
  };

  // Desktop drag handlers
  const handleDragStart = (e) => {
    const sourceRect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-plant', JSON.stringify({
      id: plant.id, name: plant.name, culinary_type: plant.culinary_type, sourceRect,
    }));
    setDragging({ id: plant.id, name: plant.name, culinary_type: plant.culinary_type, sourceRect });
    setDraggingThis(true);
  };

  const handleDragEnd = () => {
    clearDragging();
    setDraggingThis(false);
  };

  // Mobile long-press handlers
  const handleTouchStart = () => {
    if (!isMobile) return;
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(50);
      setJiggling(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleJiggleEnd = () => {
    if (jiggling) {
      setJiggling(false);
      addToTray(plant.id, plant.name, plant.culinary_type);
    }
  };

  const handleNavigate = () => {
    navigate(`/plant/${plant.id}`);
  };

  const isPlanting = seasonStatus === 'planting';

  const handleFoilMove = isPlanting ? (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
  } : undefined;

  const handleFoilLeave = isPlanting ? (e) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
  } : undefined;

  return (
    <Card
      className={`plant-card h-100${popping ? ' plant-card-pop' : ''}${draggingThis ? ' plant-card-dragging' : ''}${jiggling ? ' plant-card-jiggle' : ''}${isPlanting ? ' plant-card-foil' : ''}`}
      draggable={!isMobile}
      onClick={handleNavigate}
      onDragStart={!isMobile ? handleDragStart : undefined}
      onDragEnd={!isMobile ? handleDragEnd : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onTouchMove={isMobile ? handleTouchEnd : undefined}
      onMouseMove={handleFoilMove}
      onMouseLeave={handleFoilLeave}
      onAnimationEnd={(e) => {
        if (e.animationName === 'card-pop') setPopping(false);
        if (e.animationName === 'card-jiggle') handleJiggleEnd();
      }}
    >
      {/* Ribbon sits in the top-left corner; overflow:hidden on .plant-card clips it into shape */}
      <div
        className={`fav-ribbon ${isFav ? 'fav-ribbon-on' : 'fav-ribbon-off'}${popping ? ' fav-ribbon-snap' : ''}`}
        onClick={handleToggle}
        title={isFav ? 'Remove from garden' : 'Add to garden'}
      >
        {isFav ? '★' : '☆'}
      </div>

      {/* Thumbnail with emoji fallback: img is hidden via onError if it fails to load */}
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
        </div>

        {(seasonTag || growthTag || seasonStatus) && (
          <div className={`plant-season-strip${seasonStatus === 'planting' ? ' season-strip-planting' : seasonStatus === 'harvest' ? ' season-strip-harvest' : ''}`}>
            <span className="season-strip-meta">
              {seasonTag && <span className="season-strip-tag">{fmt(seasonTag.replace('-season', ''))} season</span>}
              {growthTag && <span className="season-strip-tag">{fmt(growthTag)}</span>}
            </span>
            {seasonStatus === 'harvest'  && <span className="season-strip-status">In Season</span>}
            {seasonStatus === 'planting' && <span className="season-strip-status">Plant Now ✦</span>}
          </div>
        )}

        {/* mt-auto pushes the accordion to the card bottom regardless of card height */}
        {(plant.companions_good?.length > 0 || plant.companions_bad?.length > 0 || plant.tip) && (
          <Accordion className="plant-accordion mt-auto" onClick={e => e.stopPropagation()}>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Quick view</Accordion.Header>
              <Accordion.Body>
                {plant.companions_good?.length > 0 && (
                  <>
                    <div className="companion-label mt-2">Good with</div>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {plant.companions_good.map(c => (
                        <span key={c} className="chip-good">{c}</span>
                      ))}
                    </div>
                  </>
                )}

                {plant.companions_bad?.length > 0 && (
                  <>
                    <div className="companion-label">Keep away</div>
                    <div className="d-flex flex-wrap gap-1">
                      {plant.companions_bad.map(c => (
                        <span key={c} className="chip-bad">{c}</span>
                      ))}
                    </div>
                  </>
                )}

                {plant.tip && <p className="tip-text mb-0">{plant.tip}</p>}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
}
