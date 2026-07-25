import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function AppScreen({ children, scroll = true }: AppScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.wide}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.content, styles.wide]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ScreenSection({ children }: PropsWithChildren) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center"
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.lg
  },
  wide: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center"
  },
  section: {
    gap: spacing.md
  }
});
