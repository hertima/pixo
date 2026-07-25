import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Radar as RadarIcon } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOpportunities } from "../../hooks/useOpportunities";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function RadarScreen() {
  const { data, error, loading, refreshing, refresh } = useOpportunities();
  const opportunities = data ?? [];

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Radar de Oportunidades" />
        <Text style={styles.subtitle}>
          Categorias de negócio que costumam precisar do seu serviço. São exemplos gerados pela IA a partir do seu
          perfil, não uma lista de empresas verificadas.
        </Text>
      </ScreenSection>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : opportunities.length === 0 ? (
        <>
          <MascotImage name="radar" size="mascotLarge" />
          {error ? (
            <EmptyState icon={RadarIcon} title="Não foi possível gerar" body={error} />
          ) : (
            <EmptyState
              icon={RadarIcon}
              title="Nenhuma oportunidade ainda"
              body="Toque no botão abaixo para o PIXO IA sugerir categorias de negócio pro seu perfil."
            />
          )}
        </>
      ) : (
        <View style={styles.list}>
          {opportunities.map((opportunity) => (
            <View key={opportunity.id} style={styles.card}>
              {opportunity.company ? <Text style={styles.company}>{opportunity.company}</Text> : null}
              <Text style={styles.title}>{opportunity.title}</Text>
              {opportunity.city ? <Text style={styles.city}>{opportunity.city}</Text> : null}
            </View>
          ))}
        </View>
      )}

      <PrimaryButton
        title={opportunities.length === 0 ? "BUSCAR OPORTUNIDADES" : "ATUALIZAR OPORTUNIDADES"}
        onPress={refresh}
        loading={refreshing}
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
  list: {
    gap: spacing.sm
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.xxs,
    ...shadows.card
  },
  company: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  city: {
    color: colors.textMuted,
    fontSize: typography.caption
  }
});
