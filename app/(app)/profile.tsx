import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Award,
  Bell,
  Bot,
  Calculator,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  Radar,
  Shield,
  Sparkles,
  User
} from "lucide-react-native";

import { AppScreen, ScreenSection } from "../../components/AppScreen";
import { MascotImage } from "../../components/MascotImage";
import { useBootstrap } from "../../hooks/useBootstrap";
import { clearStoredSession } from "../../lib/storage";
import { colors, radii, spacing, typography } from "../../theme/tokens";

export default function ProfileScreen() {
  const { data, loading } = useBootstrap();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  async function signOut() {
    await clearStoredSession();
    router.replace("/auth");
  }

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const displayName = data?.profile?.displayName ?? data?.user.email.split("@")[0] ?? "usuário";

  return (
    <AppScreen>
      <ScreenSection>
        <Text style={styles.kicker}>Mais</Text>
        <Text style={styles.title}>Conta PIXO</Text>
      </ScreenSection>

      <View style={styles.header}>
        <MascotImage name="laptop" size="mascotSmall" />
        <View style={styles.headerText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{data?.user.email}</Text>
          <View style={styles.levelBadge}>
            <Sparkles color={colors.primary} size={14} />
            <Text style={styles.levelLabel}>
              Nível {data?.gamification.levelIndex !== undefined ? data.gamification.levelIndex + 1 : 1} · {data?.gamification.level ?? "Iniciante"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuItem icon={Sparkles} label="PIXO Evolução" onPress={() => router.push("/evolution")} />
        <MenuItem icon={Award} label="Conquistas" onPress={() => router.push("/achievements")} />
        <MenuItem icon={Radar} label="Radar de Oportunidades" onPress={() => router.push("/radar")} />
        <MenuItem icon={Calculator} label="Simulador de Ganhos" onPress={() => router.push("/simulator")} />
        <MenuItem icon={Bot} label="PIXO IA" onPress={() => router.push("/ai")} />
        <View style={styles.menuRow}>
          <View style={styles.menuLeft}>
            <Bell color={colors.primary} size={18} />
            <Text style={styles.menuLabel}>Notificações</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ true: colors.primaryDark, false: colors.border }}
            thumbColor={colors.primary}
          />
        </View>
        <View style={styles.menuRow}>
          <View style={styles.menuLeft}>
            <Moon color={colors.primary} size={18} />
            <Text style={styles.menuLabel}>Tema</Text>
          </View>
          <Text style={styles.menuValue}>Escuro</Text>
        </View>
        <MenuItem icon={HelpCircle} label="Ajuda e Suporte" onPress={() => {}} />
        <MenuItem icon={Shield} label="Privacidade" onPress={() => {}} />
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <LogOut color={colors.danger} size={18} />
        <Text style={styles.signOutLabel}>Sair da conta</Text>
      </Pressable>
    </AppScreen>
  );
}

type MenuItemProps = {
  icon: typeof User;
  label: string;
  onPress: () => void;
};

function MenuItem({ icon: Icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Icon color={colors.primary} size={18} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <ChevronRight color={colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs
  },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.small
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    marginTop: spacing.xxs
  },
  levelLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  menu: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden"
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  menuLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700"
  },
  menuValue: {
    color: colors.textMuted,
    fontSize: typography.small
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md
  },
  signOutLabel: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "800"
  }
});
