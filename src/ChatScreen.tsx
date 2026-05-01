import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { streamChat } from './network/GeminiRepository';
import type { ChatMessage, StreamHandle } from './network/types';
import type { Conversation, Message } from './types';
import ChatHeader from './components/ChatHeader';
import InputBar from './components/InputBar';
import MessageList, { type MessageListHandle } from './components/MessageList';
import { useStreamBuffer } from './hooks/useStreamBuffer';

interface Props {
  conversation: Conversation;
  onBack: () => void;
  onMessagesChange: (messages: Message[]) => void;
  onTitleChange: (title: string) => void;
}

export default function ChatScreen({
  conversation,
  onBack,
  onMessagesChange,
  onTitleChange,
}: Props) {
  const insets = useSafeAreaInsets();

  // key={conversation.id} on this component guarantees a clean remount on
  // every conversation switch, so useState(conversation.messages) always
  // initialises correctly without any manual sync logic.
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  const streamHandleRef = useRef<StreamHandle | null>(null);
  const generationRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const messageListRef = useRef<MessageListHandle>(null);
  const titleSetRef = useRef(conversation.title !== 'New Chat');

  messagesRef.current = messages;

  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      onMessagesChange(messagesRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  // ── Typewriter buffer ──────────────────────────────────────────────────────

  const {
    start,
    enqueue,
    markNetworkDone,
    abort: abortTypewriter,
  } = useStreamBuffer({
    onChar: useCallback((id: string, char: string) => {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: m.content + char } : m)),
      );
    }, []),
    onDone: useCallback((id: string) => {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, streaming: false } : m)),
      );
      setIsStreaming(false);
    }, []),
  });

  useEffect(() => {
    return () => {
      streamHandleRef.current?.abort();
      abortTypewriter();
    };
  }, [abortTypewriter]);

  const stop = useCallback(() => {
    streamHandleRef.current?.abort();
    streamHandleRef.current = null;
    generationRef.current++;
    abortTypewriter();
    const id = activeIdRef.current;
    activeIdRef.current = null;
    if (id) {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, streaming: false } : m)),
      );
    }
    setIsStreaming(false);
  }, [abortTypewriter]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    streamHandleRef.current?.abort();
    streamHandleRef.current = null;
    generationRef.current++;
    abortTypewriter();
    if (activeIdRef.current) {
      const frozenId = activeIdRef.current;
      activeIdRef.current = null;
      setMessages(prev =>
        prev.map(m => (m.id === frozenId ? { ...m, streaming: false } : m)),
      );
    }

    // Auto-title from the first user message in this conversation
    if (!titleSetRef.current) {
      titleSetRef.current = true;
      const newTitle = text.slice(0, 50);
      setTitle(newTitle);
      onTitleChange(newTitle);
    }

    const gen = generationRef.current;

    const history: ChatMessage[] = messagesRef.current
      .filter(m => !m.streaming)
      .map(({ role, content }) => ({
        role: role === 'assistant' ? 'model' : 'user',
        content,
      }));
    history.push({ role: 'user', content: text });

    const userId = `u-${gen}`;
    const assistantId = `a-${gen}`;

    setMessages(prev => [
      ...prev,
      { id: userId, role: 'user', content: text, streaming: false },
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);
    setDraft('');
    setIsStreaming(true);
    activeIdRef.current = assistantId;
    messageListRef.current?.scrollToBottom();
    start(assistantId);

    const handleError = () => {
      if (gen !== generationRef.current) return;
      abortTypewriter();
      activeIdRef.current = null;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: 'Something went wrong. Please try again.',
                streaming: false,
                error: true,
              }
            : m,
        ),
      );
      setIsStreaming(false);
    };

    streamHandleRef.current = streamChat(history, {
      onToken: token => {
        if (gen === generationRef.current) enqueue(token);
      },
      onComplete: () => {
        if (gen === generationRef.current) markNetworkDone();
      },
      onError: handleError,
    });
  }, [draft, start, enqueue, markNetworkDone, abortTypewriter, onTitleChange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ChatHeader title={title} onBack={onBack} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <MessageList ref={messageListRef} messages={messages} />
        <InputBar
          draft={draft}
          isStreaming={isStreaming}
          onChangeText={setDraft}
          onSend={send}
          onStop={stop}
        />
      </KeyboardAvoidingView>
      <View style={{ height: insets.bottom, backgroundColor: '#fff' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fill: {
    flex: 1,
  },
});
