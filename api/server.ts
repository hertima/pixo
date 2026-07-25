import "dotenv/config";

import bcrypt from "bcryptjs";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import jwt, { type JwtPayload } from "jsonwebtoken";
import pg from "pg";

import { ACHIEVEMENTS, LEVELS, getLevelProgress, unlockedAchievementKeys, type AchievementStats } from "./gamification";

const { Pool } = pg;

const app = express();
const port = Number(process.env.PORT ?? process.env.APP_PORT ?? 3000);
const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? process.env.POSTGRES_DB ?? "pixo",
  user: process.env.PGUSER ?? process.env.POSTGRES_USER ?? "pixo",
  password: process.env.PGPASSWORD ?? process.env.POSTGRES_PASSWORD ?? "troque_essa_senha_forte"
});

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
};

type ProfileRow = {
  display_name: string | null;
  preferred_channel: string | null;
  free_time_minutes: number | null;
  city: string | null;
  city_authorized: boolean;
  skills: string[];
  xp: number;
  latitude: number | null;
  longitude: number | null;
};

type GoalRow = {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  due_date: string | null;
};

type MissionRow = {
  id: string;
  title: string;
  description: string;
  estimated_value: string;
  status: "pending" | "active" | "completed";
  target_count: number;
  current_count: number;
  xp_reward: number;
};

type MissionStepRow = {
  id: string;
  mission_id: string;
  label: string;
  done: boolean;
  sort_order: number;
};

type ProgressEventRow = {
  id: string;
  amount: string;
  description: string;
  kind: string;
  xp_reward: number;
  created_at: string;
};

type OpportunityRow = {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  pitch_message: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  price_hint: string | null;
  status: string;
  created_at: string;
};

type MentorMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type OnboardingDraft = {
  monthlyGoal: number;
  channel: "whatsapp" | "instagram" | "email";
  createdAt: string;
  displayName?: string;
  city?: string;
  skill?: string;
};

