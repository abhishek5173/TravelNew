import { LoginForm } from "@/components/loginform";
import { AuthProvider, useAuthContext } from "@/utils/authprovider";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";


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
