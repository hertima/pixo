import { StyleSheet, Text } from "react-native";
import { Target } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { colors, typography } from "../../theme/tokens";

export default function MissionScreen() {
  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Missão do Dia</Text>
        <Text style={styles.title}>Nenhuma missão ativa</Text>
      </ScreenSection>

      <MascotImage name="target" size="mascotLarge" />
      <EmptyState
        icon={Target}
        title="Lista vazia"
        body="A próxima fase liga missões reais vindas do banco e dos limites da Edge Function."
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
  }
});
