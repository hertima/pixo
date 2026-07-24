import { useCallback, useEffect, useState } from "react";

import { loadOnboardingDraft, type OnboardingDraft } from "../lib/storage";

export type OnboardingDraftState = {
  draft: OnboardingDraft | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useOnboardingDraft(): OnboardingDraftState {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const value = await loadOnboardingDraft();
    setDraft(value);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    loadOnboardingDraft().then((value) => {
      if (mounted) {
        setDraft(value);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { draft, loading, reload };
}
