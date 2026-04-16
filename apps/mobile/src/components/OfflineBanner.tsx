import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '../hooks/useNetwork';

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isConnected === false ? 0 : -50,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isConnected]);

  if (isConnected !== false) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Text style={styles.text}>Keine Internetverbindung</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF4757',
    paddingTop: 50,
    paddingBottom: 8,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
