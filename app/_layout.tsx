import messaging from "@react-native-firebase/messaging";
import { Stack } from "expo-router";
import { Alert } from "react-native";

// messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//   console.log("BG message:", remoteMessage);
// });

export default function RootLayout() {
  // Foreground notifications
  messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? "New Notification";
    const body = remoteMessage.notification?.body ?? "";

    Alert.alert(title, body);
  });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tickets" />
    </Stack>
  );
}
