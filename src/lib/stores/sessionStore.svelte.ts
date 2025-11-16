import type { TutorMessage } from "$lib/tools";

const SESSION_STORAGE_KEY = "sessions";

// Session management types

export interface SessionData {
  documentContent: string;
  messages: TutorMessage[];
  inputValue: string;
}

export interface Session extends SessionData {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
}

// Reactive state
export const sessionState = $state<SessionState>({
  sessions: [],
  activeSessionId: null,
});

const generateId = () => Math.random().toString(36).substring(2, 15);

export const formatSessionName = (session: Session) => {
  return `Session - ${new Date(session.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

// Derived state utility
export const getActiveSession = () => {
  return sessionState.activeSessionId
    ? sessionState.sessions.find((s) => s.id === sessionState.activeSessionId)
    : undefined;
};

export const loadFromStorage = () => {
  if (typeof window === "undefined") return;

  const storedSessionState = localStorage.getItem(SESSION_STORAGE_KEY);

  if (storedSessionState) {
    const state = JSON.parse(storedSessionState);
    sessionState.sessions = state.sessions;
    sessionState.activeSessionId = state.activeSessionId;
  }
};

export function saveToStorage() {
  if (typeof window === "undefined") return;

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
}

export const createSession = (data: SessionData) => {
  const now = Date.now();
  const newSession: Session = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  sessionState.sessions.unshift(newSession);
  sessionState.activeSessionId = newSession.id;

  saveToStorage();
};

export const updateSession = (
  sessionId: string,
  updates: Partial<SessionData>,
) => {
  const index = sessionState.sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    sessionState.sessions[index] = {
      ...sessionState.sessions[index],
      ...updates,
      updatedAt: Date.now(),
    };

    saveToStorage();
  }
};

export const switchSession = (sessionId: string | null) => {
  if (!sessionId || sessionState.sessions.some((s) => s.id === sessionId)) {
    sessionState.activeSessionId = sessionId;
    saveToStorage();
  }
};

export const deleteSession = (sessionId: string) => {
  const index = sessionState.sessions.findIndex((s) => s.id === sessionId);
  if (index === -1) return;

  sessionState.sessions.splice(index, 1);
  saveToStorage();
};

export function upsertSession(updates: SessionData) {
  if (sessionState.activeSessionId) {
    updateSession(sessionState.activeSessionId, updates);
  } else if (updates.messages.length >= 2) {
    createSession(updates);
  }
}
