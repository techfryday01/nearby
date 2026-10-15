import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  loadConversation as readConversation,
  loadMatches as readMatches,
  storeConversation,
  storeMatches,
  clearMatchesAndConversations,
  type ChatMessage,
  type MatchProfile,
} from './matchStorage';
import { supabase } from '../lib/supabase';

export type { ChatMessage, MatchProfile } from './matchStorage';

type MatchContextValue = {
  matches: MatchProfile[];
  isMatchesLoaded: boolean;
  addMatch: (profile: MatchProfile) => Promise<void>;
  clearMatches: () => Promise<void>;
  loadConversation: (matchId: string) => Promise<ChatMessage[] | null>;
  saveConversation: (matchId: string, messages: ChatMessage[]) => Promise<void>;
};

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [isMatchesLoaded, setIsMatchesLoaded] = useState(false);
  const matchesRef = useRef<MatchProfile[]>([]);
  const matchesLoadedRef = useRef(false);
  const conversationWrites = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    let isMounted = true;

    readMatches()
      .then((savedMatches) => {
        if (!isMounted) return;
        matchesRef.current = savedMatches;
        setMatches(savedMatches);
      })
      .catch(() => {
        if (isMounted) {
          matchesRef.current = [];
          setMatches([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          matchesLoadedRef.current = true;
          setIsMatchesLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addMatch = useCallback(async (profile: MatchProfile) => {
    if (!matchesLoadedRef.current) {
      throw new Error('Saved matches have not loaded yet.');
    }

    const currentMatches = matchesRef.current;
    if (currentMatches.some((match) => match.id === profile.id)) return;

    const nextMatches = [profile, ...currentMatches];
    await storeMatches(nextMatches);
    matchesRef.current = nextMatches;
    setMatches(nextMatches);
  }, []);

  const clearMatches = useCallback(async () => {
    await clearMatchesAndConversations();
    matchesRef.current = [];
    setMatches([]);
    matchesLoadedRef.current = true;
    setIsMatchesLoaded(true);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        void clearMatches().catch(() => undefined);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [clearMatches]);

  const loadConversation = useCallback((matchId: string) => readConversation(matchId), []);

  const saveConversation = useCallback((matchId: string, messages: ChatMessage[]) => {
    const previousWrite = conversationWrites.current.get(matchId) ?? Promise.resolve();
    const nextWrite = previousWrite
      .catch(() => undefined)
      .then(() => storeConversation(matchId, messages));
    conversationWrites.current.set(matchId, nextWrite);
    return nextWrite;
  }, []);

  const value = useMemo(
    () => ({ matches, isMatchesLoaded, addMatch, clearMatches, loadConversation, saveConversation }),
    [matches, isMatchesLoaded, addMatch, clearMatches, loadConversation, saveConversation],
  );

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within a MatchProvider');
  }
  return context;
}
