import { useAuthContext } from "@/utils/authprovider";
import messaging from "@react-native-firebase/messaging";
import axios from "axios";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid, Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Ticket = {
  phone: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
};

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const baseURL = process.env.EXPO_PUBLIC_baseURL;
  const OPEN_TICKETS = `${baseURL}/tourist-chatbot/get-escalated-chats`;
  const SAVE_TOKEN = `${baseURL}/tourist-chatbot/save-token`;
  const { logout } = useAuthContext();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground message:", remoteMessage);
      Toast.show({
        type: "info",
        text1: remoteMessage.notification?.title,
        text2: remoteMessage.notification?.body,
      });
    });

    return unsubscribe;
  }, []);

  async function registerForFCMToken() {
    try {
      // Request user permissions for notifications

      if (Platform.OS === "android" && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Notification permission denied");
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
         if (!enabled) {
        console.log("Permission not granted");
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.log("FCM Token Error:", error);
      return null;
    }
  }

  const getDeviceId = async () => {
    if (Platform.OS === "android") {
      return await Application.getAndroidId(); // returns a promise
    }
    return null;
  };

   useEffect(() => {
     const setup = async () => {
      const token = await registerForFCMToken();
      if (!token) return;
      console.log("FCM Token:", token);
      const deviceId = await getDeviceId();
      console.log("Device ID:", deviceId);
       try {
        const response = await axios.post(SAVE_TOKEN, {
          token: token,
          user_id: deviceId,
        });
        console.log("Token saved:", response.data);
      } catch (error) {
        console.log("Token save error:", error);
      }
    };

    setup();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(OPEN_TICKETS);
      setTickets(response.data.response);
    } catch (error) {
      console.error("Some Error Occurred", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.header}>Dashboard</Text>
            <Text style={styles.subText}>Live escalations from tourists</Text>
          </View>
          <TouchableOpacity onPress={() => logout()}>
            <Text style={{ color: "red", fontWeight: "600", fontSize: 16 }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* TOP ROW */}
        <View style={styles.topRow}>
          <Text style={styles.sectionTitle}>Live Tickets</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchTickets}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* LIST */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {loading ? (
            <View style={{ marginTop: 40 }}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : tickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No active tickets 🎉</Text>
            </View>
          ) : (
            tickets.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  router.push({
                    pathname: "/tickets",
                    params: { data: JSON.stringify(item) },
                  })
                }
              >
                <View style={styles.ticketCard}>
                  {/* Top row */}
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketTitle}>{item.title}</Text>

                    <View
                      style={[
                        styles.badge,
                        item.status === "live"
                          ? styles.liveBadge
                          : styles.pendingBadge,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketDate}>{item.created_at}</Text>

                  <Text numberOfLines={2} style={styles.ticketDesc}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Toast />
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = width * 0.9;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // HEADER
  headerBox: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111",
  },
  subText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },

  // TOP ROW
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },

  refreshButton: {
    backgroundColor: "#e8f0ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d7fe",
  },
  refreshButtonText: {
    color: "#1d4ed8",
    fontWeight: "600",
    fontSize: 14,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e5e5e5",
    marginBottom: 12,
  },

  // EMPTY STATE
  emptyBox: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },

  // CARD
  ticketCard: {
    width: CARD_WIDTH,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ebebeb",

    // elegant shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ticketTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    flex: 1,
    paddingRight: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  liveBadge: {
    backgroundColor: "#dcfce7",
  },
  pendingBadge: {
    backgroundColor: "#fef9c3",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
  },

  ticketDate: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },

  ticketDesc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
});
