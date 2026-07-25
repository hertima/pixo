import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Circle, ListChecks } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { usePlan } from "../../hooks/usePlan";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function PlanScreen() {
  const { data, error, loading, generating, generate, toggleStep } = usePlan();
  const steps = data ?? [];

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Plano de Ação" />
        <Text style={styles.subtitle}>Protocolo de 21 dias gerado pelo PIXO IA com base no seu perfil.</Text>
        {steps.length > 0 ? (
          <Text style={styles.progress}>
            {steps.filter((step) => step.done).length}/{steps.length} dias concluídos
          </Text>
        ) : null}
      </ScreenSection>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : steps.length === 0 ? (
        <>
          <MascotImage name="target" size="mascotLarge" />
          {error ? (
            <EmptyState icon={ListChecks} title="Não foi possível gerar" body={error} />
          ) : (
            <EmptyState
              icon={ListChecks}
              title="Nenhum plano ainda"
              body="Toque no botão abaixo pra o PIXO montar seu protocolo semanal."
            />
          )}
        </>
      ) : (
        <View style={styles.card}>
          {steps.map((step) => (
            <Pressable key={step.id} style={styles.stepRow} onPress={() => toggleStep(step.id)}>
              {step.done ? <CheckCircle2 color={colors.primary} size={20} /> : <Circle color={colors.textMuted} size={20} />}
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, step.done && styles.stepDone]}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <PrimaryButton
        title={steps.length === 0 ? "GERAR PLANO DA SEMANA" : "GERAR NOVO PLANO"}
        onPress={generate}
        loading={generating}
        variant={steps.length === 0 ? "primary" : "secondary"}
      />
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
    fontSize: typography.small,
    lineHeight: spacing.lg
  },
  progress: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "800"
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  stepText: {
    flex: 1,
    gap: spacing.xxs
  },
  stepTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  stepDone: {
    color: colors.textMuted,
    textDecorationLine: "line-through"
  },
  stepDescription: {
    color: colors.textSoft,
    fontSize: typography.small
  }
});
