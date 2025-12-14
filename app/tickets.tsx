import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type Chat = {
  type: string;
  text: string;
  timestamp: string;
  latitude?: any;
  longitude?: any;
};

const { height } = Dimensions.get("window");

export default function TicketPage() {
  const baseURL = process.env.EXPO_PUBLIC_baseURL;
  const GET_MESSAGE = `${baseURL}/tourist-chatbot/get-user-message`;
  const SEND_MESSAGE = `${baseURL}/tourist-chatbot/send-message`;
  const RESOLVE = `${baseURL}/tourist-chatbot/delete-escalated_chat`;
  const SAMPLE_RESPONSE = `${baseURL}/tourist-chatbot/sample-response`;
  const REPHRASE_ENDPOINT = `${baseURL}/tourist-chatbot/rephrase-message`;
  const ASK_LOCATION = `${baseURL}/tourist-chatbot/user-location`;
  const SEND_PHOTO = `${baseURL}/tourist-chatbot/send-image-to-user`;

  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const ticket = JSON.parse(data as string);

  const [messages, setMessages] = useState<Chat[]>([]);
  const [response, setResponse] = useState("");
  const [resploading, setresploading] = useState(false);
  const [resolveloading, setresolveloading] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationReason, setLocationReason] = useState("");
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const [aiResponse, setAiResponse] = useState<string[]>([]);
  const [locationInfo, setLocationInfo] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // --- Bottom Sheet Animation ---
  const sheetAnim = useRef(new Animated.Value(height)).current;
  const [sheetType, setSheetType] = useState<"ai" | "location" | null>(null);

  const openSheet = (type: "ai" | "location") => {
    setSheetType(type);
    Animated.timing(sheetAnim, {
      toValue: height * 0.25,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSheetType(null));
  };

  // ==========================
  // FETCHING
  // ==========================

  const fetchAIResponse = async (msg: string) => {
    try {
      const res = await axios.post(SAMPLE_RESPONSE, { message: msg });
      setAiResponse(res.data.response || []);
    } catch (error) {
      console.log("AI Response Error", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.post(GET_MESSAGE, {
        phone: ticket.phone,
        language: "english",
      });

      const msgs = res.data.response;
      setMessages(msgs);

      const last = msgs[msgs.length - 1];
      if (last?.type === "user") fetchAIResponse(last.text);

      const loc = msgs.find((m: any) => m.type === "location");
      if (loc) {
        setLocationInfo({
          lat: loc.latitude,
          lng: loc.longitude,
        });
      }
    } catch (error) {
      console.log("Chat Fetch Error", error);
    }
  };

  const rephraseMessage = async (message: string) => {
    try {
      const res = await axios.post(REPHRASE_ENDPOINT, {
        message: message,
      });
      return res.data.response;
    } catch (error) {
      console.error("Error rephrasing message:", error);
    }
  };

  const sendMessage = async () => {
    if (!response.trim()) return;

    try {
      setresploading(true);
      const rephrasedResponse = await rephraseMessage(response);
      await axios.post(SEND_MESSAGE, {
        user_phone: ticket.phone,
        message: rephrasedResponse,
      });

      setResponse("");
      fetchMessages();

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } finally {
      setresploading(false);
    }
  };

  const resolveTicket = async () => {
    try {
      setresolveloading(true);
      await axios.delete(RESOLVE, { data: { phone: ticket.phone } });
      router.replace("/");
    } finally {
      setresolveloading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const poll = async () => {
      await fetchMessages();
      if (active) setTimeout(poll, 3000);
    };
    poll();
    return () => {
      active = false;
    };
  }, []);

  const askLocation = async () => {
    if (!locationReason.trim()) return;

    try {
      setIsRequestingLocation(true);

      await axios.post(ASK_LOCATION, {
        user_phone: ticket.phone,
        message: locationReason,
      });

      setShowLocationDialog(false);
      setLocationReason("");
      fetchMessages();
    } catch (err) {
      console.log("Ask location error", err);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // ==========================
  // UI
  // ==========================

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* KeyboardAvoidingView wraps WHOLE screen so bottom bar moves up */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* MAIN CONTENT */}
          <View style={[styles.container, { flex: 1 }]}>
            {/* HEADER */}
            <View style={styles.headerBox}>
              <Text style={styles.ticketTitle}>{ticket.title}</Text>
              <Text style={styles.ticketMeta}>
                Created: {ticket.created_at.replace(" ", " at ")}
              </Text>
              <Text style={styles.ticketDescription}>{ticket.description}</Text>
              <View style={styles.divider} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.chatHeader}>Chat History</Text>
                <TouchableOpacity
                  onPress={() => setShowActionMenu(!showActionMenu)}
                >
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "600",
                      color: "#1d4ed8",
                    }}
                  >
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showActionMenu && (
              <View style={styles.actionMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowActionMenu(false);
                    setShowLocationDialog(true);
                  }}
                >
                  <Text style={styles.menuItemText}>📍 Ask for Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* CHAT BOX */}
            <View style={styles.chatContainer}>
              <View style={styles.actionBar}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openSheet("ai")}
                >
                  <Text style={styles.actionButtonText}>AI Suggestions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openSheet("location")}
                >
                  <Text style={styles.actionButtonText}>Location Info</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
              >
                {messages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chatRow,
                      msg.type === "user" ? styles.left : styles.right,
                    ]}
                  >
                    {msg.type === "location" ? (
                      <View style={styles.locationBubble}>
                        <Text style={styles.locationTitle}>
                          📍 Location Shared
                        </Text>
                        <Text style={styles.locationSubtitle}>
                          The user has shared their live location.
                        </Text>

                        <TouchableOpacity
                          style={styles.viewLocationBtn}
                          onPress={() => {
                            setLocationInfo({
                              lat: msg.latitude,
                              lng: msg.longitude,
                            });
                            openSheet("location");
                          }}
                        >
                          <Text style={styles.viewLocationText}>
                            View Location
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.chatTime}>{msg.timestamp}</Text>
                      </View>
                    ) : (
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
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ACTION BAR */}
          </View>

          {/* FIXED BOTTOM INPUT + BUTTONS */}
          <View style={styles.bottomContainer}>
            <View style={styles.inputBox}>
              <TextInput
                multiline
                placeholder="Type your response..."
                value={response}
                onChangeText={setResponse}
                style={styles.input}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={sendMessage}
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

              <TouchableOpacity
                onPress={resolveTicket}
                disabled={resolveloading}
                style={styles.resolveBtn}
              >
                <Text style={styles.resolveBtnText}>
                  {resolveloading ? "Resolving..." : "Resolve"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showLocationDialog && (
  <View style={styles.dialogOverlay}>
    <View style={styles.dialogBox}>
      {/* Title */}
      <View style={styles.dialogHeader}>
        <Text style={styles.dialogTitle}>Request Location</Text>

        <TouchableOpacity
          onPress={() => {
            setShowLocationDialog(false);
            setLocationReason("");
          }}
        >
          <Text style={styles.dialogClose}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text style={styles.dialogLabel}>Reason for requesting location</Text>

        <TextInput
          multiline
          placeholder="Enter reason..."
          value={locationReason}
          onChangeText={setLocationReason}
          style={styles.dialogTextarea}
        />

        {/* Buttons */}
        <View style={styles.dialogButtons}>
          <TouchableOpacity
            style={[styles.dialogButton, styles.dialogCancel]}
            onPress={() => {
              setShowLocationDialog(false);
              setLocationReason("");
            }}
            disabled={isRequestingLocation}
          >
            <Text style={styles.dialogCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dialogButton, styles.dialogSubmit]}
            onPress={askLocation}
            disabled={isRequestingLocation}
          >
            <Text style={styles.dialogSubmitText}>
              {isRequestingLocation ? "Requesting..." : "Request"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
)}


          {/* BOTTOM SHEET */}
          {sheetType && (
            <Animated.View style={[styles.bottomSheet, { top: sheetAnim }]}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {sheetType === "ai"
                    ? "AI Suggested Responses"
                    : "Location Info"}
                </Text>
                <TouchableOpacity onPress={closeSheet}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {sheetType === "ai" ? (
                  aiResponse.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setResponse(item);
                        closeSheet();
                      }}
                      style={styles.aiCard}
                    >
                      <Text style={styles.aiCardText}>{item}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.locationCard}>
                    {locationInfo ? (
                      <WebView
                        style={{ height: 450, borderRadius: 12 }}
                        javaScriptEnabled
                        domStorageEnabled
                        source={{
                          uri: `https://www.google.com/maps/search/?api=1&query=${locationInfo.lat},${locationInfo.lng}`,
                        }}
                      />
                    ) : (
                      <Text style={styles.locationText}>
                        No location shared yet.
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flexShrink: 1, paddingHorizontal: 16, paddingTop: 10 },

  headerBox: { marginBottom: 10 },
  ticketTitle: { fontSize: 12, fontWeight: "700", color: "#111" },
  ticketMeta: { fontSize: 10, color: "#666", marginTop: 4 },
  ticketDescription: {
    marginTop: 2,
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 12,
    fontSize: 10,
    lineHeight: 20,
  },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginTop: 12 },
  chatHeader: { marginTop: 4, fontSize: 14, fontWeight: "600" },

  chatContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 2,
    borderRadius: 14,
    padding: 12,
    overflow: "hidden",
  },

  chatRow: { marginVertical: 4, flexDirection: "row" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },

  chatBubble: { maxWidth: "78%", padding: 10, borderRadius: 14 },
  userBubble: { backgroundColor: "#e0f2fe" },
  aiBubble: { backgroundColor: "#d1d5db" },
  adminBubble: { backgroundColor: "#fde68a" },

  chatText: { fontSize: 12, color: "#111" },
  chatTime: { fontSize: 10, marginTop: 4, textAlign: "right" },

  // ACTION BAR
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    gap: 10,
  },

  actionButton: {
    flex: 1,
    backgroundColor: "#eef2ff",
    paddingVertical: 14,
    marginBottom: 4,
    borderRadius: 12,
    alignItems: "center",
  },

  actionButtonText: {
    fontSize: 12,
    color: "#3730a3",
    fontWeight: "600",
  },

  // INPUT + BUTTONS CONTAINER (fixed at bottom)
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },

  inputBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
    maxHeight: 140,
    marginBottom: 10,
  },

  input: {
    fontSize: 12,
    color: "#111",
    minHeight: 50,
    maxHeight: 130,
    textAlignVertical: "top",
    paddingTop: 4,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    gap: 10,
  },

  sendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  sendActive: {
    backgroundColor: "#2563eb",
  },

  sendDisabled: {
    backgroundColor: "#93c5fd",
  },

  sendButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  resolveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
    alignItems: "center",
  },

  resolveBtnText: {
    color: "#b45309",
    fontWeight: "700",
    fontSize: 13,
  },

  // BOTTOM SHEET
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: height * 0.85,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 12,
  },

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  closeText: { fontSize: 14, color: "#2563eb", fontWeight: "600" },

  aiCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  aiCardText: { fontSize: 14, color: "#333", lineHeight: 20 },

  locationCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    padding: 6,
    marginBottom: 20,
  },

  // LOCATION BUBBLE IN CHAT
  locationBubble: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3730a3",
  },

  locationSubtitle: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
    marginBottom: 10,
  },

  viewLocationBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 6,
  },

  viewLocationText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    padding: 6,
    marginBottom: 20,
  },

  locationText: { fontSize: 15, marginBottom: 6 },
  actionMenu: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  menuItem: {
    paddingVertical: 10,
  },

  menuItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e3a8a",
  },

  dialogOverlay: {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  zIndex: 999,
},

dialogBox: {
  width: "100%",
  maxWidth: 380,
  backgroundColor: "#fff",
  borderRadius: 12,
  overflow: "hidden",
},

dialogHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 16,
  borderBottomWidth: 1,
  borderColor: "#e5e7eb",
},

dialogTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111",
},

dialogClose: {
  fontSize: 20,
  color: "#777",
},

dialogLabel: {
  fontSize: 13,
  fontWeight: "600",
  marginBottom: 6,
  color: "#333",
},

dialogTextarea: {
  backgroundColor: "#f1f5f9",
  borderWidth: 1,
  borderColor: "#e5e7eb",
  borderRadius: 10,
  padding: 12,
  minHeight: 80,
  textAlignVertical: "top",
  marginBottom: 14,
},

dialogButtons: {
  flexDirection: "row",
  gap: 10,
},

dialogButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
},

dialogCancel: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#e5e7eb",
},

dialogCancelText: {
  color: "#333",
  fontWeight: "600",
},

dialogSubmit: {
  backgroundColor: "#1d4ed8",
},

dialogSubmitText: {
  color: "#fff",
  fontWeight: "600",
},

});
