import { useCallback, useEffect, useState } from "react";

import { apiRequest, type PlanResponse, type PlanStep } from "../lib/api";

export type PlanState = {
  data: PlanStep[] | null;
  error: string | null;
  loading: boolean;
  generating: boolean;
  reload: () => Promise<void>;
  generate: () => Promise<void>;
  toggleStep: (id: string) => Promise<void>;
};

export function usePlan(): PlanState {
  const [data, setData] = useState<PlanStep[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<PlanResponse>("/api/plan");
      setData(response.steps);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o plano.");
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await apiRequest<PlanResponse>("/api/plan/generate", { method: "POST" });
      setData(response.steps);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar o plano.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const toggleStep = useCallback(async (id: string) => {
    const response = await apiRequest<PlanResponse>(`/api/plan/steps/${id}/toggle`, { method: "POST" });
    setData(response.steps);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, generating, reload, generate, toggleStep };
}
