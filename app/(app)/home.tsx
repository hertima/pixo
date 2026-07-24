import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bot, ChevronRight, Target, TrendingUp } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useBootstrap } from "../../hooks/useBootstrap";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function HomeScreen() {
  const { data, error, loading } = useBootstrap();

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

          <ScreenSection>
            <SectionLabel title="Missão de Hoje" icon={Target} />
            {data?.todaysMission ? (
              <Pressable style={styles.card} onPress={() => router.push("/mission")}>
                <View style={styles.cardRow}>
                  <View style={styles.flex}>
                    <Text style={styles.cardLabel}>{data.todaysMission.title}</Text>
                    <Text style={styles.body}>{data.todaysMission.description}</Text>
                    <Text style={styles.reward}>Ganhe até R$ {data.todaysMission.estimatedValue.toLocaleString("pt-BR")}</Text>
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
            <SectionLabel title="Seu progresso" icon={TrendingUp} />
            <View style={styles.card}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.amount}>
                R$ {progress?.earnedAmount.toLocaleString("pt-BR") ?? "0"} / R${" "}
                {progress?.targetAmount.toLocaleString("pt-BR") ?? "0"}
              </Text>
            </View>
          </ScreenSection>
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
  }
});
