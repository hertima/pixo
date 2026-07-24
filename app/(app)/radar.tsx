import { StyleSheet, Text } from "react-native";
import { Radar as RadarIcon } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { colors, typography } from "../../theme/tokens";

export default function RadarScreen() {
  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Radar de Oportunidades" />
        <Text style={styles.subtitle}>Empresas perto de você precisando do seu serviço.</Text>
      </ScreenSection>

      <MascotImage name="radar" size="mascotLarge" />

      <EmptyState
        icon={RadarIcon}
        title="Em breve"
        body="Ainda estamos conectando fontes reais de oportunidades na sua região. Continue completando missões enquanto isso."
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small
  }
});
