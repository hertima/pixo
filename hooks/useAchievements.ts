import { useCallback, useEffect, useState } from "react";

import { apiRequest, type Achievement } from "../lib/api";

export type AchievementsState = {
  data: Achievement[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useAchievements(): AchievementsState {
  const [data, setData] = useState<Achievement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ achievements: Achievement[] }>("/api/achievements");
      setData(response.achievements);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar as conquistas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
