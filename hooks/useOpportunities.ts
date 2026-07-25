import { useCallback, useEffect, useState } from "react";

import { apiRequest, type Opportunity, type OpportunitiesResponse } from "../lib/api";

export type OpportunitiesState = {
  data: Opportunity[] | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: (city?: string, skill?: string) => Promise<void>;
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

  const refresh = useCallback(async (city?: string, skill?: string) => {
    setRefreshing(true);
    setError(null);

    try {
      const body: Record<string, string> = {};

      if (city) {
        body.city = city;
      }

      if (skill) {
        body.skill = skill;
      }

      const response = await apiRequest<OpportunitiesResponse>("/api/opportunities/refresh", {
        method: "POST",
        body: Object.keys(body).length > 0 ? body : undefined
      });
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
