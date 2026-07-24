import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bot, ChevronRight, Clock, Target, TrendingDown, TrendingUp } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useBootstrap } from "../../hooks/useBootstrap";
import { useProgressSummary } from "../../hooks/useProgressSummary";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function HomeScreen() {
  const { data, error, loading } = useBootstrap();
  const today = useProgressSummary("day");

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const displayName = data?.profile?.displayName ?? data?.user.email.split("@")[0] ?? "usuário";
  const progress = data?.progress;
  const percent =
    progress && progress.targetAmount > 0
      ? Math.min(100, Math.round((progress.earnedAmount / progress.targetAmount) * 100))
      : 0;
  const earnedToday = today.data?.earnedAmount ?? 0;
  const dailyTarget = progress && progress.targetAmount > 0 ? progress.targetAmount / 30 : 0;
  const lostToday = Math.max(0, Math.round(dailyTarget - earnedToday));
  const recentActivity = today.data?.history.slice(0, 3) ?? [];

  return (
    <AppScreen>
      {error ? (
        <EmptyState icon={Bot} title="PIXO IA indisponível" body={error} />
      ) : (
        <>
          <View style={styles.aiHero}>
            <View style={styles.aiHeader}>
              <View>
                <Text style={styles.kicker}>PIXO IA</Text>
                <Text style={styles.title}>Bom dia, {displayName}.</Text>
              </View>
              <MascotImage name="happy" size="mascotSmall" />
            </View>
            <Text style={styles.body}>Hoje encontrei {data?.opportunitiesCount ?? 0} oportunidades para você.</Text>
            <PrimaryButton title="CONVERSAR COM A IA" icon={Bot} onPress={() => router.push("/ai")} />
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardPositive]}>
              <Text style={styles.statLabel}>Você faturou hoje</Text>
              <Text style={styles.statValuePositive}>R$ {earnedToday.toLocaleString("pt-BR")}</Text>
            </View>
            {lostToday > 0 ? (
              <View style={[styles.statCard, styles.statCardNegative]}>
                <View style={styles.statLabelRow}>
                  <TrendingDown color={colors.danger} size={14} />
                  <Text style={styles.statLabel}>Dinheiro perdido hoje</Text>
                </View>
                <Text style={styles.statValueNegative}>≈ R$ {lostToday.toLocaleString("pt-BR")}</Text>
              </View>
            ) : null}
          </View>

          <ScreenSection>
            <SectionLabel title="Missão de Hoje" icon={Target} />
            {data?.todaysMission ? (
              <Pressable style={styles.card} onPress={() => router.push("/mission")}>
                <View style={styles.cardRow}>
                  <View style={styles.flex}>
                    <Text style={styles.cardLabel}>{data.todaysMission.title}</Text>
                    <Text style={styles.body}>{data.todaysMission.description}</Text>
                    <View style={styles.missionMetaRow}>
                      <Text style={styles.reward}>Ganhe até R$ {data.todaysMission.estimatedValue.toLocaleString("pt-BR")}</Text>
                      <Text style={styles.missionSteps}>
                        {data.todaysMission.currentCount}/{data.todaysMission.targetCount} passos
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color={colors.primary} />
                </View>
              </Pressable>
            ) : (
              <EmptyState
                icon={Target}
                title="Nenhuma missão ativa"
                body="Converse com a IA para gerar uma missão ligada ao seu objetivo."
              />
            )}
          </ScreenSection>

          <ScreenSection>
            <SectionLabel title="Meta mensal" icon={TrendingUp} />
            <View style={styles.card}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.amount}>
                R$ {progress?.earnedAmount.toLocaleString("pt-BR") ?? "0"} / R${" "}
                {progress?.targetAmount.toLocaleString("pt-BR") ?? "0"} ({percent}%)
              </Text>
            </View>
          </ScreenSection>

          {recentActivity.length > 0 ? (
            <ScreenSection>
              <SectionLabel title="Atividade recente" icon={Clock} />
              <View style={styles.card}>
                {recentActivity.map((event) => (
                  <View key={event.id} style={styles.activityRow}>
                    <Text style={styles.activityLabel}>{event.description}</Text>
                    {event.amount > 0 ? (
                      <Text style={styles.reward}>+R$ {event.amount.toLocaleString("pt-BR")}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </ScreenSection>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

type SectionLabelProps = {
  title: string;
  icon: typeof Bot;
};

function SectionLabel({ title, icon: Icon }: SectionLabelProps) {
  return (
    <View style={styles.sectionLabel}>
      <Icon color={colors.primary} size={18} />
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
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
  aiHero: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statCard: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xxs
  },
  statCardPositive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised
  },
  statCardNegative: {
    borderColor: colors.danger,
    backgroundColor: colors.surface
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  statValuePositive: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "900"
  },
  statValueNegative: {
    color: colors.danger,
    fontSize: typography.body,
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
  cardLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  amount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: spacing.lg
  },
  reward: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900"
  },
  missionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  missionSteps: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  flex: {
    flex: 1,
    gap: spacing.xs
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  sectionLabelText: {
    color: colors.text,
    fontSize: typography.body,
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
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  activityLabel: {
    flex: 1,
    color: colors.textSoft,
    fontSize: typography.small
  }
});
