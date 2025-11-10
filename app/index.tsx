import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import messaging from "@react-native-firebase/messaging";

type Ticket = {
  phone: string;
  title: string;
  description: string;
  created_at: string;
  status: string;
};

export default function HomeScreen() {
  const baseURL = process.env.EXPO_PUBLIC_baseURL;
  const OPEN_TICKETS = `${baseURL}tourist-chatbot/get-escalated-chats`;
  const SAVE_TOKEN = `${baseURL}tourist-chatbot/save-token`;


  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

 async function registerForFCMToken() {
  try {
    // Request user permissions for notifications
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

  useEffect(() => {
  const setup = async () => {
    const token = await registerForFCMToken();
    if (!token) return;

    console.log("FCM Token:", token);

    try {
      const response = await axios.post(SAVE_TOKEN, {
        "token": token,
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
      setLoading(false);
    } catch (error) {
      console.error("Some Error Occurred", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Travel Guide Dashboard</Text>

        <View style={styles.divider} />

        <Text style={styles.subHeader}>Live Tickets</Text>

        <ScrollView>
          {loading ? (
            <ActivityIndicator />
          ) : tickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No tickets available ✅ Great work!
              </Text>
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
                <View
                  style={[
                    styles.ticketCard,
                    item.status === "live"
                      ? styles.greenBorder
                      : styles.yellowBorder,
                  ]}
                >
                  <View style={styles.ticketTopRow}>
                    <Text style={styles.ticketTitle}>{item.title}</Text>

                    <Text
                      style={[
                        styles.statusBadge,
                        item.status === "live"
                          ? styles.greenBadge
                          : styles.yellowBadge,
                      ]}
                    >
                      🔻
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </Text>
                  </View>

                  <Text style={styles.ticketDate}>{item.created_at}</Text>

                  <Text numberOfLines={2} style={styles.ticketDesc}>{item.description}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    fontSize: 40,
    fontWeight: "bold",
  },
  divider: {
    width: "100%",
    borderBottomWidth: 1,
    marginTop: 8,
    borderColor: "#333",
  },
  subHeader: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 22,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
  },
  ticketCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 130,
    marginTop: 12,
  },
  greenBorder: {
    borderColor: "#22c55e",
  },
  yellowBorder: {
    borderColor: "#b45309",
  },
  ticketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    color: "white",
  },
  greenBadge: {
    backgroundColor: "#22c55e",
  },
  yellowBadge: {
    backgroundColor: "#b45309",
  },
  ticketDate: {
    marginTop: 4,
    color: "#222",
  },
  ticketDesc: {
    marginTop: 16,
  },
});
