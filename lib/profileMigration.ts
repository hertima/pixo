import { apiRequest } from "./api";
import { loadOnboardingDraft } from "./storage";

export type MigrationResult =
  | { status: "migrated" }
  | { status: "skipped"; reason: "missing_draft" }
  | { status: "failed"; message: string };

export async function migrateOnboardingDraft(): Promise<MigrationResult> {
  const draft = await loadOnboardingDraft();

  if (!draft) {
    return { status: "skipped", reason: "missing_draft" };
  }

  try {
    await apiRequest<{ ok: boolean }>("/api/onboarding/migrate", {
      method: "POST",
      body: { draft }
    });
  } catch (error) {
    return {
      status: "failed",
      message: error instanceof Error ? error.message : "Não foi possível migrar o onboarding."
    };
  }

  return { status: "migrated" };
}
