import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { saveOnboardingDraft, type MissionChannel } from "../../lib/storage";
import { colors, radii, spacing, typography } from "../../theme/tokens";

const channels: readonly MissionChannel[] = ["whatsapp", "instagram", "email"];

export default function OnboardingScreen() {
  const [goal, setGoal] = useState("");
  const [channel, setChannel] = useState<MissionChannel>("whatsapp");
  const [error, setError] = useState<string | null>(null);

  async function continueToPaywall() {
    const monthlyGoal = Number(goal.replace(",", "."));

    if (!Number.isFinite(monthlyGoal) || monthlyGoal <= 0) {
      setError("Informe uma meta mensal válida.");
      return;
    }

    await saveOnboardingDraft({
      monthlyGoal,
      channel,
      createdAt: new Date().toISOString()
    });

    router.replace("/paywall");
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenSection>
          <Text style={styles.kicker}>PIXO</Text>
          <Text style={styles.title}>Missão de renda</Text>
          <Text style={styles.body}>Defina sua meta real antes de criar conta.</Text>
        </ScreenSection>

        <MascotImage name="cash" size="mascotLarge" />

        <ScreenSection>
          <Text style={styles.label}>Meta mensal</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={setGoal}
            placeholder="500"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={goal}
          />

          <Text style={styles.label}>Canal principal</Text>
          <View style={styles.channelRow}>
            {channels.map((value) => (
              <Pressable
                accessibilityRole="button"
                key={value}
                onPress={() => setChannel(value)}
                style={[styles.channel, channel === value && styles.channelActive]}
              >
                <Text style={[styles.channelText, channel === value && styles.channelTextActive]}>{value}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenSection>

        <PrimaryButton title="CONTINUAR" icon={ArrowRight} onPress={continueToPaywall} />
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: spacing.lg
  },
  kicker: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.headline,
    fontWeight: "900"
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: typography.title
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "800"
  },
  input: {
    minHeight: spacing.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md
  },
  channelRow: {
    flexDirection: "row",
    gap: spacing.xs
  },
  channel: {
    flex: 1,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface
  },
  channelActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.primaryDark
  },
  channelText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  channelTextActive: {
    color: colors.text
  },
  error: {
    color: colors.danger,
    fontSize: typography.small
  }
});
