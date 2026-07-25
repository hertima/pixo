import { useCallback, useEffect, useState } from "react";

import { apiRequest, type SavingsResponse } from "../lib/api";

export type SavingsState = {
  data: SavingsResponse | null;
  error: string | null;
  loading: boolean;
  saving: boolean;
  reload: () => Promise<void>;
  setGoal: (targetAmount: number) => Promise<void>;
  deposit: (amount: number) => Promise<void>;
};

export function useSavings(): SavingsState {
  const [data, setData] = useState<SavingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<SavingsResponse>("/api/savings");
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a caixinha.");
    } finally {
      setLoading(false);
    }
  }, []);

  const setGoal = useCallback(async (targetAmount: number) => {
    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest<SavingsResponse>("/api/savings/goal", {
        method: "POST",
        body: { targetAmount }
      });
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível salvar a meta.");
    } finally {
      setSaving(false);
    }
  }, []);

  const deposit = useCallback(async (amount: number) => {
    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest<SavingsResponse>("/api/savings/deposit", {
        method: "POST",
        body: { amount }
      });
      setData(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível guardar o valor.");
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, saving, reload, setGoal, deposit };
}
