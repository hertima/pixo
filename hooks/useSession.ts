import { useEffect, useState } from "react";

import { loadStoredSession, type StoredSession } from "../lib/storage";

export type SessionState = {
  loading: boolean;
  session: StoredSession | null;
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loading: true,
    session: null
  });

  useEffect(() => {
    let mounted = true;

    void loadStoredSession().then((session) => {
      if (mounted) {
        setState({ loading: false, session });
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
