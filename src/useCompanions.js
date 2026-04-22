import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export function useCompanions(selectedPlantKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedPlantKey) {
      setData([]);
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadCompanions() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("companions")
        .select("id, plant_id, companion, sentiment, reason")
        .eq("plant_id", selectedPlantKey)
        .order("companion", { ascending: true });

      if (ignore) return;

      if (error) {
        setError(error);
        setData([]);
      } else {
        setData(data ?? []);
      }

      setLoading(false);
    }

    loadCompanions();

    return () => {
      ignore = true;
    };
  }, [selectedPlantKey]);

  return { data, loading, error };
}