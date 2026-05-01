import React, { useCallback, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatScreen from './src/ChatScreen';
import ConversationListScreen from './src/screens/ConversationListScreen';
import { useConversations } from './src/hooks/useConversations';
import type { Message } from './src/types';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { conversations, createConversation, updateMessages, updateTitle, deleteConversation } =
    useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);

  const openNew = useCallback(() => {
    const id = createConversation();
    setActiveId(id);
  }, [createConversation]);

  const openExisting = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleBack = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleMessagesChange = useCallback(
    (id: string) => (messages: Message[]) => updateMessages(id, messages),
    [updateMessages],
  );

  const handleTitleChange = useCallback(
    (id: string) => (title: string) => updateTitle(id, title),
    [updateTitle],
  );

  const activeConversation = conversations.find(c => c.id === activeId);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {activeConversation ? (
        // key ensures a clean remount (fresh state, cancelled streams) when
        // switching between conversations.
        <ChatScreen
          key={activeConversation.id}
          conversation={activeConversation}
          onBack={handleBack}
          onMessagesChange={handleMessagesChange(activeConversation.id)}
          onTitleChange={handleTitleChange(activeConversation.id)}
        />
      ) : (
        <ConversationListScreen
          conversations={conversations}
          onSelect={openExisting}
          onNew={openNew}
          onDelete={deleteConversation}
        />
      )}
    </SafeAreaProvider>
  );
}