type AuthedRequest = Request & {
  userId: string;
};

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ ok: true, db: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const body = readBody(request);
    const email = readEmail(body.email);
    const password = readPassword(body.password);
    const draft = isOnboardingDraft(body.draft) ? body.draft : null;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query<UserRow>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash",
      [email, passwordHash]
    );
    const user = firstRow(result.rows);

    if (draft) {
      await migrateDraft(user.id, draft);
    }

    response.status(201).json(createSession(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const body = readBody(request);
    const email = readEmail(body.email);
    const password = readPassword(body.password);
    const result = await pool.query<UserRow>(
      "SELECT id, email, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      throw new HttpError(401, "Conta não encontrada.");
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      throw new HttpError(401, "Senha inválida.");
    }

    response.json(createSession(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (request, response, next) => {
  try {
    const user = await getUser((request as AuthedRequest).userId);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/onboarding/migrate", requireAuth, async (request, response, next) => {
  try {
    const body = readBody(request);

    if (!isOnboardingDraft(body.draft)) {
      throw new HttpError(400, "Onboarding inválido.");
    }

    await migrateDraft((request as AuthedRequest).userId, body.draft);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bootstrap", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const user = await getUser(userId);
    const profile = await getProfile(userId);
    const goal = await getActiveGoal(userId);
    const mission = await getTodaysMission(userId);
    const opportunities = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::TEXT AS count FROM opportunities WHERE user_id = $1 AND status = 'new'",
      [userId]
    );
    const levelProgress = getLevelProgress(profile?.xp ?? 0);

    response.json({
      user: publicUser(user),
      profile: profile
        ? {
            displayName: profile.display_name,
            preferredChannel: profile.preferred_channel,
            freeTimeMinutes: profile.free_time_minutes,
            city: profile.city,
            cityAuthorized: profile.city_authorized,
            skills: profile.skills
          }
        : null,
      gamification: {
        xp: levelProgress.xp,
        level: levelProgress.name,
        levelIndex: levelProgress.index,
        currentLevelXp: levelProgress.currentLevelXp,
        nextLevelXp: levelProgress.nextLevelXp,
        levels: LEVELS.map((level) => level.name)
      },
      activeGoal: goal
        ? {
            id: goal.id,
            name: goal.name,
            targetAmount: Number(goal.target_amount),
            currentAmount: Number(goal.current_amount),
            dueDate: goal.due_date
          }
        : null,
      todaysMission: mission ? serializeMission(mission) : null,
      progress: {
        earnedAmount: goal ? Number(goal.current_amount) : 0,
        targetAmount: goal ? Number(goal.target_amount) : 0
      },
      opportunitiesCount: Number(opportunities.rows[0]?.count ?? 0)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/mentor/messages", requireAuth, async (request, response, next) => {
  try {
    const messages = await getMentorMessages((request as AuthedRequest).userId);
    response.json({ messages: serializeMessages(messages) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/mentor/message", requireAuth, async (request, response, next) => {
  try {
    const body = readBody(request);
    const content = readNonEmptyString(body.content, "Mensagem");
    const userId = (request as AuthedRequest).userId;

    if (!process.env.OPENAI_API_KEY) {
      throw new HttpError(503, "OPENAI_API_KEY não configurada na API local.");
    }

    await pool.query("INSERT INTO mentor_messages (user_id, role, content) VALUES ($1, 'user', $2)", [userId, content]);

    const assistantContent = await askOpenAi(userId, content);
    await pool.query("INSERT INTO mentor_messages (user_id, role, content) VALUES ($1, 'assistant', $2)", [
      userId,
      assistantContent
    ]);

    const messages = await getMentorMessages(userId);
    response.json({ messages: serializeMessages(messages) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/missions/today", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const mission = await getTodaysMission(userId);

    if (!mission) {
      response.json({ mission: null, steps: [] });
      return;
    }

    const steps = await getMissionSteps(mission.id);
    response.json({ mission: serializeMission(mission), steps: serializeSteps(steps) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/missions/:id/steps/:stepId/toggle", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const mission = await getOwnedMission(userId, readParam(request.params.id, "Missão"));
    await pool.query("UPDATE mission_steps SET done = NOT done WHERE id = $1 AND mission_id = $2", [
      readParam(request.params.stepId, "Passo"),
      mission.id
    ]);
    const doneCount = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::TEXT AS count FROM mission_steps WHERE mission_id = $1 AND done = true",
      [mission.id]
    );
    await pool.query("UPDATE missions SET current_count = $2 WHERE id = $1", [
      mission.id,
      Number(doneCount.rows[0]?.count ?? 0)
    ]);
    const updatedMission = await getOwnedMission(userId, mission.id);
    const steps = await getMissionSteps(mission.id);
    response.json({ mission: serializeMission(updatedMission), steps: serializeSteps(steps) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/missions/:id/increment", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const mission = await getOwnedMission(userId, readParam(request.params.id, "Missão"));
    const nextCount = Math.min(mission.target_count, mission.current_count + 1);

    await pool.query("UPDATE missions SET current_count = $2 WHERE id = $1", [mission.id, nextCount]);

    const updatedMission = await getOwnedMission(userId, mission.id);
    const steps = await getMissionSteps(mission.id);
    response.json({ mission: serializeMission(updatedMission), steps: serializeSteps(steps) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/missions/:id/complete", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const mission = await getOwnedMission(userId, readParam(request.params.id, "Missão"));

    if (mission.status === "completed") {
      throw new HttpError(400, "Missão já concluída.");
    }

    await pool.query("UPDATE missions SET status = 'completed' WHERE id = $1", [mission.id]);
    await pool.query(
      `INSERT INTO ai_profiles (user_id, xp) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET xp = ai_profiles.xp + EXCLUDED.xp, updated_at = now()`,
      [userId, mission.xp_reward]
    );
    await pool.query(
      "INSERT INTO progress_events (user_id, amount, description, kind, xp_reward) VALUES ($1, $2, $3, 'mission_completed', $4)",
      [userId, mission.estimated_value, `Missão concluída: ${mission.title}`, mission.xp_reward]
    );

    const activeGoal = await getActiveGoal(userId);

    if (activeGoal) {
      await pool.query("UPDATE goals SET current_amount = current_amount + $2 WHERE id = $1", [
        activeGoal.id,
        mission.estimated_value
      ]);
    }

    await syncAchievements(userId);

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/progress/summary", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const range = readRange(request.query.range);
    const goal = await getActiveGoal(userId);
    const summary = await pool.query<{ earned: string; xp: string; missions: string }>(
      `SELECT
         COALESCE(SUM(amount), 0)::TEXT AS earned,
         COALESCE(SUM(xp_reward), 0)::TEXT AS xp,
         COUNT(*) FILTER (WHERE kind = 'mission_completed')::TEXT AS missions
       FROM progress_events
       WHERE user_id = $1 AND created_at >= date_trunc($2, now())`,
      [userId, range]
    );
    const row = firstRow(summary.rows);
    const history = await pool.query<ProgressEventRow>(
      "SELECT id, amount, description, kind, xp_reward, created_at FROM progress_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 15",
      [userId]
    );

    response.json({
      range,
      earnedAmount: Number(row.earned),
      xpEarned: Number(row.xp),
      missionsCompleted: Number(row.missions),
      targetAmount: goal ? Number(goal.target_amount) : 0,
      history: history.rows.map(serializeProgressEvent)
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/profile", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const body = readBody(request);
    const profile = await getProfile(userId);

    const displayNameInput = typeof body.displayName === "string" ? body.displayName.trim() : undefined;
    const cityInput = typeof body.city === "string" ? body.city.trim() : undefined;
    const skillInput = typeof body.skill === "string" ? body.skill.trim() : undefined;
    const monthlyGoal = typeof body.monthlyGoal === "number" && body.monthlyGoal > 0 ? body.monthlyGoal : undefined;
    const preferredChannel = isChannel(body.preferredChannel) ? body.preferredChannel : undefined;

    let latitude = profile?.latitude ?? null;
    let longitude = profile?.longitude ?? null;

    if (cityInput) {
      const coords = await geocodeCity(cityInput);

      if (coords) {
        latitude = coords.lat;
        longitude = coords.lon;
      }
    }

    const nextDisplayName = displayNameInput || profile?.display_name || null;
    const nextChannel = preferredChannel ?? profile?.preferred_channel ?? null;
    const nextCity = cityInput || profile?.city || null;
    const nextSkills = skillInput ? [skillInput] : profile?.skills ?? [];

    await pool.query(
      `INSERT INTO ai_profiles (user_id, display_name, preferred_channel, city, latitude, longitude, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = $2, preferred_channel = $3, city = $4, latitude = $5, longitude = $6, skills = $7, updated_at = now()`,
      [userId, nextDisplayName, nextChannel, nextCity, latitude, longitude, nextSkills]
    );

    if (monthlyGoal !== undefined) {
      const activeGoal = await getActiveGoal(userId);

      if (activeGoal) {
        await pool.query("UPDATE goals SET target_amount = $2 WHERE id = $1", [activeGoal.id, monthlyGoal]);
      } else {
        await pool.query("INSERT INTO goals (user_id, name, target_amount) VALUES ($1, 'Meta mensal', $2)", [
          userId,
          monthlyGoal
        ]);
      }
    }

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/opportunities", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const opportunities = await getOpportunities(userId);
    response.json({ opportunities: opportunities.map(serializeOpportunity) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/opportunities/refresh", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const body = request.body && typeof request.body === "object" ? (request.body as Record<string, unknown>) : {};
    const cityInput = typeof body.city === "string" ? body.city : undefined;
    const skillInput = typeof body.skill === "string" ? body.skill : undefined;
    const opportunities = await generateOpportunities(userId, cityInput, skillInput);
    response.json({ opportunities: opportunities.map(serializeOpportunity) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/achievements", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    await syncAchievements(userId);
    const unlocked = await pool.query<{ achievement_key: string; unlocked_at: string }>(
      "SELECT achievement_key, unlocked_at FROM user_achievements WHERE user_id = $1",
      [userId]
    );
    const unlockedMap = new Map(unlocked.rows.map((row) => [row.achievement_key, row.unlocked_at]));

    response.json({
      achievements: ACHIEVEMENTS.map((achievement) => ({
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        unlocked: unlockedMap.has(achievement.key),
        unlockedAt: unlockedMap.get(achievement.key) ?? null
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/plan", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const steps = await getPlanSteps(userId);
    response.json({ steps: steps.map(serializePlanStep) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/plan/generate", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const steps = await generatePlan(userId);
    response.json({ steps: steps.map(serializePlanStep) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/plan/steps/:id/toggle", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const stepId = readParam(request.params.id, "Passo");
    await pool.query("UPDATE plan_steps SET done = NOT done WHERE id = $1 AND user_id = $2", [stepId, userId]);
    const steps = await getPlanSteps(userId);
    response.json({ steps: steps.map(serializePlanStep) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/checkin", requireAuth, async (request, response, next) => {
  try {
    const userId = (request as AuthedRequest).userId;
    const body = readBody(request);
    const minutes = typeof body.minutes === "number" && body.minutes > 0 ? body.minutes : null;

    if (!minutes) {
      throw new HttpError(400, "Informe quantos minutos livres você tem.");
    }

    const suggestion = await generateTimeCheckinSuggestion(userId, minutes);
    response.json({ suggestion });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.resolve(process.cwd(), "dist")));
app.get("*", async (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  const indexPath = path.resolve(process.cwd(), "dist", "index.html");
  try {
    await fs.access(indexPath);
    response.sendFile(indexPath);
  } catch {
    response.status(404).json({ message: "Web build não encontrado. Rode npm run build:web." });
  }
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  if (isPgUniqueError(error)) {
    response.status(409).json({ message: "Este email já está cadastrado." });
    return;
  }

  response.status(500).json({ message: error instanceof Error ? error.message : "Erro interno da API." });
});

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      process.stdout.write(`PIXO API ouvindo em http://localhost:${port}\n`);
    });
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Falha ao iniciar API"}\n`);
    process.exit(1);
  });

async function ensureSchema(): Promise<void> {
  const schema = await fs.readFile(path.resolve(process.cwd(), "db", "schema.sql"), "utf8");
  await pool.query(schema);
}

async function getUser(userId: string): Promise<UserRow> {
  const result = await pool.query<UserRow>("SELECT id, email, password_hash FROM users WHERE id = $1 LIMIT 1", [userId]);
  return firstRow(result.rows);
}

async function getProfile(userId: string): Promise<ProfileRow | null> {
  const result = await pool.query<ProfileRow>(
    "SELECT display_name, preferred_channel, free_time_minutes, city, city_authorized, skills, xp, latitude, longitude FROM ai_profiles WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] ?? null;
}

async function getActiveGoal(userId: string): Promise<GoalRow | null> {
  const result = await pool.query<GoalRow>(
    "SELECT id, name, target_amount, current_amount, due_date FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  return result.rows[0] ?? null;
}

async function getTodaysMission(userId: string): Promise<MissionRow | null> {
  const result = await pool.query<MissionRow>(
    "SELECT id, title, description, estimated_value, status, target_count, current_count, xp_reward FROM missions WHERE user_id = $1 AND status IN ('pending', 'active') ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  return result.rows[0] ?? null;
}

async function getOwnedMission(userId: string, missionId: string): Promise<MissionRow> {
  const result = await pool.query<MissionRow>(
    "SELECT id, title, description, estimated_value, status, target_count, current_count, xp_reward FROM missions WHERE id = $1 AND user_id = $2 LIMIT 1",
    [missionId, userId]
  );
  return firstRow(result.rows);
}

async function getMissionSteps(missionId: string): Promise<MissionStepRow[]> {
  const result = await pool.query<MissionStepRow>(
    "SELECT id, mission_id, label, done, sort_order FROM mission_steps WHERE mission_id = $1 ORDER BY sort_order ASC",
    [missionId]
  );
  return result.rows;
}

async function syncAchievements(userId: string): Promise<void> {
  const stats = await pool.query<{ missions: string; earned: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE kind = 'mission_completed')::TEXT AS missions,
       COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::TEXT AS earned
     FROM progress_events WHERE user_id = $1`,
    [userId]
  );
  const row = firstRow(stats.rows);
  const achievementStats: AchievementStats = {
    missionsCompleted: Number(row.missions),
    totalEarned: Number(row.earned),
    referrals: 0
  };

  for (const key of unlockedAchievementKeys(achievementStats)) {
    await pool.query(
      "INSERT INTO user_achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT (user_id, achievement_key) DO NOTHING",
      [userId, key]
    );
  }
}

function readRange(value: unknown): "day" | "week" | "month" {
  if (value === "day" || value === "week" || value === "month") {
    return value;
  }

  return "month";
}

function serializeMission(mission: MissionRow): {
  id: string;
  title: string;
  description: string;
  estimatedValue: number;
  status: MissionRow["status"];
  targetCount: number;
  currentCount: number;
  xpReward: number;
} {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    estimatedValue: Number(mission.estimated_value),
    status: mission.status,
    targetCount: mission.target_count,
    currentCount: mission.current_count,
    xpReward: mission.xp_reward
  };
}

function serializeSteps(steps: MissionStepRow[]): { id: string; label: string; done: boolean; sortOrder: number }[] {
  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    done: step.done,
    sortOrder: step.sort_order
  }));
}

async function getOpportunities(userId: string): Promise<OpportunityRow[]> {
  const result = await pool.query<OpportunityRow>(
    `SELECT id, title, company, city, pitch_message, address, phone, website, opening_hours, price_hint, status, created_at
     FROM opportunities WHERE user_id = $1 AND status = 'new' ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return result.rows;
}

function serializeOpportunity(opportunity: OpportunityRow): {
  id: string;
  title: string;
  company: string | null;
  city: string | null;
  pitchMessage: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  priceHint: string | null;
  createdAt: string;
} {
  return {
    id: opportunity.id,
    title: opportunity.title,
    company: opportunity.company,
    city: opportunity.city,
    pitchMessage: opportunity.pitch_message,
    address: opportunity.address,
    phone: opportunity.phone,
    website: opportunity.website,
    openingHours: opportunity.opening_hours,
    priceHint: opportunity.price_hint,
    createdAt: opportunity.created_at
  };
}

type PlanStepRow = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  sort_order: number;
};

async function getPlanSteps(userId: string): Promise<PlanStepRow[]> {
  const result = await pool.query<PlanStepRow>(
    "SELECT id, title, description, done, sort_order FROM plan_steps WHERE user_id = $1 ORDER BY sort_order ASC",
    [userId]
  );
  return result.rows;
}

function serializePlanStep(step: PlanStepRow): { id: string; title: string; description: string; done: boolean } {
  return { id: step.id, title: step.title, description: step.description, done: step.done };
}

async function generatePlan(userId: string): Promise<PlanStepRow[]> {
  const profile = await getProfile(userId);
  const goal = await getActiveGoal(userId);
  const skills = profile?.skills.length ? profile.skills.join(", ") : "serviços gerais para pequenos negócios";
  const instructions = [
    "Você é o PIXO IA, um copiloto financeiro e mentor de renda extra.",
    "Monte um protocolo de 21 dias: exatamente 21 passos, um pra cada dia, em ordem crescente de dificuldade (dia 1 é o mais simples pra começar hoje mesmo).",
    "Cada passo precisa ser específico e verificável (não genérico tipo 'se organizar'). Adapte ao tempo livre e à habilidade da pessoa.",
    "O título de cada passo tem que começar com 'Dia N: ' (N de 1 a 21), seguido da ação curta. Ex: 'Dia 1: Definir sua oferta'.",
    'Responda estritamente em JSON, sem markdown: um array com exatamente 21 objetos {"title": "Dia N: ação curta", "description": "1-2 frases explicando o que fazer nesse dia"}.'
  ].join("\n");
  const input = [
    `Habilidade/serviço: ${skills}.`,
    `Meta: ${goal ? `R$ ${goal.target_amount} por mês` : "não definida"}.`,
    `Tempo livre por dia: ${profile?.free_time_minutes ? `${profile.free_time_minutes} minutos` : "não informado"}.`
  ].join(" ");

  let steps: { title: string; description: string }[] = [];

  try {
    const raw = await callOpenAi(instructions, input);
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      steps = parsed.filter(
        (item): item is { title: string; description: string } =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as { title?: unknown }).title === "string" &&
          typeof (item as { description?: unknown }).description === "string"
      );
    }
  } catch {
    // Falls through to the default plan below.
  }

  if (steps.length !== 21) {
    steps = buildDefaultTwentyOneDayPlan();
  }

  await pool.query("DELETE FROM plan_steps WHERE user_id = $1", [userId]);

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];

    if (!step) {
      continue;
    }

    await pool.query("INSERT INTO plan_steps (user_id, title, description, sort_order) VALUES ($1, $2, $3, $4)", [
      userId,
      step.title,
      step.description,
      index
    ]);
  }

  return getPlanSteps(userId);
}

function buildDefaultTwentyOneDayPlan(): { title: string; description: string }[] {
  const days = [
    "Escreva em uma frase o que você vai oferecer e pra quem.",
    "Defina o preço do seu serviço e o que está incluso.",
    "Liste 10 pessoas ou negócios reais pra abordar.",
    "Prepare uma mensagem curta de apresentação.",
    "Envie a mensagem pros primeiros 5 contatos da lista.",
    "Envie pros outros 5 contatos da lista.",
    "Responda quem chamou e agende o que for possível.",
    "Ajuste a mensagem com base nas respostas que recebeu.",
    "Liste mais 10 contatos novos pra abordar.",
    "Envie a mensagem ajustada pra esses novos contatos.",
    "Peça pra 3 pessoas te indicarem alguém que precise do serviço.",
    "Publique sobre seu serviço em uma rede social ou grupo.",
    "Faça o primeiro atendimento ou entrega combinado.",
    "Peça um feedback sincero de quem você atendeu.",
    "Ajuste o que não funcionou bem no primeiro atendimento.",
    "Aborde mais 10 contatos novos.",
    "Feche pelo menos 1 novo atendimento essa semana.",
    "Organize seus ganhos e anote quanto já faturou.",
    "Pergunte aos clientes atendidos se conhecem mais alguém.",
    "Planeje como repetir o que deu mais resultado até aqui.",
    "Revise as 3 semanas e defina a meta dos próximos 21 dias."
  ];

  return days.map((description, index) => ({
    title: `Dia ${index + 1}: ${description.replace(/\.$/, "")}`,
    description
  }));
}

async function generateTimeCheckinSuggestion(userId: string, minutes: number): Promise<string> {
  const profile = await getProfile(userId);
  const mission = await getTodaysMission(userId);
  const skills = profile?.skills.length ? profile.skills.join(", ") : "renda extra em geral";
  const instructions = [
    "Você é o PIXO IA. A pessoa acabou de avisar quanto tempo livre tem agora.",
    "Sugira UMA ação específica e realista de dar pra fazer nesse tempo, ligada à habilidade dela e à missão ativa se fizer sentido.",
    "Resposta curta: 2-3 frases, direta, sem enrolação, em tom de mentor motivador.",
    "Não use markdown nem listas, só texto corrido."
  ].join("\n");
  const input = [
    `Tempo livre agora: ${minutes} minutos.`,
    `Habilidade/serviço: ${skills}.`,
    `Missão ativa: ${mission ? mission.title : "nenhuma"}.`
  ].join(" ");

  return callOpenAi(instructions, input);
}

type OpportunityCategoryKey =
  | "pet"
  | "veterinary"
  | "beauty"
  | "food"
  | "fitness"
  | "office"
  | "clinic"
  | "retail"
  | "realestate"
  | "auto"
  | "bakery"
  | "hotel"
  | "school"
  | "pool"
  | "sportsclub"
  | "laundry"
  | "eventvenue"
  | "condo";

const OPPORTUNITY_CATEGORIES: Record<OpportunityCategoryKey, { label: string; filters: string[] }> = {
  pet: { label: "Pet shops", filters: ["shop=pet"] },
  veterinary: { label: "Clínicas veterinárias", filters: ["amenity=veterinary"] },
  beauty: { label: "Salões de beleza e barbearias", filters: ["shop=hairdresser", "shop=beauty"] },
  food: { label: "Restaurantes e cafés", filters: ["amenity=restaurant", "amenity=cafe", "amenity=fast_food"] },
  fitness: { label: "Academias", filters: ["leisure=fitness_centre"] },
  office: { label: "Escritórios de contabilidade e advocacia", filters: ["office=accountant", "office=lawyer"] },
  clinic: { label: "Clínicas e consultórios", filters: ["amenity=clinic", "amenity=doctors", "amenity=dentist"] },
  retail: { label: "Lojas de varejo", filters: ["shop=clothes", "shop=convenience", "shop=supermarket"] },
  realestate: { label: "Imobiliárias", filters: ["office=estate_agent"] },
  auto: { label: "Oficinas e autopeças", filters: ["shop=car_repair"] },
  bakery: { label: "Padarias e confeitarias", filters: ["shop=bakery"] },
  hotel: { label: "Pousadas e hotéis", filters: ["tourism=hotel", "tourism=guest_house"] },
  school: { label: "Escolas e cursos", filters: ["amenity=school", "amenity=driving_school"] },
  pool: { label: "Locais com piscina (hotéis, clubes, condomínios)", filters: ["leisure=swimming_pool"] },
  sportsclub: { label: "Clubes e centros esportivos", filters: ["leisure=sports_centre", "leisure=golf_course"] },
  laundry: { label: "Lavanderias", filters: ["shop=laundry", "shop=dry_cleaning"] },
  eventvenue: { label: "Espaços de eventos e salões de festa", filters: ["amenity=events_venue", "amenity=community_centre"] },
  condo: { label: "Condomínios residenciais", filters: ["building=apartments"] }
};

const DEFAULT_OPPORTUNITY_CATEGORIES: OpportunityCategoryKey[] = ["food", "beauty", "retail", "office"];

async function generateOpportunities(userId: string, cityInput?: string, skillInput?: string): Promise<OpportunityRow[]> {
  const profile = await getProfile(userId);
  let latitude = profile?.latitude ?? null;
  let longitude = profile?.longitude ?? null;

  if (cityInput && cityInput.trim().length > 0) {
    const coords = await geocodeCity(cityInput.trim());

    if (!coords) {
      throw new HttpError(400, "Não encontrei essa cidade. Tente escrever de outra forma (ex: Curitiba, PR).");
    }

    latitude = coords.lat;
    longitude = coords.lon;

    await pool.query(
      `INSERT INTO ai_profiles (user_id, city, latitude, longitude) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET city = EXCLUDED.city, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, updated_at = now()`,
      [userId, cityInput.trim(), latitude, longitude]
    );
  }

  if (skillInput && skillInput.trim().length > 0) {
    await pool.query(
      `INSERT INTO ai_profiles (user_id, skills) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET skills = EXCLUDED.skills, updated_at = now()`,
      [userId, [skillInput.trim()]]
    );
  }

  if (latitude === null || longitude === null) {
    throw new HttpError(400, "Informe sua cidade para o PIXO buscar oportunidades reais perto de você.");
  }

  const skills =
    skillInput?.trim() || (profile?.skills.length ? profile.skills.join(", ") : "serviços gerais para pequenos negócios");
  const plan = await planOutreach(skills, profile?.preferred_channel ?? null, profile?.display_name ?? null);
  const results = await queryOverpass(latitude, longitude, plan.categories);

  await pool.query("DELETE FROM opportunities WHERE user_id = $1 AND status = 'new'", [userId]);

  if (results.length === 0) {
    for (const key of plan.categories) {
      const category = OPPORTUNITY_CATEGORIES[key];
      await pool.query(
        "INSERT INTO opportunities (user_id, title, company, city, pitch_message, price_hint, status) VALUES ($1, $2, $3, $4, $5, $6, 'new')",
        [
          userId,
          `${category.label} costumam precisar desse tipo de serviço.`,
          category.label,
          "Poucos dados de mapa pra sua região ainda",
          plan.template.replace(/\{negocio\}/gi, category.label),
          plan.priceHint
        ]
      );
    }
  } else {
    for (const item of results) {
      await pool.query(
        `INSERT INTO opportunities (user_id, title, company, city, pitch_message, address, phone, website, opening_hours, price_hint, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new')`,
        [
          userId,
          item.name,
          item.categoryLabel,
          formatDistance(item.distanceMeters),
          plan.template.replace(/\{negocio\}/gi, item.name),
          item.address,
          item.phone,
          item.website,
          item.openingHours,
          plan.priceHint
        ]
      );
    }
  }

  return getOpportunities(userId);
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`;
  const response = await fetch(url, { headers: { "User-Agent": "PixoApp/1.0 (contato@pixo.app)" } });

  if (!response.ok) {
    return null;
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const first = payload[0] as { lat?: unknown; lon?: unknown };
  const lat = typeof first.lat === "string" ? Number(first.lat) : NaN;
  const lon = typeof first.lon === "string" ? Number(first.lon) : NaN;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return { lat, lon };
}

type OutreachPlan = {
  categories: OpportunityCategoryKey[];
  template: string;
  priceHint: string;
};

function defaultOutreachTemplate(skills: string): string {
  return `Oi, tudo bem? Sou profissional de ${skills} e trabalho ajudando negócios como o {negocio} a resolver essa necessidade sem dor de cabeça. Já ajudei outros clientes a ganhar tempo e melhorar o resultado nessa área. Posso te mandar mais detalhes e um valor, ou prefere que eu já sugira um horário pra conversarmos?`;
}

async function planOutreach(
  skills: string,
  preferredChannel: string | null,
  displayName: string | null
): Promise<OutreachPlan> {
  const keys = Object.keys(OPPORTUNITY_CATEGORIES) as OpportunityCategoryKey[];
  const channelLabel = preferredChannel ?? "WhatsApp";
  const signatureInstruction = displayName
    ? `Assine a mensagem com o nome "${displayName}" (ex: se apresente como "${displayName}, especialista em ...").`
    : "Não invente um nome — não assine com nome nenhum, deixe a mensagem sem assinatura.";
  const instructions = [
    "Você é o motor do Radar de Oportunidades do PIXO, um app de renda extra.",
    "Tarefa 1: escolher quais tipos de negócio local costumam precisar do serviço que o usuário oferece.",
    `Escolha entre 3 e 5 categorias desta lista fixa: ${keys.join(", ")}.`,
    "Seja literal e específico: prefira a categoria mais diretamente ligada à necessidade real (ex: limpeza de piscina → pool, não school; passear com cães → veterinary/pet, não retail).",
    `Tarefa 2: escrever UMA mensagem de primeiro contato (estilo ${channelLabel}) que o usuário possa copiar e colar pra abordar qualquer um desses negócios.`,
    "A mensagem tem que soar como um profissional de verdade se apresentando, não um script genérico e raso.",
    "Regras da mensagem: 3 a 5 frases. Comece se apresentando pelo nome do serviço/ofício (ex: 'Sou churrasqueiro especializado em eventos'). " +
      signatureInstruction +
      " Cite UM benefício concreto e específico pro tipo de negócio (economia de tempo, aumento de vendas, experiência melhor pro cliente final — adapte ao serviço). " +
      "Evite frases vagas como 'posso ajudar' ou 'bora conversar' sozinhas — seja específico sobre o que você entrega. " +
      "Termine com uma pergunta objetiva que facilite o negócio responder (ex: perguntar sobre um horário, ou propor enviar um orçamento/portfólio).",
    "A mensagem PRECISA conter o texto literal {negocio} no lugar do nome do negócio, pra ser substituído depois.",
    "Tarefa 3: dar uma faixa de preço realista em reais (BR) pra esse tipo de serviço avulso ou mensal, curta, ex: 'R$ 80–200 por visita' ou 'R$ 300–600 por mês'.",
    'Responda estritamente em JSON, sem markdown, no formato exato: {"categories": ["chave1","chave2"], "template": "mensagem com {negocio}", "priceHint": "R$ X–Y ..."}. Use somente chaves da lista em categories.'
  ].join("\n");

  try {
    const raw = await callOpenAi(instructions, `Habilidades/serviço do usuário: ${skills}.`);
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed: unknown = JSON.parse(cleaned);

    if (parsed && typeof parsed === "object") {
      const record = parsed as { categories?: unknown; template?: unknown; priceHint?: unknown };
      const categories = Array.isArray(record.categories)
        ? record.categories.filter((item): item is OpportunityCategoryKey => keys.includes(item as OpportunityCategoryKey))
        : [];
      const template = typeof record.template === "string" && record.template.includes("{negocio}") ? record.template : null;
      const priceHint = typeof record.priceHint === "string" && record.priceHint.trim().length > 0 ? record.priceHint : "Valor a combinar";

      if (categories.length > 0 && template) {
        return { categories: categories.slice(0, 5), template, priceHint };
      }
    }
  } catch {
    // Falls through to the default plan below.
  }

  return { categories: DEFAULT_OPPORTUNITY_CATEGORIES, template: defaultOutreachTemplate(skills), priceHint: "Valor a combinar" };
}

function buildCategoryQuery(lat: number, lon: number, key: OpportunityCategoryKey): string {
  const radiusMeters = 5000;
  const blocks = OPPORTUNITY_CATEGORIES[key].filters
    .map((filter) => {
      const [tagKey, tagValue] = filter.split("=");
      return `nwr["${tagKey}"="${tagValue}"](around:${radiusMeters},${lat},${lon});`;
    })
    .join("");

  return `[out:json][timeout:10];(${blocks});out center 12;`;
}

type OverpassResult = {
  name: string;
  categoryLabel: string;
  distanceMeters: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
};

function extractAddress(tags: Record<string, string>): string | null {
  const street = tags["addr:street"];

  if (!street) {
    return null;
  }

  const houseNumber = tags["addr:housenumber"];
  return houseNumber ? `${street}, ${houseNumber}` : street;
}

function extractPhone(tags: Record<string, string>): string | null {
  return tags.phone ?? tags["contact:phone"] ?? null;
}

function extractWebsite(tags: Record<string, string>): string | null {
  return tags.website ?? tags["contact:website"] ?? null;
}

function extractOpeningHours(tags: Record<string, string>): string | null {
  return tags.opening_hours ?? null;
}

async function queryOverpassForCategory(lat: number, lon: number, key: OpportunityCategoryKey): Promise<OverpassResult[]> {
  const query = buildCategoryQuery(lat, lon, key);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "User-Agent": "PixoApp/1.0 (contato@pixo.app)",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();

    if (!payload || typeof payload !== "object" || !("elements" in payload) || !Array.isArray(payload.elements)) {
      return [];
    }

    const categoryLabel = OPPORTUNITY_CATEGORIES[key].label;

    return payload.elements
      .map((element) => {
        if (!element || typeof element !== "object") {
          return null;
        }

        const record = element as {
          tags?: Record<string, string>;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
        };
        const name = record.tags?.name;
        const elementLat = record.lat ?? record.center?.lat;
        const elementLon = record.lon ?? record.center?.lon;

        if (!name || elementLat === undefined || elementLon === undefined) {
          return null;
        }

        return {
          name,
          categoryLabel,
          distanceMeters: haversineMeters(lat, lon, elementLat, elementLon),
          address: extractAddress(record.tags ?? {}),
          phone: extractPhone(record.tags ?? {}),
          website: extractWebsite(record.tags ?? {}),
          openingHours: extractOpeningHours(record.tags ?? {})
        };
      })
      .filter((item): item is OverpassResult => item !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function queryOverpass(lat: number, lon: number, categories: OpportunityCategoryKey[]): Promise<OverpassResult[]> {
  const perCategory = await Promise.all(categories.map((key) => queryOverpassForCategory(lat, lon, key)));
  const results = perCategory.flat().sort((a, b) => a.distanceMeters - b.distanceMeters);

  const seen = new Set<string>();
  const deduped: OverpassResult[] = [];

  for (const item of results) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      deduped.push(item);
    }
  }

  return deduped.slice(0, 15);
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m de você`;
  }

  return `${(meters / 1000).toFixed(1)} km de você`;
}

function serializeProgressEvent(event: ProgressEventRow): {
  id: string;
  amount: number;
  description: string;
  kind: string;
  xpReward: number;
  createdAt: string;
} {
  return {
    id: event.id,
    amount: Number(event.amount),
    description: event.description,
    kind: event.kind,
    xpReward: event.xp_reward,
    createdAt: event.created_at
  };
}

async function getMentorMessages(userId: string): Promise<MentorMessageRow[]> {
  const result = await pool.query<MentorMessageRow>(
    "SELECT id, role, content, created_at FROM mentor_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 40",
    [userId]
  );
  return result.rows;
}

async function migrateDraft(userId: string, draft: OnboardingDraft): Promise<void> {
  const mission = buildInitialMission(draft);
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (draft.city) {
    const coords = await geocodeCity(draft.city);

    if (coords) {
      latitude = coords.lat;
      longitude = coords.lon;
    }
  }

  await pool.query(
    `INSERT INTO ai_profiles (user_id, preferred_channel, display_name, city, latitude, longitude, skills, memory)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::JSONB)
     ON CONFLICT (user_id)
     DO UPDATE SET
       preferred_channel = EXCLUDED.preferred_channel,
       display_name = COALESCE(EXCLUDED.display_name, ai_profiles.display_name),
       city = COALESCE(EXCLUDED.city, ai_profiles.city),
       latitude = COALESCE(EXCLUDED.latitude, ai_profiles.latitude),
       longitude = COALESCE(EXCLUDED.longitude, ai_profiles.longitude),
       skills = CASE WHEN array_length(EXCLUDED.skills, 1) > 0 THEN EXCLUDED.skills ELSE ai_profiles.skills END,
       memory = ai_profiles.memory || EXCLUDED.memory,
       updated_at = now()`,
    [
      userId,
      draft.channel,
      draft.displayName ?? null,
      draft.city ?? null,
      latitude,
      longitude,
      draft.skill ? [draft.skill] : [],
      JSON.stringify({
        monthlyGoal: draft.monthlyGoal,
        onboardingCreatedAt: draft.createdAt
      })
    ]
  );

  const activeGoal = await getActiveGoal(userId);

  if (!activeGoal) {
    await pool.query("INSERT INTO goals (user_id, name, target_amount) VALUES ($1, $2, $3)", [
      userId,
      "Meta mensal",
      draft.monthlyGoal
    ]);
  }

  const activeMission = await getTodaysMission(userId);

  if (!activeMission) {
    await pool.query(
      `INSERT INTO missions (user_id, title, description, estimated_value, status, source, target_count, xp_reward)
       VALUES ($1, $2, $3, $4, 'active', 'onboarding', $5, $6)`,
      [userId, mission.title, mission.description, mission.estimatedValue, mission.targetCount, 40]
    );
  }
}

async function askOpenAi(userId: string, message: string): Promise<string> {
  const profile = await getProfile(userId);
  const goal = await getActiveGoal(userId);
  const mission = await getTodaysMission(userId);
  const instructions = [
    "Você é o PIXO IA, um copiloto financeiro e mentor de renda extra.",
    "Use a memória do usuário para sugerir ações práticas, curtas e verificáveis.",
    "Não prometa ganhos garantidos. Transforme objetivos em missões realistas.",
    `Perfil: canal=${profile?.preferred_channel ?? "não informado"}, habilidades=${profile?.skills.join(", ") ?? ""}.`,
    `Meta ativa: ${goal ? `R$ ${goal.current_amount} de R$ ${goal.target_amount}` : "nenhuma"}.`,
    `Missão ativa: ${mission ? mission.title : "nenhuma"}.`
  ].join("\n");

  return callOpenAi(instructions, message);
}

async function callOpenAi(instructions: string, input: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new HttpError(503, "OPENAI_API_KEY não configurada na API local.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions,
      input
    })
  });
  const payload: unknown = await openAiResponse.json();

  if (!openAiResponse.ok) {
    const messageText = readOpenAiError(payload);
    throw new HttpError(openAiResponse.status, messageText);
  }

  const text = extractResponseText(payload);

  if (text) {
    return text;
  }

  throw new HttpError(502, "A resposta da IA veio sem texto.");
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("output_text" in payload && typeof payload.output_text === "string" && payload.output_text.length > 0) {
    return payload.output_text;
  }

  if (!("output" in payload) || !Array.isArray(payload.output)) {
    return null;
  }

  const text = payload.output
    .filter((item): item is { type: string; content: unknown[] } => {
      return Boolean(item) && typeof item === "object" && (item as { type?: unknown }).type === "message";
    })
    .flatMap((item) => item.content)
    .filter((part): part is { type: string; text: string } => {
      return (
        Boolean(part) &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      );
    })
    .map((part) => part.text)
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

function createSession(user: UserRow): { token: string; user: { id: string; email: string } } {
  return {
    token: jwt.sign({ sub: user.id }, getJwtSecret(), { expiresIn: "30d" }),
    user: publicUser(user)
  };
}

function publicUser(user: UserRow): { id: string; email: string } {
  return { id: user.id, email: user.email };
}

function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  try {
    const header = request.header("authorization");

    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Token ausente.");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, getJwtSecret());

    if (!isJwtPayload(payload) || typeof payload.sub !== "string") {
      throw new HttpError(401, "Token inválido.");
    }

    (request as AuthedRequest).userId = payload.sub;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Token inválido."));
  }
}

function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev_pixo_secret_troque_na_vps";
}

function buildInitialMission(draft: OnboardingDraft): {
  title: string;
  description: string;
  estimatedValue: number;
  targetCount: number;
} {
  const channelLabel = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    email: "email"
  }[draft.channel];
  const estimatedValue = Math.max(20, Math.min(80, Math.round(draft.monthlyGoal * 0.16)));

  return {
    title: `Enviar mensagem para 20 pessoas pelo ${channelLabel}`,
    description: "Ofereça um serviço simples que você consiga entregar hoje. Toque em +1 a cada mensagem enviada, até fechar o primeiro cliente.",
    estimatedValue,
    targetCount: 20
  };
}

function serializeMessages(messages: MentorMessageRow[]): {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at
  }));
}

function readBody(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== "object") {
    throw new HttpError(400, "Corpo da requisição inválido.");
  }

  return request.body as Record<string, unknown>;
}

function readEmail(value: unknown): string {
  const email = readNonEmptyString(value, "Email").toLowerCase();

  if (!email.includes("@")) {
    throw new HttpError(400, "Email inválido.");
  }

  return email;
}

function readPassword(value: unknown): string {
  const password = readNonEmptyString(value, "Senha");

  if (password.length < 8) {
    throw new HttpError(400, "A senha precisa ter pelo menos 8 caracteres.");
  }

  return password;
}

function readParam(value: string | string[] | undefined, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${label} obrigatório.`);
  }

  return value;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `${label} obrigatório.`);
  }

  return value.trim();
}

function readOpenAiError(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "A IA não respondeu como esperado.";
  }

  const error = payload.error as Record<string, unknown>;
  return typeof error.message === "string" ? error.message : "A IA não respondeu como esperado.";
}

function firstRow<T>(rows: T[]): T {
  const row = rows[0];

  if (!row) {
    throw new HttpError(404, "Registro não encontrado.");
  }

  return row;
}

function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.monthlyGoal === "number" &&
    draft.monthlyGoal > 0 &&
    isChannel(draft.channel) &&
    typeof draft.createdAt === "string"
  );
}

function isChannel(value: unknown): value is OnboardingDraft["channel"] {
  return value === "whatsapp" || value === "instagram" || value === "email";
}

function isJwtPayload(value: string | JwtPayload): value is JwtPayload {
  return typeof value === "object" && value !== null;
}

function isPgUniqueError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}
