import { useCallback, useEffect, useState } from "react";

import { apiRequest, type ProgressRange, type ProgressSummaryResponse } from "../lib/api";

export type ProgressSummaryState = {
  data: ProgressSummaryResponse | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useProgressSummary(range: ProgressRange): ProgressSummaryState {
  const [data, setData] = useState<ProgressSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ProgressSummaryResponse>(`/api/progress/summary?range=${range}`);
      setData(response);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o progresso.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
