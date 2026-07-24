import AsyncStorage from "@react-native-async-storage/async-storage";

const keys = {
  onboardingDraft: "pixo:onboarding-draft",
  paywallDecision: "pixo:paywall-decision",
  session: "pixo:session"
} as const;

export type MissionChannel = "whatsapp" | "instagram" | "email";

export type OnboardingDraft = {
  monthlyGoal: number;
  channel: MissionChannel;
  createdAt: string;
};

export type PaywallDecision = "free" | "premium";

export type StoredUser = {
  id: string;
  email: string;
};

export type StoredSession = {
  token: string;
  user: StoredUser;
  createdAt: string;
};

export async function loadOnboardingDraft(): Promise<OnboardingDraft | null> {
  const raw = await AsyncStorage.getItem(keys.onboardingDraft);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isOnboardingDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveOnboardingDraft(draft: OnboardingDraft): Promise<void> {
  await AsyncStorage.setItem(keys.onboardingDraft, JSON.stringify(draft));
}

export async function loadPaywallDecision(): Promise<PaywallDecision | null> {
  const value = await AsyncStorage.getItem(keys.paywallDecision);
  return value === "free" || value === "premium" ? value : null;
}

export async function savePaywallDecision(value: PaywallDecision): Promise<void> {
  await AsyncStorage.setItem(keys.paywallDecision, value);
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(keys.session);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveStoredSession(session: StoredSession): Promise<void> {
  await AsyncStorage.setItem(keys.session, JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.removeItem(keys.session);
}

function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.monthlyGoal === "number" &&
    draft.monthlyGoal > 0 &&
    isMissionChannel(draft.channel) &&
    typeof draft.createdAt === "string"
  );
}

function isMissionChannel(value: unknown): value is MissionChannel {
  return value === "whatsapp" || value === "instagram" || value === "email";
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;
  const user = session.user as Record<string, unknown> | undefined;

  if (!user) {
    return false;
  }

  return (
    typeof session.token === "string" &&
    typeof session.createdAt === "string" &&
    typeof user.id === "string" &&
    typeof user.email === "string"
  );
}
