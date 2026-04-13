import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppColors } from '../../hooks/useColorScheme';
import { spacing, fontSize, fontWeight, borderRadius } from '../../theme/spacing';

interface TModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const TModal: React.FC<TModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  const colors = useAppColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={[styles.content, { backgroundColor: colors.neutral[50] }]}>
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.neutral[900] }]}>
                      {title || ''}
                    </Text>
                    {showCloseButton && (
                      <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={[styles.closeButton, { color: colors.neutral[500] }]}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minWidth: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as any,
    flex: 1,
  },
  closeButton: {
    fontSize: 18,
    padding: spacing.xxs,
  },
});