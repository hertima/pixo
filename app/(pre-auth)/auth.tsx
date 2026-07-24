import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { LogIn } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest, type ApiSession } from "../../lib/api";
import { migrateOnboardingDraft } from "../../lib/profileMigration";
import { loadOnboardingDraft, saveStoredSession } from "../../lib/storage";
import { colors, radii, spacing, typography } from "../../theme/tokens";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInOrSignUp() {
    setLoading(true);
    setError(null);

    try {
      const draft = await loadOnboardingDraft();
      let session: ApiSession;

      try {
        session = await apiRequest<ApiSession>("/api/auth/login", {
          method: "POST",
          body: { email, password }
        });
      } catch {
        session = await apiRequest<ApiSession>("/api/auth/signup", {
          method: "POST",
          body: { email, password, draft }
        });
      }

      await saveStoredSession({
        token: session.token,
        user: session.user,
        createdAt: new Date().toISOString()
      });

      const migration = await migrateOnboardingDraft();

      if (migration.status === "failed") {
        setError(migration.message);
        setLoading(false);
        return;
      }

      router.replace("/home");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
      setLoading(false);
      return;
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenSection>
          <Text style={styles.kicker}>CONTA PIXO</Text>
          <Text style={styles.title}>Entrar ou criar conta</Text>
          <Text style={styles.body}>Depois do login, seu onboarding migra para o banco local da API.</Text>
        </ScreenSection>

        <MascotImage name="laptop" size="mascotMedium" />

        <ScreenSection>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="email@dominio.com"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="senha"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="ENTRAR" icon={LogIn} loading={loading} onPress={signInOrSignUp} />
        </ScreenSection>
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
    fontSize: typography.title,
    fontWeight: "900"
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: spacing.lg
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
  error: {
    color: colors.danger,
    fontSize: typography.small
  }
});
