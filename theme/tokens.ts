export const colors = {
  background: "#030604",
  surface: "#0b1210",
  surfaceRaised: "#101a16",
  border: "#1c3428",
  borderStrong: "#39ff14",
  text: "#f5fff7",
  textMuted: "#9fb0a7",
  textSoft: "#cad8d0",
  primary: "#37d52f",
  primaryDark: "#158b20",
  accent: "#ffd02a",
  danger: "#ff8a22",
  input: "#08100d",
  transparent: "transparent"
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999
} as const;

export const typography = {
  body: 16,
  caption: 12,
  small: 14,
  title: 28,
  headline: 36
} as const;

export const iconSizes = {
  sm: 18,
  md: 22,
  lg: 30
} as const;

export const imageSizes = {
  mascotTiny: 48,
  mascotSmall: 88,
  mascotMedium: 160,
  mascotLarge: 240
} as const;

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  }
} as const;
