import { useEffect, useState, useRef } from "react";
import { FilterProvider } from "./lib/FilterProvider";
import { useFavorites } from "./lib/FavoritesProvider";
import FilterableGrid from "./FilterableGrid";
import { Container } from "react-bootstrap";
import "./MyGarden.css";

const UNDO_DURATION_MS = 5000;

function UndoToast({ pendingRemoval, onUndo }) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / UNDO_DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pendingRemoval.id]);

  return (
    <div className="undo-toast">
      <div className="undo-toast-body">
        <span>Removed <strong>{pendingRemoval.name}</strong> from your garden</span>
        <button className="undo-toast-btn" onClick={onUndo}>Undo</button>
      </div>
      <div className="undo-toast-progress" style={{ width: `${progress}%` }} />
    </div>
  );
}

function MyGardenInner() {
  const { favorites, setDeferRemovals, pendingRemoval, undoRemoval, commitPendingRemoval } = useFavorites();

  // Keep a ref current so the cleanup always calls the latest commitPendingRemoval,
  // not the stale one captured at mount. If the user already undid the removal,
  // pendingRemoval will be null and commitPendingRemoval is a no-op.
  const commitRef = useRef(commitPendingRemoval);
  useEffect(() => { commitRef.current = commitPendingRemoval; }, [commitPendingRemoval]);

  useEffect(() => {
    setDeferRemovals(true);
    return () => {
      commitRef.current();
      setDeferRemovals(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (favorites.length === 0 && !pendingRemoval) {
    return (
      <p className="text-center mt-5 text-muted">
        No plants in your garden yet — star some from the Catalog!
      </p>
    );
  }

  return (
    <>
      <FilterableGrid ids={favorites} />
      {pendingRemoval && <UndoToast pendingRemoval={pendingRemoval} onUndo={undoRemoval} />}
    </>
  );
}

export default function MyGarden() {
  return (
    <FilterProvider>
      <>
        <section className="py-5 text-center">
          <Container>
            <h1 className="fw-bold">My Garden</h1>
            <p className="text-muted">View and manage the plants you’ve saved.</p>
          </Container>
        </section>
        <section className="py-4">
          <Container>
            <MyGardenInner />
          </Container>
        </section>
      </>
    </FilterProvider>
  );
}
