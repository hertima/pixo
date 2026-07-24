import { StatusBar } from "react-native";
import { Stack } from "expo-router";

import { colors } from "../theme/tokens";

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      />
    </>
  );
}
