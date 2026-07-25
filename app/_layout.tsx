import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { Stack } from "expo-router";

import { colors } from "../theme/tokens";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      html, body, #root {
        height: 100svh !important;
        overscroll-behavior: none;
      }
      body {
        position: fixed;
        inset: 0;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
