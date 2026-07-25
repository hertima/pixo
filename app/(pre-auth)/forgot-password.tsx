import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { MascotImage } from "../../components/MascotImage";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiRequest, type ApiSession } from "../../lib/api";
import { saveStoredSession } from "../../lib/storage";
import { colors, radii, spacing, typography } from "../../theme/tokens";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode() {
    setLoading(true);
    setError(null);

    try {
      await apiRequest("/api/auth/forgot-password", { method: "POST", body: { email } });
      setInfo("Se esse email tiver uma conta PIXO, um código de 6 dígitos foi enviado.");
      setStep("code");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar o código.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset() {
    setLoading(true);
    setError(null);

    try {
      const session = await apiRequest<ApiSession>("/api/auth/reset-password", {
        method: "POST",
        body: { email, code, newPassword }
      });
      await saveStoredSession({
        token: session.token,
        user: session.user,
        createdAt: new Date().toISOString()
      });
      router.replace("/home");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenSection>
          <Text style={styles.kicker}>CONTA PIXO</Text>
          <Text style={styles.title}>Esqueci minha senha</Text>
          <Text style={styles.body}>
            {step === "email"
              ? "Informe seu email. Vamos mandar um código de 6 dígitos pra você redefinir a senha."
              : "Digite o código que chegou no seu email e a nova senha."}
          </Text>
        </ScreenSection>

        <MascotImage name="laptop" size="mascotMedium" />

        <ScreenSection>
          {step === "email" ? (
            <>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="email@dominio.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={email}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="ENVIAR CÓDIGO" icon={KeyRound} loading={loading} onPress={requestCode} />
            </>
          ) : (
            <>
              {info ? <Text style={styles.info}>{info}</Text> : null}
              <TextInput
                keyboardType="numeric"
                maxLength={6}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={code}
              />
              <TextInput
                onChangeText={setNewPassword}
                placeholder="nova senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={newPassword}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton title="REDEFINIR SENHA" loading={loading} onPress={confirmReset} />
              <Pressable onPress={() => setStep("email")}>
                <Text style={styles.forgotLink}>Não recebi o código, mudar email</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={() => router.back()}>
            <Text style={styles.forgotLink}>Voltar pro login</Text>
          </Pressable>
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
  info: {
    color: colors.primary,
    fontSize: typography.small,
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
  },
  forgotLink: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center"
  }
});
