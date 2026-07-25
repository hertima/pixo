import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SKILL_SUGGESTIONS } from "../../lib/skillSuggestions";
import { saveOnboardingDraft, type MissionChannel } from "../../lib/storage";
import { colors, radii, spacing, typography } from "../../theme/tokens";

const channels: readonly MissionChannel[] = ["whatsapp", "instagram", "email"];

type Step = {
  kicker: string;
  question: string;
  hint: string;
};

const STEPS: Step[] = [
  { kicker: "PIXO pergunta", question: "Como posso te chamar?", hint: "Só o primeiro nome já ajuda." },
  { kicker: "PIXO pergunta", question: "Qual sua meta de renda extra por mês?", hint: "Um valor realista pra começar." },
  { kicker: "PIXO pergunta", question: "Por onde você prefere atender?", hint: "Onde você fala com clientes hoje." },
  { kicker: "PIXO pergunta", question: "Em que cidade você está?", hint: "Uso isso pra achar oportunidades reais perto de você." },
  { kicker: "PIXO pergunta", question: "O que você sabe fazer ou quer oferecer?", hint: "Pode ser qualquer coisa: churrasco, unha, aula, limpeza..." }
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [goal, setGoal] = useState("");
  const [channel, setChannel] = useState<MissionChannel>("whatsapp");
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  function validateStep(): boolean {
    setError(null);

    if (step === 1) {
      const monthlyGoal = Number(goal.replace(",", "."));

      if (!Number.isFinite(monthlyGoal) || monthlyGoal <= 0) {
        setError("Informe uma meta mensal válida.");
        return false;
      }
    }

    return true;
  }

  async function goNext() {
    if (!validateStep()) {
      return;
    }

    if (!isLastStep) {
      setStep((value) => value + 1);
      return;
    }

    await saveOnboardingDraft({
      monthlyGoal: Number(goal.replace(",", ".")),
      channel,
      createdAt: new Date().toISOString(),
      displayName: displayName.trim() || undefined,
      city: city.trim() || undefined,
      skill: skill.trim() || undefined
    });

    router.replace("/paywall");
  }

  function goBack() {
    setError(null);

    if (step === 0) {
      return;
    }

    setStep((value) => value - 1);
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenSection>
          <View style={styles.progressRow}>
            {STEPS.map((_, index) => (
              <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive]} />
            ))}
          </View>
          <Text style={styles.kicker}>{current?.kicker}</Text>
          <Text style={styles.title}>{current?.question}</Text>
          <Text style={styles.body}>{current?.hint}</Text>
        </ScreenSection>

        <MascotImage name={step === 4 ? "target" : "cash"} size="mascotLarge" />

        <ScreenSection>
          {step === 0 ? (
            <TextInput
              onChangeText={setDisplayName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={displayName}
            />
          ) : null}

          {step === 1 ? (
            <TextInput
              keyboardType="numeric"
              onChangeText={setGoal}
              placeholder="500"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={goal}
            />
          ) : null}

          {step === 2 ? (
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
          ) : null}

          {step === 3 ? (
            <TextInput
              onChangeText={setCity}
              placeholder="ex: Curitiba, PR"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={city}
            />
          ) : null}

          {step === 4 ? (
            <>
              <TextInput
                onChangeText={setSkill}
                placeholder="ex: churrasqueiro, limpar piscina, social media"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={skill}
              />
              <View style={styles.suggestions}>
                {SKILL_SUGGESTIONS.map((suggestion) => (
                  <Pressable key={suggestion} onPress={() => setSkill(suggestion)} style={styles.suggestionChip}>
                    <Text style={styles.suggestionLabel}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenSection>

        <View style={styles.actions}>
          {step > 0 ? (
            <View style={styles.actionFlex}>
              <PrimaryButton title="VOLTAR" icon={ArrowLeft} variant="secondary" onPress={goBack} />
            </View>
          ) : null}
          <View style={styles.actionFlex}>
            <PrimaryButton title={isLastStep ? "CONTINUAR" : "PRÓXIMO"} icon={ArrowRight} onPress={goNext} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: spacing.lg
  },
  progressRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border
  },
  progressDotActive: {
    backgroundColor: colors.primary
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
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionFlex: {
    flex: 1
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  suggestionChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surface
  },
  suggestionLabel: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: "700"
  }
});
