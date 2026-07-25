import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Clock, Copy, Globe, MapPin, Phone, Radar as RadarIcon, Wallet } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { BackHeader } from "../../components/BackHeader";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useBootstrap } from "../../hooks/useBootstrap";
import { useOpportunities } from "../../hooks/useOpportunities";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

export default function RadarScreen() {
  const { data: bootstrap } = useBootstrap();
  const { data, error, loading, refreshing, refresh } = useOpportunities();
  const [city, setCity] = useState(bootstrap?.profile?.city ?? "");
  const [skill, setSkill] = useState(bootstrap?.profile?.skills[0] ?? "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const opportunities = data ?? [];

  async function copyPitch(id: string, message: string) {
    await Clipboard.setStringAsync(message);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
  }

  return (
    <AppScreen>
      <ScreenSection>
        <BackHeader title="Radar de Oportunidades" />
        <Text style={styles.subtitle}>
          Negócios reais perto de você que costumam precisar do seu serviço, com base no mapa e no seu perfil.
        </Text>
      </ScreenSection>

      <View style={styles.locationRow}>
        <MapPin color={colors.textMuted} size={18} />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Sua cidade (ex: Curitiba, PR)"
          placeholderTextColor={colors.textMuted}
          style={styles.locationInput}
        />
      </View>

      <TextInput
        value={skill}
        onChangeText={setSkill}
        placeholder="O que você sabe fazer? (ex: churrasqueiro, limpar piscina, social media)"
        placeholderTextColor={colors.textMuted}
        style={styles.skillInput}
      />

      {opportunities.length > 0 && opportunities[0]?.priceHint ? (
        <View style={styles.priceBanner}>
          <Wallet color={colors.primary} size={16} />
          <Text style={styles.priceBannerText}>Faixa de preço estimada: {opportunities[0].priceHint}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : opportunities.length === 0 ? (
        <>
          <MascotImage name="radar" size="mascotLarge" />
          {error ? (
            <EmptyState icon={RadarIcon} title="Não foi possível buscar" body={error} />
          ) : (
            <EmptyState
              icon={RadarIcon}
              title="Nenhuma oportunidade ainda"
              body="Informe sua cidade acima e toque no botão pra o PIXO buscar negócios reais perto de você."
            />
          )}
        </>
      ) : (
        <View style={styles.list}>
          {opportunities.map((opportunity) => (
            <View key={opportunity.id} style={styles.card}>
              {opportunity.company ? <Text style={styles.company}>{opportunity.company}</Text> : null}
              <Text style={styles.title}>{opportunity.title}</Text>
              {opportunity.city ? <Text style={styles.city}>{opportunity.city}</Text> : null}
              {opportunity.address ? <Text style={styles.city}>{opportunity.address}</Text> : null}
              {opportunity.phone ? (
                <View style={styles.phoneRow}>
                  <Phone color={colors.textMuted} size={12} />
                  <Text style={styles.city}>{opportunity.phone}</Text>
                </View>
              ) : null}
              {opportunity.openingHours ? (
                <View style={styles.phoneRow}>
                  <Clock color={colors.textMuted} size={12} />
                  <Text style={styles.city}>{opportunity.openingHours}</Text>
                </View>
              ) : null}
              {opportunity.website ? (
                <View style={styles.phoneRow}>
                  <Globe color={colors.textMuted} size={12} />
                  <Text style={styles.city}>{opportunity.website}</Text>
                </View>
              ) : null}
              {opportunity.pitchMessage ? (
                <Pressable
                  style={styles.copyButton}
                  onPress={() => copyPitch(opportunity.id, opportunity.pitchMessage as string)}
                >
                  <Copy color={colors.primary} size={14} />
                  <Text style={styles.copyLabel}>
                    {copiedId === opportunity.id ? "Mensagem copiada" : "Copiar mensagem"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <PrimaryButton
        title={opportunities.length === 0 ? "BUSCAR OPORTUNIDADES" : "ATUALIZAR OPORTUNIDADES"}
        onPress={() => refresh(city, skill)}
        loading={refreshing}
        disabled={city.trim().length === 0}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: spacing.xl,
    alignItems: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: spacing.lg
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    paddingHorizontal: spacing.md
  },
  locationInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: spacing.sm
  },
  skillInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  priceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  priceBannerText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "800"
  },
  list: {
    gap: spacing.sm
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.lg,
    gap: spacing.xxs,
    ...shadows.card
  },
  company: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  city: {
    color: colors.textMuted,
    fontSize: typography.caption
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs
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
