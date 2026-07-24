import { useCallback, useEffect, useState } from "react";

import { apiRequest, type MissionTodayResponse } from "../lib/api";

export type MissionTodayState = {
  data: MissionTodayResponse | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useMissionToday(): MissionTodayState {
  const [data, setData] = useState<MissionTodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<MissionTodayResponse>("/api/missions/today");
      setData(response);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a missão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
