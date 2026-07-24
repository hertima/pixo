import { StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Lock } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { savePaywallDecision } from "../../lib/storage";
import { colors, spacing, typography } from "../../theme/tokens";

export default function PaywallScreen() {
  async function continueFree() {
    await savePaywallDecision("free");
    router.replace("/auth");
  }

  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>PIXO PREMIUM</Text>
        <Text style={styles.title}>Desbloqueie missões maiores</Text>
        <Text style={styles.body}>Sua escolha fica salva antes do cadastro.</Text>
      </ScreenSection>

      <MascotImage name="coin" size="mascotLarge" />

      <EmptyState
        icon={Lock}
        title="Pagamento ainda não conectado"
        body="A API local está pronta para impor limites no servidor; a cobrança real entra quando o provedor for definido."
      />

      <PrimaryButton title="CONTINUAR GRÁTIS" onPress={continueFree} />
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
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: spacing.lg
  }
});
