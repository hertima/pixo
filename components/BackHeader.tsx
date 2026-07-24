import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { colors, spacing, typography } from "../theme/tokens";

type BackHeaderProps = {
  title: string;
};

export function BackHeader({ title }: BackHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.button}>
        <ChevronLeft color={colors.primary} size={22} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  button: {
    padding: spacing.xxs
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  }
});
