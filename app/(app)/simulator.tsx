import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Calculator } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

const SERVICES = ["Edição de Vídeo", "Social Media", "Design Gráfico", "Aulas Particulares", "Outro"];
const WEEKS_PER_MONTH = 4.33;

export default function SimulatorScreen() {
  const [service, setService] = useState(SERVICES[0]);
  const [clientsPerWeek, setClientsPerWeek] = useState("3");
  const [averagePrice, setAveragePrice] = useState("150");

  const monthlyEstimate = useMemo(() => {
    const clients = Number(clientsPerWeek.replace(",", "."));
    const price = Number(averagePrice.replace(",", "."));

    if (!Number.isFinite(clients) || !Number.isFinite(price) || clients <= 0 || price <= 0) {
      return 0;
    }

    return Math.round(clients * price * WEEKS_PER_MONTH);
  }, [clientsPerWeek, averagePrice]);

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Simulador de Ganhos" />
        <Text style={styles.subtitle}>Estimativa simples com base no seu ritmo de trabalho.</Text>
      </ScreenSection>

      <View style={styles.card}>
        <Text style={styles.label}>Serviço</Text>
        <View style={styles.chips}>
          {SERVICES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setService(item)}
              style={[styles.chip, service === item && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, service === item && styles.chipLabelActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Clientes por semana</Text>
        <TextInput
          keyboardType="numeric"
          value={clientsPerWeek}
          onChangeText={setClientsPerWeek}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Preço médio (R$)</Text>
        <TextInput
          keyboardType="numeric"
          value={averagePrice}
          onChangeText={setAveragePrice}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.resultCard}>
        <Calculator color={colors.primary} size={22} />
        <Text style={styles.resultLabel}>Resultado estimado</Text>
        <Text style={styles.resultValue}>≈ R$ {monthlyEstimate.toLocaleString("pt-BR")} / mês</Text>
        <Text style={styles.disclaimer}>Estimativa baseada nos números informados. Não garante resultados.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small
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
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface
  },
  chipActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.primary
  },
  chipLabel: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  chipLabelActive: {
    color: colors.background
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
  },
  resultCard: {
    alignItems: "center",
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    ...shadows.card
  },
  resultLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  resultValue: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "900"
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: "center"
  }
});
