import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Bot, Send } from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { MascotImage } from "../../components/MascotImage";
import { apiRequest, type MentorMessage } from "../../lib/api";
import { colors, radii, shadows, spacing, typography } from "../../theme/tokens";

const QUICK_REPLIES = ["Não sei o que vender", "Tenho 2 horas por dia", "Sou tímido", "Tenho um notebook"];

export default function AiScreen() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSentPrompt = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    apiRequest<{ messages: MentorMessage[] }>("/api/mentor/messages")
      .then((response) => {
        if (mounted) {
          setMessages(response.messages);
          setLoading(false);

          if (prompt && autoSentPrompt.current !== prompt) {
            autoSentPrompt.current = prompt;
            void sendMessage(prompt);
          }
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar a conversa.");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  async function sendMessage(override?: string) {
    const content = (override ?? text).trim();

    if (!content || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setText("");

    try {
      const response = await apiRequest<{ messages: MentorMessage[] }>("/api/mentor/message", {
        method: "POST",
        body: { content }
      });
      setMessages(response.messages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível falar com a IA.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenSection>
          <Text style={styles.kicker}>PIXO IA</Text>
          <Text style={styles.title}>Seu copiloto financeiro</Text>
        </ScreenSection>

        <MascotImage name="laptop" size="mascotSmall" />

        <View style={styles.chat}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : messages.length === 0 ? (
            <>
              <EmptyState
                icon={Bot}
                title="Conversa vazia"
                body="Conte pro PIXO IA o que você quer alcançar e receba um plano prático pra chegar lá."
              />
              <View style={styles.quickReplies}>
                {QUICK_REPLIES.map((reply) => (
                  <Pressable key={reply} style={styles.quickReply} onPress={() => sendMessage(reply)} disabled={sending}>
                    <Text style={styles.quickReplyLabel}>{reply}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                style={[styles.message, message.role === "user" ? styles.userMessage : styles.assistantMessage]}
              >
                <Text style={styles.messageRole}>{message.role === "user" ? "Você" : "PIXO"}</Text>
                <Text style={styles.messageText}>{message.content}</Text>
              </View>
            ))
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            multiline
            onChangeText={setText}
            placeholder="Conte ao PIXO o que você quer alcançar..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={text}
          />
          <Pressable accessibilityRole="button" onPress={() => sendMessage()} style={styles.sendButton}>
            {sending ? <ActivityIndicator color={colors.text} /> : <Send color={colors.text} size={20} />}
          </Pressable>
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
  chat: {
    gap: spacing.sm
  },
  message: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.card
  },
  assistantMessage: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  userMessage: {
    alignSelf: "flex-end",
    maxWidth: "86%",
    backgroundColor: colors.primaryDark
  },
  messageRole: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  messageText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: spacing.lg
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm
  },
  input: {
    flex: 1,
    minHeight: spacing.xxl,
    maxHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  sendButton: {
    width: spacing.xxl,
    height: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary
  },
  error: {
    color: colors.danger,
    fontSize: typography.small
  },
  quickReplies: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  quickReply: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface
  },
  quickReplyLabel: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "700"
  }
});
