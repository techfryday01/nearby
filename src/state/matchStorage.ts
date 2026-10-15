import AsyncStorage from '@react-native-async-storage/async-storage';

const MATCHES_STORAGE_KEY = 'nearby.matches.v1';
const conversationStorageKey = (matchId: string) => `nearby.chat.${matchId}.v1`;

export type MatchProfile = {
  id: string;
  name: string;
  age: number;
  initials: string;
  color: string;
  photoUri?: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  from: 'them' | 'me';
  sentAt?: string;
};

function isMatchProfile(value: unknown): value is MatchProfile {
  if (typeof value !== 'object' || value === null) return false;
  const match = value as Record<string, unknown>;
  return (
    typeof match.id === 'string' &&
    typeof match.name === 'string' &&
    typeof match.age === 'number' &&
    typeof match.initials === 'string' &&
    typeof match.color === 'string'
    && (match.photoUri === undefined || typeof match.photoUri === 'string')
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === 'string' &&
    typeof message.text === 'string' &&
    (message.from === 'them' || message.from === 'me')
    && (message.sentAt === undefined || typeof message.sentAt === 'string')
  );
}

export async function loadMatches(): Promise<MatchProfile[]> {
  const storedMatches = await AsyncStorage.getItem(MATCHES_STORAGE_KEY);
  if (!storedMatches) return [];

  try {
    const parsed: unknown = JSON.parse(storedMatches);
    if (!Array.isArray(parsed)) return [];

    const uniqueMatches = new Map<string, MatchProfile>();
    parsed.forEach((item) => {
      if (isMatchProfile(item) && !uniqueMatches.has(item.id)) {
        uniqueMatches.set(item.id, item);
      }
    });
    return Array.from(uniqueMatches.values());
  } catch {
    return [];
  }
}

export async function storeMatches(matches: MatchProfile[]): Promise<void> {
  await AsyncStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
}

export async function loadConversation(matchId: string): Promise<ChatMessage[] | null> {
  const storedMessages = await AsyncStorage.getItem(conversationStorageKey(matchId));
  if (!storedMessages) return null;

  try {
    const parsed: unknown = JSON.parse(storedMessages);
    return Array.isArray(parsed) && parsed.every(isChatMessage) ? parsed : null;
  } catch {
    return null;
  }
}

export async function storeConversation(
  matchId: string,
  messages: ChatMessage[],
): Promise<void> {
  await AsyncStorage.setItem(conversationStorageKey(matchId), JSON.stringify(messages));
}

export async function clearMatchesAndConversations(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const nearbyKeys = keys.filter(
    (key) => key === MATCHES_STORAGE_KEY || key.startsWith('nearby.chat.'),
  );
  if (nearbyKeys.length > 0) {
    await AsyncStorage.multiRemove(nearbyKeys);
  }
}
