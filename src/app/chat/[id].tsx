import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMatches, type ChatMessage } from '../../state/MatchContext';

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'welcome', text: 'Hey! Nice to match with you 😊', from: 'them' },
  { id: 'reply', text: 'Hi! I’m glad we matched too.', from: 'me' },
  { id: 'question', text: 'What do you like doing on the weekends?', from: 'them' },
];

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { matches, loadConversation, saveConversation } = useMatches();
  const match = matches.find((item) => item.id === id);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConversationLoaded, setIsConversationLoaded] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const nextMessageId = useRef(Date.now());
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    setIsConversationLoaded(false);

    loadConversation(id)
      .then(async (savedMessages) => {
        const restoredMessages = savedMessages ?? INITIAL_MESSAGES;
        if (savedMessages === null) {
          await saveConversation(id, restoredMessages);
        }
        if (!isMounted) return;
        messagesRef.current = restoredMessages;
        setMessages(restoredMessages);
        setIsConversationLoaded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        messagesRef.current = INITIAL_MESSAGES;
        setMessages(INITIAL_MESSAGES);
        setIsConversationLoaded(true);
        Alert.alert('Could not load conversation', 'Showing the starter messages instead.');
      });

    return () => {
      isMounted = false;
    };
  }, [id, loadConversation, saveConversation]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !isConversationLoaded) return;

    nextMessageId.current += 1;
    const nextMessages: ChatMessage[] = [
      ...messagesRef.current,
      { id: `sent-${nextMessageId.current}`, text, from: 'me' },
    ];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setDraft('');
    void saveConversation(id, nextMessages).catch(() => {
      Alert.alert('Could not save message', 'Your message is visible but may not be saved.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090D" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to matches"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View style={[styles.avatar, { backgroundColor: match?.color ?? '#563146' }]}>
              <Text style={styles.avatarInitial}>{match?.initials ?? 'N'}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.personName}>{match?.name ?? 'Nearby member'}</Text>
              <Text style={styles.matchStatus}>You matched on Nearby</Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.matchNotice}>
              <Text style={styles.matchNoticeHeart}>♥</Text>
              <Text style={styles.matchNoticeTitle}>It’s a match!</Text>
              <Text style={styles.matchNoticeText}>Start a conversation and say hello.</Text>
            </View>
            {isConversationLoaded ? (
              messages.map((message) => {
                const isMine = message.from === 'me';
                return (
                  <View
                    key={message.id}
                    style={[styles.messageRow, isMine && styles.myMessageRow]}
                  >
                    <Text style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                      {message.text}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.loadingText}>Loading conversation...</Text>
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={isConversationLoaded ? 'Write a message...' : 'Loading conversation...'}
              placeholderTextColor="#777783"
              style={styles.input}
              editable={isConversationLoaded}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              accessibilityLabel="Message"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim() || !isConversationLoaded}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                !draft.trim() && styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090D' },
  keyboard: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 18 },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#23232C',
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17171E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 32, marginTop: -4 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 19, fontWeight: '600' },
  headerInfo: { flex: 1, marginLeft: 11 },
  personName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  matchStatus: { color: '#A9A9B2', fontSize: 11, marginTop: 3 },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingTop: 22, paddingBottom: 20 },
  loadingText: { color: '#A9A9B2', fontSize: 13, textAlign: 'center', marginTop: 10 },
  matchNotice: {
    alignItems: 'center',
    backgroundColor: '#141119',
    borderWidth: 1,
    borderColor: '#352332',
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  matchNoticeHeart: { color: '#E83E8C', fontSize: 21 },
  matchNoticeTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 5 },
  matchNoticeText: { color: '#A9A9B2', fontSize: 12, marginTop: 5 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 11 },
  myMessageRow: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '82%',
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  theirMessage: { backgroundColor: '#1B1B24', borderBottomLeftRadius: 5 },
  myMessage: { backgroundColor: '#8F2858', borderBottomRightRadius: 5 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 11,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: '#23232C',
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#17171E',
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 15,
  },
  sendButton: {
    minHeight: 46,
    minWidth: 64,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: '#E83E8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
