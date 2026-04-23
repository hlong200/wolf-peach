import { useMemo, useState, useEffect } from "react";
import "./CompanionPlanting.css";
import { useFilteredPlants } from "./lib/useFilteredPlants";
import { useCompanions } from "./useCompanions";

function CompanionGroup({ title, items, variant }) {
  return (
    <section className={`companion-group ${variant}`}>
      <div className="companion-group-header">
        <h3>{title}</h3>
        <span className={`group-badge ${variant}`}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">No plants listed in this group yet.</p>
      ) : (
        <div className="companion-cards">
          {items.map((item) => (
            <article
              key={`${item.id ?? item.companion}-${item.sentiment}`}
              className="companion-card"
            >
              <div className="companion-card-top">
                <strong>{item.companion}</strong>
              </div>
              <p>{item.reason || "No note added yet."}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CompanionPlanting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlantKey, setSelectedPlantKey] = useState("");

  const {
    data: plants = [],
    loading: plantsLoading,
    error: plantsError,
  } = useFilteredPlants();

 const plantOptions = useMemo(() => {
  if (!Array.isArray(plants)) return [];

  return plants
    .map((plant) => ({
      id: plant.id,
      name: plant.name,
      culinaryType: (plant.culinary_type || "").toLowerCase(),
      searchText: `${plant.name} ${plant.culinary_type ?? ""}`.toLowerCase(),
    }))
    .filter((plant) => plant.id && plant.name)
    .sort((a, b) => a.name.localeCompare(b.name));
    }, [plants]);

  useEffect(() => {
    if (!selectedPlantKey && plantOptions.length > 0) {
      setSelectedPlantKey(plantOptions[0].id);
    }
  }, [plantOptions, selectedPlantKey]);

  const defaultPlants = useMemo(() => {
    return plantOptions.slice(0, 8);
  }, [plantOptions]);

  const filteredPlants = useMemo(() => {
  if (!searchTerm.trim()) return defaultPlants;

  return plantOptions.filter((plant) =>
    plant.searchText.includes(searchTerm.toLowerCase())
  );
    }, [plantOptions, searchTerm, defaultPlants]);

  const selectedPlant = useMemo(() => {
    return plantOptions.find((plant) => plant.id === selectedPlantKey) || null;
  }, [plantOptions, selectedPlantKey]);

  const {
    data: companionRows = [],
    loading: companionsLoading,
    error: companionsError,
  } = useCompanions(selectedPlantKey);

  const friends = useMemo(
    () => companionRows.filter((row) => row.sentiment === "good"),
    [companionRows]
  );

  const foes = useMemo(
    () => companionRows.filter((row) => row.sentiment === "bad"),
    [companionRows]
  );

  const neutral = useMemo(
    () => companionRows.filter((row) => row.sentiment === "neutral"),
    [companionRows]
  );

  return (
    <main className="companion-page">
      <section className="companion-hero">
        <div>
          <p className="companion-eyebrow">Wolf Peach Guide</p>
          <h1>Companion Planting</h1>
          <p className="companion-subtitle">
            See which vegetables grow well together and which should stay apart.
          </p>
        </div>
      </section>

      <section className="companion-layout">
        <aside className="plant-selector">
          <h2>Plant Guide</h2>
          <p>Select a vegetable type to view its companion relationships.</p>

          <div className="plant-search-wrap">
            <input
              type="text"
              className="plant-search-input"
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {plantsLoading && <p className="no-plant-results">Loading plants...</p>}
          {plantsError && <p className="no-plant-results">Could not load plants.</p>}

          {!plantsLoading && !plantsError && (
            <div className="plant-selector-list">
              {filteredPlants.length === 0 ? (
                <p className="no-plant-results">No plants found.</p>
              ) : (
                filteredPlants.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    className={`plant-select-btn ${
                      selectedPlantKey === plant.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedPlantKey(plant.id)}
                  >
                    <span className="plant-select-name">
                      {plant.name}
                      <small style={{ display: "block", opacity: 0.7 }}>
                        {plant.culinaryType}
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </aside>

        <section className="companion-main">
          <div className="selected-plant-panel">
            <div className="selected-plant-header">
              <div>
                <p className="selected-label">Selected Plant</p>
                <h2>{selectedPlant?.name || "Choose a plant"}</h2>
              </div>
            </div>
            <p className="selected-description">
              Companion relationships are loaded from the database.
            </p>
          </div>

          {companionsLoading ? (
            <p className="empty-state">Loading companion data...</p>
          ) : companionsError ? (
            <p className="empty-state">Could not load companion data.</p>
          ) : (
            <>
              <CompanionGroup title="Friends" items={friends} variant="friends" />
              <CompanionGroup title="Foes" items={foes} variant="foes" />
              <CompanionGroup title="Neutral" items={neutral} variant="neutral" />
            </>
          )}
        </section>
      </section>
    </main>
  );
}