import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function BlinkingCursor() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 530, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 530, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.Text style={{ opacity }}>▍</Animated.Text>;
}
