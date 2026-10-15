
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import { GlassBackground as SafeAreaView, GlassCard } from '../../components/Glass';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useMatches, type ChatMessage } from '../../state/MatchContext';
import { useTheme } from '../../theme/ThemeContext';
import { BottomNav } from '../../components/BottomNav';
import { demoProfilePhoto } from '../../components/demoProfilePhoto';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Prevent screen capture while this chat screen is active.
  usePreventScreenCapture('nearby-chat-protection');

  const { matches, isMatchesLoaded, loadConversation, saveConversation } = useMatches();
  const match = matches.find((item) => item.id === id);

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const isConversationLoaded = loadedConversationId === id;

  const messagesRef = useRef<ChatMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isMatchesLoaded || !match || !id) {
      return () => {
        isMounted = false;
      };
    }

    loadConversation(id)
      .then((savedMessages) => {
        const restoredMessages = savedMessages ?? [];
        if (!isMounted) return;

        messagesRef.current = restoredMessages;
        setMessages(restoredMessages);
        setLoadedConversationId(id);
      })
      .catch(() => {
        if (!isMounted) return;

        messagesRef.current = [];
        setMessages([]);
        setLoadedConversationId(id);

        Alert.alert(
          'Could not load conversation',
          'You can still send a message, but the saved history could not be loaded.',
        );
      });

    return () => {
      isMounted = false;
    };
  }, [id, isMatchesLoaded, loadConversation, match, saveConversation]);

  useEffect(() => {
    if (isMatchesLoaded && !match) {
      Alert.alert('Match required', 'Chats are available only with people you have matched with.');
      router.replace('/matches');
    }
  }, [isMatchesLoaded, match, router]);

  const sendMessage = () => {
    const text = draft.trim();

    if (!text || !isConversationLoaded || !match) return;

    const nextMessages: ChatMessage[] = [
      ...messagesRef.current,
      {
        id: `sent-${Date.now()}`,
        text,
        from: 'me',
        sentAt: new Date().toISOString(),
      },
    ];

    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setDraft('');

    void saveConversation(id, nextMessages).catch(() => {
      Alert.alert(
        'Could not save message',
        'Your message is visible but may not be saved.',
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.background === '#080B16' ? 'light-content' : 'dark-content'} />

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
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <View
              style={[
                styles.avatar,
                { backgroundColor: match?.color ?? colors.accent },
              ]}
            >
              {match?.photoUri ? <Image source={{ uri: match.photoUri }} style={StyleSheet.absoluteFill} /> : match && demoProfilePhoto(match.id) ? <Image source={demoProfilePhoto(match.id)!} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={styles.avatarInitial}>{match?.initials ?? 'N'}</Text>}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.personName}>
                {match?.name ?? 'SecondMeet member'}
              </Text>
              <Text style={styles.matchStatus}>
                You matched on SecondMeet
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          >
            <GlassCard style={styles.matchNotice}>
              <Text style={styles.matchNoticeHeart}>♥</Text>
              <Text style={styles.matchNoticeTitle}>It’s a match!</Text>
              <Text style={styles.matchNoticeText}>
                Start a conversation and say hello.
              </Text>
            </GlassCard>

            {isConversationLoaded ? (
              messages.map((message) => {
                const isMine = message.from === 'me';

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageRow,
                      isMine && styles.myMessageRow,
                    ]}
                  >
                    <GlassCard style={[styles.bubblePanel, isMine && styles.myBubblePanel]}>
                      <Text style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>{message.text}</Text>
                      {message.sentAt && Number.isFinite(Date.parse(message.sentAt)) ? <Text style={styles.timestamp}>{new Date(message.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text> : null}
                    </GlassCard>
                  </View>
                );
              })
            ) : (
              <Text style={styles.loadingText}>
                Loading conversation...
              </Text>
            )}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                isConversationLoaded
                  ? 'Write a message...'
                    : 'Loading conversation...'
              }
              placeholderTextColor={colors.subtle}
              style={styles.input}
              editable={isConversationLoaded && Boolean(match)}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              accessibilityLabel="Message"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim() || !isConversationLoaded || !match}
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || !isConversationLoaded || !match) &&
                  styles.sendButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.sendText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <BottomNav active="matches" />
    </SafeAreaView>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) { return StyleSheet.create({
  bubblePanel: { maxWidth: '84%', borderRadius: 20, padding: 3 },
  myBubblePanel: { borderColor: c.accent },
  timestamp: { color: c.muted, fontSize: 10, paddingHorizontal: 12, paddingBottom: 7, textAlign: 'right' },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backText: {
    color: c.onAccent,
    fontSize: 30,
    lineHeight: 32,
    marginTop: -4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: c.text,
    fontSize: 19,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 11,
  },
  personName: {
    color: c.text,
    fontSize: 16,
    fontWeight: '700',
  },
  matchStatus: {
    color: c.muted,
    fontSize: 11,
    marginTop: 3,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 22,
    paddingBottom: 20,
  },
  loadingText: {
    color: c.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  matchNotice: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  matchNoticeHeart: {
    color: c.accent,
    fontSize: 21,
  },
  matchNoticeTitle: {
    color: c.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },
  matchNoticeText: {
    color: c.muted,
    fontSize: 12,
    marginTop: 5,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 11,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '100%',
    color: c.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  theirMessage: {
    backgroundColor: c.surfaceStrong,
    borderBottomLeftRadius: 5,
  },
  myMessage: {
    color: c.onAccent,
    backgroundColor: c.accent,
    borderBottomRightRadius: 5,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 11,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: c.input,
    color: c.text,
    fontSize: 14,
    paddingHorizontal: 15,
  },
  sendButton: {
    minHeight: 46,
    minWidth: 64,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: c.onAccent,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
}); }
