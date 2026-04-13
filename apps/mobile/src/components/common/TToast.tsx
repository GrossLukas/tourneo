import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { create } from 'zustand';

// ============================================
// TOURNEO - Toast Notification System
// Premium toast with haptic feedback support
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  show: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (type, title, message, duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message, duration }],
    }));
    // Auto dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Individual toast item
function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Animate out before removal
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }, (toast.duration || 3000) - 300);

    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: { icon: '✅', bg: '#16A34A', label: 'Erfolg' },
    error: { icon: '❌', bg: '#DC2626', label: 'Fehler' },
    warning: { icon: '⚠️', bg: '#D97706', label: 'Warnung' },
    info: { icon: 'ℹ️', bg: colors.primary as string, label: 'Info' },
  }[toast.type];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: config.bg, transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={styles.toastContent} onPress={onDismiss} activeOpacity={0.8}>
        <Text style={styles.toastIcon}>{config.icon}</Text>
        <View style={styles.toastText}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
        </View>
        <Text style={styles.toastClose}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast container - place at app root
export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const toasts = useToast((state) => state.toasts);
  const dismiss = useToast((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  toastIcon: {
    fontSize: 20,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  toastClose: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    padding: 4,
  },
});