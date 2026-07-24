import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Crown, Sparkles } from "lucide-react-native";

import { BackHeader } from "../../components/BackHeader";
import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { useBootstrap } from "../../hooks/useBootstrap";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function EvolutionScreen() {
  const { data, loading } = useBootstrap();

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="PIXO Evolui com você" />
        <Text style={styles.subtitle}>Cada missão concluída soma XP e sobe seu nível.</Text>
      </ScreenSection>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.list}>
          {(data?.gamification.levels ?? []).map((level, index) => {
            const isCurrent = index === data?.gamification.levelIndex;
            const isPast = data ? index < data.gamification.levelIndex : false;

            return (
              <View key={level} style={[styles.row, isCurrent && styles.rowCurrent]}>
                <View style={[styles.badge, (isCurrent || isPast) && styles.badgeActive]}>
                  {index === (data?.gamification.levels.length ?? 0) - 1 ? (
                    <Crown color={isCurrent || isPast ? colors.background : colors.textMuted} size={16} />
                  ) : (
                    <Text style={[styles.badgeNumber, (isCurrent || isPast) && styles.badgeNumberActive]}>{index + 1}</Text>
                  )}
                </View>
                <Text style={[styles.levelName, isCurrent && styles.levelNameCurrent]}>{level}</Text>
                {isCurrent ? <Sparkles color={colors.primary} size={16} /> : null}
              </View>
            );
          })}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: spacing.xl,
    alignItems: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small
  },
  list: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  rowCurrent: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.input
  },
  badgeActive: {
    backgroundColor: colors.primary
  },
  badgeNumber: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  badgeNumberActive: {
    color: colors.background
  },
  levelName: {
    flex: 1,
    color: colors.textSoft,
    fontSize: typography.body,
    fontWeight: "700"
  },
  levelNameCurrent: {
    color: colors.text,
    fontWeight: "900"
  }
});
