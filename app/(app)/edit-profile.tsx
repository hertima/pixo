import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useBootstrap } from "../../hooks/useBootstrap";
import { apiRequest } from "../../lib/api";
import { colors, radii, spacing, typography } from "../../theme/tokens";

const CHANNELS: { key: "whatsapp" | "instagram" | "email"; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "email", label: "Email" }
];

export default function EditProfileScreen() {
  const { data, loading, reload } = useBootstrap();
  const [displayName, setDisplayName] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "instagram" | "email">("whatsapp");
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!initialized && data) {
    setDisplayName(data.profile?.displayName ?? "");
    setMonthlyGoal(data.activeGoal ? String(data.activeGoal.targetAmount) : "");
    setCity(data.profile?.city ?? "");
    setSkill(data.profile?.skills[0] ?? "");
    setChannel((data.profile?.preferredChannel as typeof channel) ?? "whatsapp");
    setInitialized(true);
  }

  async function save() {
    setSaving(true);
    setSaved(false);

    try {
      const goalNumber = Number(monthlyGoal.replace(",", "."));

      await apiRequest("/api/profile", {
        method: "PATCH",
        body: {
          displayName: displayName.trim() || undefined,
          preferredChannel: channel,
          city: city.trim() || undefined,
          skill: skill.trim() || undefined,
          monthlyGoal: Number.isFinite(goalNumber) && goalNumber > 0 ? goalNumber : undefined
        }
      });
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !initialized) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Editar perfil" />
        <Text style={styles.subtitle}>Pode mudar quando quiser — isso ajusta suas missões, o radar e o PIXO IA.</Text>
      </ScreenSection>

      <View style={styles.field}>
        <Text style={styles.label}>Como quer ser chamado</Text>
        <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Meta mensal (R$)</Text>
        <TextInput
          value={monthlyGoal}
          onChangeText={setMonthlyGoal}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Canal preferido</Text>
        <View style={styles.chips}>
          {CHANNELS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setChannel(item.key)}
              style={[styles.chip, channel === item.key && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, channel === item.key && styles.chipLabelActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Sua cidade</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="ex: Curitiba, PR"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>O que você sabe fazer?</Text>
        <TextInput
          value={skill}
          onChangeText={setSkill}
          placeholder="ex: churrasqueiro, limpar piscina, social media"
          style={styles.input}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <PrimaryButton title={saved ? "SALVO!" : "SALVAR"} onPress={save} loading={saving} />
      <PrimaryButton title="VOLTAR" variant="secondary" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: spacing.lg
  },
  field: {
    gap: spacing.xs
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface
  },
  chipActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.primary
  },
  chipLabel: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  chipLabelActive: {
    color: colors.background
  }
});
