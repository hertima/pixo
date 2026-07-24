import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, iconSizes, radii, spacing, typography } from "../theme/tokens";

type ButtonIcon = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ButtonIcon;
  variant?: "primary" | "secondary";
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon: Icon,
  variant = "primary"
}: PrimaryButtonProps) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.text} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon color={isSecondary ? colors.primary : colors.text} size={iconSizes.sm} /> : null}
          <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: spacing.xxl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  secondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.transparent
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.82
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  text: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "800"
  },
  secondaryText: {
    color: colors.primary
  }
});
