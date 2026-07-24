import { useCallback, useEffect, useState } from "react";

import { apiRequest, type BootstrapResponse } from "../lib/api";

export type BootstrapState = {
  data: BootstrapResponse | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useBootstrap(): BootstrapState {
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<BootstrapResponse>("/api/bootstrap");
      setData(response);
    } catch (requestError) {
      setData(null);
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o PIXO.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    apiRequest<BootstrapResponse>("/api/bootstrap")
      .then((response) => {
        if (mounted) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o PIXO.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, error, loading, reload };
}
