import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { FlatList, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';
import type { Message } from '../types';

export interface MessageListHandle {
  scrollToBottom: () => void;
}

interface Props {
  messages: Message[];
}

const AT_BOTTOM_THRESHOLD = 60;

const MessageList = forwardRef<MessageListHandle, Props>(
  ({ messages }, ref) => {
    const listRef = useRef<FlatList<Message>>(null);
    const atBottomRef = useRef(true);
    const programmaticScrollRef = useRef(false);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        atBottomRef.current = true;
        programmaticScrollRef.current = true;
        listRef.current?.scrollToEnd({ animated: true });
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
          programmaticScrollRef.current = false;
          scrollTimerRef.current = null;
        }, 400);
      },
    }));

    // Auto-follow during streaming. useEffect on messages fires after every
    // render (including each typewriter character) which is more reliable than
    // onContentSizeChange — FlatList's virtualiser can skip that callback when
    // the height delta is below its threshold.
    useEffect(() => {
      if (atBottomRef.current) {
        // animated: false — avoids spawning a competing scroll animation on
        // every character, which was causing the list to stutter and lag behind.
        listRef.current?.scrollToEnd({ animated: false });
      }
    }, [messages]);

    const onScroll = useCallback((e: any) => {
      if (programmaticScrollRef.current) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const gap =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      atBottomRef.current = gap <= AT_BOTTOM_THRESHOLD;
    }, []);

    return (
      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={60}
        keyboardDismissMode="interactive"
      />
    );
  },
);

export default MessageList;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
});
