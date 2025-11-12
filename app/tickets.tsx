import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


type Chat = {
  type: string;
  text: string;
  timestamp: string;
};

const ticketspage = () => {
  const baseURL = process.env.EXPO_PUBLIC_baseURL;
  const GET_MESSAGE = `${baseURL}tourist-chatbot/get-user-message`;
  const SEND_MESSAGE = `${baseURL}tourist-chatbot/send-message`;
  const RESOLVE = `${baseURL}tourist-chatbot/delete-escalated_chat`;

  const scrollRef = React.useRef<ScrollView>(null);
  const router = useRouter();

  const { data } = useLocalSearchParams();
  const ticket = JSON.parse(data as string);

  const [messages, setMessages] = useState<Chat[]>([]);
  const [response, setResponse] = useState("");
  const [resploading, setresploading] = useState(false);
  const [resolveloading, setresolveloading] = useState(false);

  const sendmessage = async () => {
    const payload = {
      user_phone: `${ticket.phone}`,
      message: response,
    };

    try {
      setresploading(true);
      await axios.post(SEND_MESSAGE, payload);
      setResponse("");
      fetchmessage();
      setresploading(false);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error("Something Went Wrong", error);
      setresploading(false);
    }
  };

  const fetchmessage = async () => {
    const payload = {
      phone: `${ticket.phone}`,
      language: "english",
    };

    try {
      const response = await axios.post(GET_MESSAGE, payload);
      setMessages(response.data.response);
    } catch (error) {
      console.error("Something Went Wrong", error);
    }
  };

  const resolve = async () => {
    const payload = { phone: `${ticket.phone}` };

    try {
      setresolveloading(true);
      await axios.delete(RESOLVE, { data: payload });
      setresolveloading(false);
      router.replace("/");
    } catch (error) {
      console.error("Something Went Wrong", error);
      setresolveloading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      await fetchmessage();
      if (isMounted) setTimeout(poll, 3000);
    };

    poll();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // adjust if you have header
  >
     <ScrollView style={styles.page}>
        {/* Ticket Info */}
        {/* <View style={styles.ticketInfoBox}>
          <View style={styles.ticketInfoTop}>
            <Text style={styles.ticketInfoTitle}>Ticket Info</Text>

            <Text
              style={[
                styles.statusBadge,
                ticket.status === "live"
                  ? styles.greenBadge
                  : styles.yellowBadge,
              ]}
            >
              🔻{ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </Text>
          </View>

          <Text style={styles.ticketCreated}>
            Created : {ticket.created_at.replace(" ", " At ")}
          </Text>
        </View> */}

        {/* Ticket Details */}
        <View style={styles.ticketDetailsBox}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>

          <Text style={styles.ticketCreated2}>
            Created : {ticket.created_at.replace(" ", " At ")}
          </Text>

          <View style={styles.ticketDescriptionBox}>
            <Text>{ticket.description}</Text>
          </View>

          <Text style={styles.chatHistoryLabel}>Chat History</Text>

          {/* Chat History */}
          <View style={styles.chatHistoryBox}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
              style={styles.chatScroll}
            >
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.chatRow,
                    msg.type === "user"
                      ? styles.chatLeft
                      : styles.chatRight,
                  ]}
                >
                  <View
                    style={[
                      styles.chatBubble,
                      msg.type === "user"
                        ? styles.userBubble
                        : msg.type === "ai_guide"
                        ? styles.aiBubble
                        : styles.adminBubble,
                    ]}
                  >
                    <Text style={styles.chatText}>{msg.text}</Text>
                    <Text style={styles.chatTimestamp}>{msg.timestamp}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input Box */}
            <View style={styles.inputContainer}>
              <TextInput
                multiline
                value={response}
                textAlignVertical="top"
                placeholder="Type your response here..."
                onChangeText={setResponse}
                style={styles.inputBox}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                disabled={resolveloading}
                onPress={resolve}
                style={styles.resolveButton}
              >
                <Text>
                  {resolveloading ? "Resolving..." : "Resolve"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!response || resploading}
                onPress={sendmessage}
                style={[
                  styles.sendButton,
                  response
                    ? styles.sendButtonActive
                    : styles.sendButtonDisabled,
                ]}
              >
                <Text style={styles.sendButtonText}>
                  {resploading ? "Sending.." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
  </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ticketspage;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 8,
  },

  ticketInfoBox: {
    borderWidth: 1,
    borderColor: "#555",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    height: 60,
  },
  ticketInfoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    color: "white",
  },
  greenBadge: { backgroundColor: "#22c55e" },
  yellowBadge: { backgroundColor: "#b45309" },
  ticketCreated: { fontWeight: "600" },

  ticketDetailsBox: {
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 12,
  },

  ticketTitle: { fontSize: 22 },
  ticketCreated2: { fontWeight: "600", marginTop: 8 },

  ticketDescriptionBox: {
    backgroundColor: "#e5e5e5",
    padding: 12,
    marginTop: 8,
    borderRadius: 10,
  },

  chatHistoryLabel: {
    marginTop: 8,
    padding: 4,
    fontWeight: "600",
    fontSize: 16,
  },

  chatHistoryBox: {
    height: 480,
    backgroundColor: "#e5e5e5",
    padding: 12,
    marginTop: 8,
    borderRadius: 10,
  },

  chatScroll: {
    height: 400,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  chatRow: {
    marginVertical: 6,
    flexDirection: "row",
  },
  chatLeft: { justifyContent: "flex-start" },
  chatRight: { justifyContent: "flex-end" },

  chatBubble: {
    maxWidth: "90%",
    padding: 10,
    borderRadius: 12,
  },

  userBubble: { backgroundColor: "#3b82f6" },
  aiBubble: { backgroundColor: "#374151" },
  adminBubble: { backgroundColor: "#15803d" },

  chatText: { color: "white" },
  chatTimestamp: {
    color: "#d1d5db",
    fontSize: 12,
    marginTop: 4,
  },

  inputContainer: {
    backgroundColor: "#d1d5db",
    borderRadius: 12,
    height: 120,
    padding: 6,
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
  },

  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 10,
  },

  resolveButton: {
    width: "48%",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 12,
  },

  sendButton: {
    width: "48%",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
  },
  sendButtonActive: { backgroundColor: "#ca8a04" },
  sendButtonDisabled: { backgroundColor: "#9ca3af" },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
