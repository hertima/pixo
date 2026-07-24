import { StyleSheet, Text, View } from "react-native";
import { User } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { apiUrl } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../theme/tokens";

export default function ProfileScreen() {
  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Mais</Text>
        <Text style={styles.title}>Conta PIXO</Text>
      </ScreenSection>

      <MascotImage name="laptop" size="mascotSmall" />

      <View style={styles.card}>
        <Text style={styles.label}>API local</Text>
        <Text style={styles.value}>{apiUrl}</Text>
      </View>

      <EmptyState
        icon={User}
        title="Perfil vazio"
        body="Dados de perfil reais entram após autenticação e migração do onboarding."
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xs
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.small
  },
  value: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  }
});
