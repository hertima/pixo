import { StyleSheet, Text } from "react-native";
import { BarChart3 } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { colors, typography } from "../../theme/tokens";

export default function ProgressScreen() {
  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Progresso</Text>
        <Text style={styles.title}>R$ 0 acumulados</Text>
      </ScreenSection>

      <MascotImage name="radar" size="mascotMedium" />
      <EmptyState
        icon={BarChart3}
        title="Sem histórico"
        body="Quando houver ações reais, o progresso aparece aqui."
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
