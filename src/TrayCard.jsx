import { useNavigate } from 'react-router-dom';
import { useFavorites } from './lib/FavoritesProvider';
import { ICONS } from './lib/plantIcons';
import './TrayCard.css';

export default function TrayCard({ plant, isNew, onRemove }) {
    const navigate = useNavigate();
    const { favorites } = useFavorites();
    const isFav = favorites.includes(plant.id);

    return (
        <div
            className={`tray-card${isNew ? ' tray-card-new' : ''}`}
            onClick={() => navigate(`/plant/${plant.id}`)}
            title={`View ${plant.name}`}
        >
            <span className="tray-card-emoji">
                {ICONS[plant.culinary_type] || '🌱'}
            </span>
            <span className="tray-card-name">
                {plant.name}
                <span className="tray-card-type">{plant.culinary_type.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</span>
            </span>
            {isFav && <span className="tray-card-fav" title="In your garden">★</span>}
            <button
                className="tray-card-remove"
                onClick={e => { e.stopPropagation(); onRemove(plant.id); }}
                aria-label={`Remove ${plant.name} from tray`}
            >
                ✕
            </button>
        </div>
    );
}
