import { useCallback, useState } from 'react';
import type { Conversation, Message } from '../types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const createConversation = useCallback((): string => {
    const id = `conv-${Date.now()}`;
    setConversations(prev => [
      { id, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() },
      ...prev,
    ]);
    return id;
  }, []);

  const updateMessages = useCallback((id: string, messages: Message[]) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, messages, updatedAt: Date.now() } : c),
    );
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c),
    );
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  return { conversations, createConversation, updateMessages, updateTitle, deleteConversation };
}
