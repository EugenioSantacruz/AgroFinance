import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fingerprint, Lock, ShieldCheck, Delete, Check } from 'lucide-react-native';
import { APP_CONFIG } from '../constants/config';
import { useTheme } from './ThemeContext';
import {
  isWebAuthnAvailable,
  registerBiometricPasskey,
  verifyBiometricPasskey,
} from '../utils/biometrics';

/** Días que se recuerda un dispositivo tras desbloquear con "Recordar este dispositivo". */
const REMEMBER_DAYS = 30;

interface BiometricContextValue {
  isLocked: boolean;
  pinEnabled: boolean;
  hasPasskeyLinked: boolean;
  webAuthnSupported: boolean;
  deviceRemembered: boolean;
  lockApp: () => void;
  forgetDevice: () => void;
  setPinEnabled: (enabled: boolean) => void;
  linkPasskey: () => Promise<{ ok: boolean; error?: string }>;
  unlinkPasskey: () => Promise<void>;
}

const BiometricContext = createContext<BiometricContextValue>({
  isLocked: false,
  pinEnabled: true,
  hasPasskeyLinked: false,
  webAuthnSupported: false,
  deviceRemembered: false,
  lockApp: () => {},
  forgetDevice: () => {},
  setPinEnabled: () => {},
  linkPasskey: async () => ({ ok: false }),
  unlinkPasskey: async () => {},
});

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [pinEnabled, setPinEnabledState] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasPasskeyLinked, setHasPasskeyLinked] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [deviceRemembered, setDeviceRemembered] = useState(false);

  useEffect(() => {
    isWebAuthnAvailable().then(setWebAuthnSupported);
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.WEBAUTHN_CREDENTIAL_ID).then(
      (cred) => {
        setHasPasskeyLinked(Boolean(cred));
      }
    );
    Promise.all([
      AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.PIN_ENABLED),
      AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_DEVICE_UNTIL),
    ]).then(([val, rememberUntil]) => {
      const enabled = val !== 'false';
      const remembered =
        Boolean(rememberUntil) && Date.now() < Number(rememberUntil);
      if (rememberUntil && !remembered) {
        AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_DEVICE_UNTIL);
      }
      setDeviceRemembered(remembered);
      setPinEnabledState(enabled);
      setIsLocked(enabled && !remembered);
      setReady(true);
    });
  }, []);

  const rememberDeviceIfChosen = () => {
    if (!rememberChoice) return;
    const until = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
    AsyncStorage.setItem(
      APP_CONFIG.STORAGE_KEYS.REMEMBER_DEVICE_UNTIL,
      String(until)
    );
    setDeviceRemembered(true);
  };

  const forgetDevice = () => {
    AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.REMEMBER_DEVICE_UNTIL);
    setDeviceRemembered(false);
    setRememberChoice(false);
  };

  const setPinEnabled = (enabled: boolean) => {
    setPinEnabledState(enabled);
    AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.PIN_ENABLED, String(enabled));
    if (!enabled) {
      setIsLocked(false);
      setPinInput('');
    }
  };

  const handleDigitPress = (digit: string) => {
    setErrorMsg(null);
    if (pinInput.length >= 6) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);

    if (nextPin.length === 6) {
      if (nextPin === APP_CONFIG.MASTER_PIN) {
        rememberDeviceIfChosen();
        setPinInput('');
        setIsLocked(false);
      } else {
        setErrorMsg('PIN incorrecto. Intente nuevamente.');
        setTimeout(() => setPinInput(''), 320);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleFaceIdUnlock = async () => {
    setErrorMsg(null);
    const res = await verifyBiometricPasskey();
    if (res.ok) {
      rememberDeviceIfChosen();
      setPinInput('');
      setIsLocked(false);
    } else {
      setErrorMsg(
        res.error || 'No se pudo verificar Face ID. Ingrese su PIN de 6 dígitos.'
      );
    }
  };

  const linkPasskey = async () => {
    const res = await registerBiometricPasskey();
    if (res.ok) {
      setHasPasskeyLinked(true);
    }
    return res;
  };

  const unlinkPasskey = async () => {
    await AsyncStorage.removeItem(
      APP_CONFIG.STORAGE_KEYS.WEBAUTHN_CREDENTIAL_ID
    );
    setHasPasskeyLinked(false);
  };

  // Bloqueo manual: también olvida el dispositivo, así la próxima vez pide PIN.
  const lockApp = () => {
    forgetDevice();
    setPinInput('');
    setErrorMsg(null);
    setIsLocked(true);
  };

  if (!ready) {
    return null;
  }

  if (isLocked) {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return (
      <View
        style={[
          styles.lockScreen,
          { backgroundColor: theme.heroBackground },
        ]}
      >
        <View style={styles.lockCard}>
          <View style={styles.badgeIcon}>
            <ShieldCheck size={28} color="#34D399" />
          </View>
          <Text style={styles.brandTitle}>AGROFINANCE PARAGUAY</Text>
          <Text style={styles.brandSub}>
            Control Patrimonial, Negocio & Flujo Bimoneda
          </Text>

          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const filled = idx < pinInput.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    filled ? styles.pinDotFilled : styles.pinDotEmpty,
                  ]}
                />
              );
            })}
          </View>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <Text style={styles.hintText}>
              Ingrese su PIN de 6 dígitos
            </Text>
          )}

          <TouchableOpacity
            onPress={() => setRememberChoice((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberChoice }}
            accessibilityLabel={`Recordar este dispositivo por ${REMEMBER_DAYS} días`}
            style={styles.rememberRow}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkBox,
                rememberChoice ? styles.checkBoxOn : null,
              ]}
            >
              {rememberChoice ? <Check size={13} color="#052E23" /> : null}
            </View>
            <Text style={styles.rememberText}>
              Recordar este dispositivo ({REMEMBER_DAYS} días)
            </Text>
          </TouchableOpacity>

          <View style={styles.keypadGrid}>
            {digits.map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.keyButton}
                onPress={() => handleDigitPress(d)}
                accessibilityRole="button"
                accessibilityLabel={`Dígito ${d}`}
                activeOpacity={0.75}
              >
                <Text style={styles.keyText}>{d}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.keyButton,
                hasPasskeyLinked ? styles.keyButtonBio : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Desbloquear con huella o Face ID"
              onPress={
                hasPasskeyLinked
                  ? handleFaceIdUnlock
                  : () =>
                      setErrorMsg(
                        'Vincule su Face ID desde Ajustes una vez dentro de la app.'
                      )
              }
              activeOpacity={0.75}
            >
              <Fingerprint
                size={24}
                color={hasPasskeyLinked ? '#34D399' : '#94A3B8'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyButton}
              onPress={() => handleDigitPress('0')}
              accessibilityRole="button"
              accessibilityLabel="Dígito 0"
              activeOpacity={0.75}
            >
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyButton}
              onPress={handleBackspace}
              accessibilityRole="button"
              accessibilityLabel="Borrar último dígito"
              activeOpacity={0.75}
            >
              <Delete size={22} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerSecurityRow}>
            <Lock size={13} color="#6EE7B7" />
            <Text style={styles.footerSecurityText}>
              Cifrado Local + WebAuthn UV Hardware Passkey
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <BiometricContext.Provider
      value={{
        isLocked,
        pinEnabled,
        hasPasskeyLinked,
        webAuthnSupported,
        deviceRemembered,
        lockApp,
        forgetDevice,
        setPinEnabled,
        linkPasskey,
        unlinkPasskey,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = () => useContext(BiometricContext);

const styles = StyleSheet.create({
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingVertical: 6,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxOn: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },
  rememberText: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
  },
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    color: '#ECFDF5',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSub: {
    color: '#A7F3D0',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  pinDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
  },
  pinDotEmpty: {
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#34D399',
  },
  hintText: {
    color: '#A7F3D0',
    fontSize: 12,
    marginBottom: 22,
    textAlign: 'center',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 22,
    textAlign: 'center',
  },
  keypadGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  keyButton: {
    width: '30%',
    height: 62,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyButtonBio: {
    borderColor: 'rgba(52, 211, 153, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  footerSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 26,
  },
  footerSecurityText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '500',
  },
});
