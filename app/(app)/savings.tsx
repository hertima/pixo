import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { PiggyBank } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useSavings } from "../../hooks/useSavings";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function SavingsScreen() {
  const { data, error, loading, saving, setGoal, deposit } = useSavings();
  const [goalInput, setGoalInput] = useState("");
  const [depositInput, setDepositInput] = useState("");

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const hasGoal = data?.targetAmount !== null && data?.targetAmount !== undefined;
  const percent =
    hasGoal && data && data.targetAmount && data.targetAmount > 0
      ? Math.min(100, Math.round((data.currentAmount / data.targetAmount) * 100))
      : 0;

  async function saveGoal() {
    const amount = Number(goalInput.replace(",", "."));

    if (Number.isFinite(amount) && amount > 0) {
      await setGoal(amount);
      setGoalInput("");
    }
  }

  async function saveDeposit() {
    const amount = Number(depositInput.replace(",", "."));

    if (Number.isFinite(amount) && amount > 0) {
      await deposit(amount);
      setDepositInput("");
    }
  }

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Caixinha de Economia" />
        <Text style={styles.subtitle}>Separe uma meta de quanto guardar, independente da sua meta de renda extra.</Text>
      </ScreenSection>

      <MascotImage name="coin" size="mascotMedium" />

      {hasGoal && data ? (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <PiggyBank color={colors.primary} size={20} />
            <Text style={styles.amount}>
              R$ {data.currentAmount.toLocaleString("pt-BR")} / R$ {data.targetAmount?.toLocaleString("pt-BR")}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.percent}>{percent}% da meta</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.label}>{hasGoal ? "Mudar meta de economia (R$)" : "Definir meta de economia (R$)"}</Text>
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          keyboardType="numeric"
          placeholder="ex: 1000"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <PrimaryButton title="SALVAR META" variant="secondary" onPress={saveGoal} loading={saving} />
      </View>

      {hasGoal ? (
        <View style={styles.field}>
          <Text style={styles.label}>Guardar um valor agora (R$)</Text>
          <TextInput
            value={depositInput}
            onChangeText={setDepositInput}
            keyboardType="numeric"
            placeholder="ex: 50"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <PrimaryButton title="GUARDAR VALOR" onPress={saveDeposit} loading={saving} />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: spacing.lg
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  amount: {
    color: colors.text,
    fontSize: typography.title,
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
  percent: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontSize: typography.small
  },
  field: {
    gap: spacing.xs
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
