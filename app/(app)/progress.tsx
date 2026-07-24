import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BarChart3 } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { useProgressSummary } from "../../hooks/useProgressSummary";
import type { ProgressRange } from "../../lib/api";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

const RANGES: { key: ProgressRange; label: string }[] = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" }
];

export default function ProgressScreen() {
  const [range, setRange] = useState<ProgressRange>("month");
  const { data, error, loading } = useProgressSummary(range);

  const percent =
    data && data.targetAmount > 0 ? Math.min(100, Math.round((data.earnedAmount / data.targetAmount) * 100)) : 0;

  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Progresso</Text>
        <Text style={styles.title}>R$ {(data?.earnedAmount ?? 0).toLocaleString("pt-BR")} acumulados</Text>
      </ScreenSection>

      <View style={styles.tabs}>
        {RANGES.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setRange(item.key)}
            style={[styles.tab, range === item.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, range === item.key && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState icon={BarChart3} title="Não foi possível carregar" body={error} />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.amount}>
              R$ {data?.earnedAmount.toLocaleString("pt-BR") ?? "0"} / R$ {data?.targetAmount.toLocaleString("pt-BR") ?? "0"} (
              {percent}%)
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data?.missionsCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Missões concluídas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data?.xpEarned ?? 0}</Text>
              <Text style={styles.statLabel}>XP ganho</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>R$ {data?.earnedAmount.toLocaleString("pt-BR") ?? "0"}</Text>
              <Text style={styles.statLabel}>Faturamento</Text>
            </View>
          </View>

          <ScreenSection>
            <Text style={styles.sectionLabel}>Histórico</Text>
            {data && data.history.length > 0 ? (
              <View style={styles.card}>
                {data.history.map((event) => (
                  <View key={event.id} style={styles.historyRow}>
                    <View style={styles.flex}>
                      <Text style={styles.historyLabel}>{event.description}</Text>
                      <Text style={styles.historyDate}>{new Date(event.createdAt).toLocaleDateString("pt-BR")}</Text>
                    </View>
                    {event.amount > 0 ? <Text style={styles.reward}>+R$ {event.amount.toLocaleString("pt-BR")}</Text> : null}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState icon={BarChart3} title="Sem histórico" body="Quando houver ações reais, o progresso aparece aqui." />
            )}
          </ScreenSection>

          <MascotImage name="radar" size="mascotMedium" />
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: spacing.xl,
    alignItems: "center"
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
  tabs: {
    flexDirection: "row",
    gap: spacing.xs
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  tabActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "800"
  },
  tabLabelActive: {
    color: colors.primary
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
  amount: {
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
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md
  },
  statValue: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: "center"
  },
  sectionLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  flex: {
    flex: 1,
    gap: spacing.xxs
  },
  historyLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700"
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: typography.caption
  },
  reward: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "900"
  }
});
