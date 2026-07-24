import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { CheckCircle2, Circle, Target } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useMissionToday } from "../../hooks/useMissionToday";
import { apiRequest, type MissionStep } from "../../lib/api";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function MissionScreen() {
  const { data, error, loading, reload } = useMissionToday();
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen>
        <EmptyState icon={Target} title="Não foi possível carregar" body={error} />
      </AppScreen>
    );
  }

  const mission = data?.mission ?? null;
  const steps = data?.steps ?? [];

  if (!mission) {
    return (
      <AppScreen>
        <ScreenSection>
          <Text style={styles.kicker}>Missão do Dia</Text>
          <Text style={styles.title}>Nenhuma missão ativa</Text>
        </ScreenSection>
        <MascotImage name="target" size="mascotLarge" />
        <EmptyState
          icon={Target}
          title="Lista vazia"
          body="Converse com o PIXO IA para gerar sua próxima missão."
        />
      </AppScreen>
    );
  }

  const percent = mission.targetCount > 0 ? Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100)) : 0;
  const allStepsDone = steps.length > 0 ? steps.every((step) => step.done) : mission.currentCount >= mission.targetCount;
  const isCompleted = mission.status === "completed";

  async function toggleStep(step: MissionStep) {
    if (!mission || busyStepId) {
      return;
    }

    setBusyStepId(step.id);

    try {
      await apiRequest(`/api/missions/${mission.id}/steps/${step.id}/toggle`, { method: "POST" });
      await reload();
    } finally {
      setBusyStepId(null);
    }
  }

  async function copyMessage() {
    if (!mission) {
      return;
    }

    await Clipboard.setStringAsync(mission.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function completeMission() {
    if (!mission || completing) {
      return;
    }

    setCompleting(true);

    try {
      await apiRequest(`/api/missions/${mission.id}/complete`, { method: "POST" });
      await reload();
    } finally {
      setCompleting(false);
    }
  }

  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Missão do Dia</Text>
        <Text style={styles.title}>{mission.title}</Text>
      </ScreenSection>

      <MascotImage name="target" size="mascotMedium" />

      <View style={styles.card}>
        <Text style={styles.body}>{mission.description}</Text>

        <View style={styles.progressRow}>
          <Text style={styles.stepsLabel}>
            {mission.currentCount}/{mission.targetCount}
          </Text>
          <Text style={styles.reward}>≈ R$ {mission.estimatedValue.toLocaleString("pt-BR")} · +{mission.xpReward} XP</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      {steps.length > 0 ? (
        <View style={styles.card}>
          {steps.map((step) => (
            <Pressable
              key={step.id}
              style={styles.stepRow}
              disabled={isCompleted || busyStepId === step.id}
              onPress={() => toggleStep(step)}
            >
              {step.done ? <CheckCircle2 color={colors.primary} size={20} /> : <Circle color={colors.textMuted} size={20} />}
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {isCompleted ? (
        <EmptyState icon={CheckCircle2} title="Missão concluída" body="Você já ganhou a recompensa dessa missão." />
      ) : (
        <>
          <PrimaryButton
            title={copied ? "MENSAGEM COPIADA" : "COPIAR MENSAGEM"}
            variant="secondary"
            onPress={copyMessage}
          />
          <PrimaryButton
            title="MARCAR COMO CONCLUÍDA"
            onPress={completeMission}
            disabled={!allStepsDone}
            loading={completing}
          />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  kicker: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: spacing.lg
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepsLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900"
  },
  reward: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900"
  },
  progressTrack: {
    height: spacing.sm,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.input
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.pill,
    backgroundColor: colors.primary
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  stepLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  stepLabelDone: {
    color: colors.textMuted,
    textDecorationLine: "line-through"
  }
});
