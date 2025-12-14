import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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

const { height } = Dimensions.get("window");

const TicketPage = () => {
  const baseURL = process.env.EXPO_PUBLIC_baseURL;
  const GET_MESSAGE = `${baseURL}/tourist-chatbot/get-user-message`;
  const SEND_MESSAGE = `${baseURL}/tourist-chatbot/send-message`;
  const RESOLVE = `${baseURL}/tourist-chatbot/delete-escalated_chat`;

  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  const { data } = useLocalSearchParams();
  const ticket = JSON.parse(data as string);

  const [messages, setMessages] = useState<Chat[]>([]);
  const [response, setResponse] = useState("");
  const [resploading, setresploading] = useState(false);
  const [resolveloading, setresolveloading] = useState(false);

  const fetchmessage = async () => {
    try {
      const payload = { phone: ticket.phone, language: "english" };
      const res = await axios.post(GET_MESSAGE, payload);
      setMessages(res.data.response);
    } catch (error) {
      console.log("Something went wrong", error);
    }
  };

  const sendmessage = async () => {
    if (!response.trim()) return;

    try {
      setresploading(true);
      await axios.post(SEND_MESSAGE, {
        user_phone: ticket.phone,
        message: response,
      });

      setResponse("");
      fetchmessage();

      setTimeout(() => scrollRef.current?.scrollToEnd(), 150);
    } catch (error) {
      console.log("Something went wrong", error);
    } finally {
      setresploading(false);
    }
  };

  const resolve = async () => {
    try {
      setresolveloading(true);
      await axios.delete(RESOLVE, { data: { phone: ticket.phone } });
      router.replace("/");
    } catch (error) {
      console.log(error);
    } finally {
      setresolveloading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const poll = async () => {
      await fetchmessage();
      if (active) setTimeout(poll, 3000);
    };

    poll();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerBox}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketMeta}>
              Created: {ticket.created_at.replace(" ", " at ")}
            </Text>

            <Text style={styles.ticketDescription}>{ticket.description}</Text>

            <View style={styles.divider} />
            <Text style={styles.chatHeader}>Chat History</Text>
          </View>

          {/* Chat Box */}
          <View style={styles.chatContainer}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.chatRow,
                    msg.type === "user" ? styles.left : styles.right,
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
                    <Text style={styles.chatTime}>{msg.timestamp}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Input Box */}
          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <TextInput
                multiline
                placeholder="Type a message..."
                value={response}
                onChangeText={setResponse}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              onPress={sendmessage}
              disabled={!response || resploading}
              style={[
                styles.sendButton,
                response ? styles.sendActive : styles.sendDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>
                {resploading ? "..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resolve Button */}
          <TouchableOpacity
            onPress={resolve}
            style={styles.resolveBtn}
            disabled={resolveloading}
          >
            <Text style={styles.resolveBtnText}>
              {resolveloading ? "Resolving..." : "Resolve Ticket"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TicketPage;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // HEADER
  headerBox: {
    marginBottom: 10,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  ticketMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  ticketDescription: {
    marginTop: 10,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },

  chatHeader: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 16,
  },

  // CHAT
  chatContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    minHeight: height * 0.45,
    maxHeight: height * 0.55,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  chatRow: {
    marginVertical: 6,
    flexDirection: "row",
  },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  chatBubble: {
    maxWidth: "78%",
    padding: 10,
    borderRadius: 14,
  },

  userBubble: {
    backgroundColor: "#e0f2fe",
  },
  aiBubble: {
    backgroundColor: "#d1d5db",
  },
  adminBubble: {
    backgroundColor: "#fde68a",
  },

  chatText: {
    fontSize: 14,
    color: "#111",
  },
  chatTime: {
    fontSize: 10,
    color: "#555",
    marginTop: 4,
    textAlign: "right",
  },

  // INPUT
  inputRow: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "flex-end",
  },
  inputBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    fontSize: 14,
    color: "#111",
  },

  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendActive: {
    backgroundColor: "#2563eb",
  },
  sendDisabled: {
    backgroundColor: "#93c5fd",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },

  // RESOLVE BUTTON
  resolveBtn: {
    marginTop: 16,
    backgroundColor: "#fef3c7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  resolveBtnText: {
    color: "#b45309",
    fontWeight: "600",
    fontSize: 15,
  },
});
