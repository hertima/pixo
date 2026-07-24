import { loadStoredSession } from "./storage";

const defaultApiUrl = "http://localhost:3001";

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

export type ApiUser = {
  id: string;
  email: string;
};

export type ApiSession = {
  token: string;
  user: ApiUser;
};

export type ApiProfile = {
  displayName: string | null;
  preferredChannel: string | null;
  freeTimeMinutes: number | null;
  cityAuthorized: boolean;
  skills: string[];
};

export type ApiGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string | null;
};

export type ApiMission = {
  id: string;
  title: string;
  description: string;
  estimatedValue: number;
  status: "pending" | "active" | "completed";
};

export type ApiProgress = {
  earnedAmount: number;
  targetAmount: number;
};

export type MentorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type BootstrapResponse = {
  user: ApiUser;
  profile: ApiProfile | null;
  activeGoal: ApiGoal | null;
  todaysMission: ApiMission | null;
  progress: ApiProgress;
  opportunitiesCount: number;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const session = options.token ? null : await loadStoredSession();
  const token = options.token ?? session?.token;
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "A API local não respondeu como esperado.";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
