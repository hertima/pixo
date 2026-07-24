export type Level = {
  name: string;
  minXp: number;
};

export const LEVELS: Level[] = [
  { name: "Iniciante", minXp: 0 },
  { name: "Focado", minXp: 100 },
  { name: "Anotador", minXp: 250 },
  { name: "Estratégico", minXp: 450 },
  { name: "Disciplinado", minXp: 700 },
  { name: "Dedicado", minXp: 1000 },
  { name: "Visionário", minXp: 1400 },
  { name: "Experiente", minXp: 1900 },
  { name: "Campeão", minXp: 2500 },
  { name: "Lendário", minXp: 3200 }
];

export type LevelProgress = {
  index: number;
  name: string;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
};

export function getLevelProgress(xp: number): LevelProgress {
  let index = 0;

  for (let i = 0; i < LEVELS.length; i += 1) {
    const level = LEVELS[i];

    if (level && xp >= level.minXp) {
      index = i;
    }
  }

  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;

  return {
    index,
    name: current?.name ?? "Iniciante",
    xp,
    currentLevelXp: current?.minXp ?? 0,
    nextLevelXp: next?.minXp ?? null
  };
}

export type AchievementKey = "first_client" | "first_referral" | "first_100" | "first_500";

export type AchievementDefinition = {
  key: AchievementKey;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { key: "first_client", title: "Primeiro Cliente", description: "Concluiu a primeira missão." },
  { key: "first_referral", title: "Primeira Indicação", description: "Indicou o PIXO para alguém." },
  { key: "first_100", title: "Primeiros R$100", description: "Faturou R$100 no total." },
  { key: "first_500", title: "Primeiros R$500", description: "Faturou R$500 no total." }
];

export type AchievementStats = {
  missionsCompleted: number;
  totalEarned: number;
  referrals: number;
};

export function unlockedAchievementKeys(stats: AchievementStats): AchievementKey[] {
  const keys: AchievementKey[] = [];

  if (stats.missionsCompleted > 0) {
    keys.push("first_client");
  }

  if (stats.referrals > 0) {
    keys.push("first_referral");
  }

  if (stats.totalEarned >= 100) {
    keys.push("first_100");
  }

  if (stats.totalEarned >= 500) {
    keys.push("first_500");
  }

  return keys;
}
