import { useCallback, useEffect, useState } from "react";

import { apiRequest, type Opportunity, type OpportunitiesResponse } from "../lib/api";

export type OpportunitiesState = {
  data: Opportunity[] | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useOpportunities(): OpportunitiesState {
  const [data, setData] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<OpportunitiesResponse>("/api/opportunities");
      setData(response.opportunities);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar oportunidades.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await apiRequest<OpportunitiesResponse>("/api/opportunities/refresh", { method: "POST" });
      setData(response.opportunities);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar oportunidades.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, refreshing, reload, refresh };
}
