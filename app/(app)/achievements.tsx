import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Award, Lock } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { EmptyState } from "../../components/EmptyState";
import { useAchievements } from "../../hooks/useAchievements";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function AchievementsScreen() {
  const { data, error, loading } = useAchievements();

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Conquistas" />
      </ScreenSection>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <EmptyState icon={Award} title="Não foi possível carregar" body={error} />
      ) : (
        <View style={styles.grid}>
          {(data ?? []).map((achievement) => (
            <View key={achievement.key} style={[styles.card, achievement.unlocked && styles.cardUnlocked]}>
              {achievement.unlocked ? <Award color={colors.primary} size={22} /> : <Lock color={colors.textMuted} size={22} />}
              <Text style={styles.title}>{achievement.title}</Text>
              <Text style={styles.description}>{achievement.description}</Text>
            </View>
          ))}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  cardUnlocked: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card
  },
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900"
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.caption
  }
});
