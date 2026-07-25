import type { ColorValue } from "react-native";
import { StyleSheet, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { BarChart3, Bot, Home, Target, User } from "lucide-react-native";

import { useSession } from "../../hooks/useSession";
import { colors, iconSizes, radii, typography } from "../../theme/tokens";

type TabIconProps = {
  color: ColorValue;
};

function iconColor(color: ColorValue): string {
  return typeof color === "string" ? color : colors.textMuted;
}

export default function AppLayout() {
  const { loading, session } = useSession();

  if (!loading && !session) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        },
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: "700"
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ color }: TabIconProps) => <Home color={iconColor(color)} size={iconSizes.md} />
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          title: "Missões",
          tabBarIcon: ({ color }: TabIconProps) => <Target color={iconColor(color)} size={iconSizes.md} />
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "PIXO IA",
          tabBarIcon: () => (
            <View style={styles.fab}>
              <Bot color={colors.background} size={iconSizes.md} />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progresso",
          tabBarIcon: ({ color }: TabIconProps) => <BarChart3 color={iconColor(color)} size={iconSizes.md} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mais",
          tabBarIcon: ({ color }: TabIconProps) => <User color={iconColor(color)} size={iconSizes.md} />
        }}
      />
      <Tabs.Screen name="evolution" options={{ href: null }} />
      <Tabs.Screen name="achievements" options={{ href: null }} />
      <Tabs.Screen name="radar" options={{ href: null }} />
      <Tabs.Screen name="simulator" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: 16
  }
});
