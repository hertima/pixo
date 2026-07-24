import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { loadOnboardingDraft, loadPaywallDecision, loadStoredSession } from "../lib/storage";
import { colors } from "../theme/tokens";

export default function IndexRoute() {
  useEffect(() => {
    let active = true;

    async function resolveRoute() {
      const draft = await loadOnboardingDraft();

      if (!active) {
        return;
      }

      if (!draft) {
        router.replace("/onboarding");
        return;
      }

      const paywallDecision = await loadPaywallDecision();

      if (!active) {
        return;
      }

      if (!paywallDecision) {
        router.replace("/paywall");
        return;
      }

      const session = await loadStoredSession();

      if (!active) {
        return;
      }

      router.replace(session ? "/home" : "/auth");
    }

    resolveRoute();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  }
});
