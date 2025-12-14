import { LoginForm } from "@/components/loginform";
import { AuthProvider, useAuthContext } from "@/utils/authprovider";
import messaging from "@react-native-firebase/messaging";
import { Stack } from "expo-router";
import { ActivityIndicator, Alert, Text, View } from "react-native";

export default function RootLayout() {
  function RootNavigator() {
    const { isAuthenticated, loading } = useAuthContext();

    // Show loading screen
    if (loading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10, color: "#444" }}>Loading...</Text>
        </View>
      );
    }

    // Show login screen
    if (!isAuthenticated) {
      return <LoginForm />;
    }

    messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? "New Notification";
    const body = remoteMessage.notification?.body ?? "";

    Alert.alert(title, body);
  });

    // Authenticated → Show app stack
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="tickets" />
      </Stack>
    );
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
