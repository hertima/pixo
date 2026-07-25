import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Clock, Copy } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { MascotImage } from "../../components/MascotImage";
import { apiRequest, type CheckinResponse } from "../../lib/api";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

const TIME_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hora" },
  { minutes: 120, label: "2h ou mais" }
];

export default function CheckinScreen() {
  const [loadingMinutes, setLoadingMinutes] = useState<number | null>(null);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function checkin(minutes: number) {
    setLoadingMinutes(minutes);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await apiRequest<CheckinResponse>("/api/checkin", {
        method: "POST",
        body: { minutes }
      });
      setResult(response);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível gerar uma sugestão.");
    } finally {
      setLoadingMinutes(null);
    }
  }

  async function copyMessage() {
    if (!result?.message) {
      return;
    }

    await Clipboard.setStringAsync(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Check-in de Tempo" />
        <Text style={styles.subtitle}>Quanto tempo livre você tem agora? O PIXO sugere algo que caiba nesse tempo.</Text>
      </ScreenSection>

      <MascotImage name="happy" size="mascotMedium" />

      <View style={styles.options}>
        {TIME_OPTIONS.map((option) => (
          <Pressable
            key={option.minutes}
            style={styles.option}
            disabled={loadingMinutes !== null}
            onPress={() => checkin(option.minutes)}
          >
            {loadingMinutes === option.minutes ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Clock color={colors.primary} size={20} />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </>
            )}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionLabel}>PIXO sugere</Text>
          <Text style={styles.suggestionText}>{result.suggestion}</Text>

          {result.message ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.suggestionLabel}>Mensagem pronta</Text>
              <Text style={styles.suggestionText}>{result.message}</Text>
              <Pressable style={styles.copyButton} onPress={copyMessage}>
                <Copy color={colors.primary} size={14} />
                <Text style={styles.copyLabel}>{copied ? "Mensagem copiada" : "Copiar mensagem"}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: spacing.lg
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  option: {
    flexBasis: "47%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg
  },
  optionLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontSize: typography.small
  },
  suggestionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.card
  },
  suggestionLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  suggestionText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: spacing.lg
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xxs,
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs
  },
  copyLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "800"
  }
});
