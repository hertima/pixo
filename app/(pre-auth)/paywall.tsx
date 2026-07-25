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
        title="PIXO Premium está chegando"
        body="Por enquanto, o PIXO IA, as missões, o Plano de 21 dias e o Radar de Oportunidades são liberados de graça pra todo mundo."
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
