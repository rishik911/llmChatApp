import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import BlinkingCursor from './BlinkingCursor';
import type { Message } from '../types';

function Dot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const totalLoop = 1200; // ms — all dots share this period
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(totalLoop - 600 - delay),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

function ThinkingDots() {
  return (
    <View style={styles.dotsRow}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const bubbleStyle = [
    styles.bubble,
    isUser ? styles.bubbleUser : styles.bubbleAssistant,
    message.error && styles.bubbleError,
  ];

  const showThinking = message.streaming && message.content === '';
  const showCursor = message.streaming && message.content !== '';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {showThinking ? (
        <View style={[styles.bubble, styles.bubbleAssistant]}>
          <ThinkingDots />
        </View>
      ) : (
        <Text style={bubbleStyle}>
          {message.content}
          {showCursor && <BlinkingCursor />}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleUser: {
    backgroundColor: '#1a73e8',
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#f1f1f1',
    color: '#111',
    borderBottomLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: '#fff0f0',
    color: '#c0392b',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
});
