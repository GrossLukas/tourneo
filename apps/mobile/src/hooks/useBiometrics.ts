/**
 * useBiometrics – Hook for biometric authentication (Face ID / Touch ID / Fingerprint).
 * Wraps expo-local-authentication with a simple API.
 */
import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | null;

interface BiometricState {
  isAvailable: boolean;
  biometricType: BiometricType;
  isChecking: boolean;
}

interface UseBiometricsReturn extends BiometricState {
  authenticate: (promptMessage?: string) => Promise<boolean>;
  checkAvailability: () => Promise<void>;
  getDisplayName: () => string;
}

export function useBiometrics(): UseBiometricsReturn {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    biometricType: null,
    isChecking: true,
  });

  const checkAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setState({ isAvailable: false, biometricType: null, isChecking: false });
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setState({ isAvailable: false, biometricType: null, isChecking: false });
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometricType: BiometricType = null;

      if (Platform.OS === 'ios') {
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = 'faceId';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = 'touchId';
        }
      } else {
        // Android
        if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = 'fingerprint';
        } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = 'faceId';
        }
      }

      setState({
        isAvailable: biometricType !== null,
        biometricType,
        isChecking: false,
      });
    } catch {
      setState({ isAvailable: false, biometricType: null, isChecking: false });
    }
  }, []);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authentifizierung bestätigen',
        cancelLabel: 'Abbrechen',
        disableDeviceFallback: false,
        fallbackLabel: 'Passwort verwenden',
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  const getDisplayName = useCallback((): string => {
    switch (state.biometricType) {
      case 'faceId': return 'Face ID';
      case 'touchId': return 'Touch ID';
      case 'fingerprint': return 'Fingerabdruck';
      default: return 'Biometrie';
    }
  }, [state.biometricType]);

  return {
    ...state,
    authenticate,
    checkAvailability,
    getDisplayName,
  };
}