import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, Bot, ChevronRight, Clock, Target } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
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
  const remaining = progress ? Math.max(0, progress.targetAmount - progress.earnedAmount) : 0;
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
          <View style={styles.header}>
            <Text style={styles.greeting}>Olá, {displayName}! 👋</Text>
            <Bell color={colors.textMuted} size={20} />
          </View>

          <View style={[styles.card, styles.cardAccentGold]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Você faturou hoje</Text>
              <MascotImage name="cash" size="mascotTiny" />
            </View>
            <Text style={styles.valueGold}>R$ {earnedToday.toLocaleString("pt-BR")}</Text>
          </View>

          <View style={[styles.card, styles.cardAccentGreen]}>
            <Text style={styles.cardLabel}>Meta mensal</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.amount}>
                R$ {progress?.earnedAmount.toLocaleString("pt-BR") ?? "0"} / R${" "}
                {progress?.targetAmount.toLocaleString("pt-BR") ?? "0"}
              </Text>
              <Text style={styles.percentLabel}>{percent}%</Text>
            </View>
            <Text style={styles.remainingLabel}>Faltam apenas R$ {remaining.toLocaleString("pt-BR")}</Text>
          </View>

          {lostToday > 0 ? (
            <View style={[styles.card, styles.cardAccentDanger]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardLabel}>Dinheiro perdido hoje</Text>
                <MascotImage name="tired" size="mascotTiny" />
              </View>
              <Text style={styles.valueDanger}>≈ R$ {lostToday.toLocaleString("pt-BR")}</Text>
              <Text style={styles.hint}>Estimativa baseada nas suas metas e atividades.</Text>
            </View>
          ) : null}

          <ScreenSection>
            <SectionLabel title="Missão de Hoje" icon={Target} />
            {data?.todaysMission ? (
              <Pressable style={styles.plainCard} onPress={() => router.push("/mission")}>
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

          {recentActivity.length > 0 ? (
            <ScreenSection>
              <SectionLabel title="Atividade recente" icon={Clock} />
              <View style={styles.plainCard}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  greeting: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  card: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.xs,
    borderLeftWidth: 4,
    ...shadows.card
  },
  cardAccentGold: {
    borderLeftColor: colors.accent
  },
  cardAccentGreen: {
    borderLeftColor: colors.primary
  },
  cardAccentDanger: {
    borderLeftColor: colors.danger
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  valueGold: {
    color: colors.accent,
    fontSize: typography.headline,
    fontWeight: "900"
  },
  valueDanger: {
    color: colors.danger,
    fontSize: typography.title,
    fontWeight: "900"
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.caption
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  amount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  percentLabel: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  remainingLabel: {
    color: colors.textMuted,
    fontSize: typography.caption
  },
  plainCard: {
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
