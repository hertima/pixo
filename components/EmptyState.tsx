import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, iconSizes, radii, shadows, spacing, typography } from "../theme/tokens";

type EmptyStateIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: EmptyStateIcon;
};

export function EmptyState({ title, body, icon: Icon }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      {Icon ? <Icon color={colors.primary} size={iconSizes.lg} /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: typography.title
  }
});
