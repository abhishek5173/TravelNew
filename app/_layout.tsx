import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";

export default function RootLayout() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // ✅ required in SDK 51+
      shouldShowList: true, // ✅ required in SDK 51+
    }),
  });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tickets" />
    </Stack>
  );
}
