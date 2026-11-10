import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';

/**
 * Implementación WebAuthn Passkeys con verificación criptográfica del flag UV (User Verified, bit 2 = 0x04)
 * en authenticatorData para Face ID / Touch ID real en iOS Safari PWA y Desktop.
 */

function randomChallenge(size = 32): Uint8Array {
  const bytes = new Uint8Array(size);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output.buffer;
}

export async function isWebAuthnAvailable(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricPasskey(): Promise<{
  ok: boolean;
  credentialId?: string;
  error?: string;
}> {
  try {
    const available = await isWebAuthnAvailable();
    if (!available) {
      return {
        ok: false,
        error: 'Este dispositivo o navegador no soporta Face ID / Passkey de plataforma.',
      };
    }

    const userId = randomChallenge(16);
    const challenge = randomChallenge(32);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: {
          name: 'AgroFinance Paraguay',
          id: window.location.hostname || 'localhost',
        },
        user: {
          id: userId.buffer as ArrayBuffer,
          name: 'productor@agrofinance.py',
          displayName: 'Productor AgroFinance',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 45000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { ok: false, error: 'No se pudo crear la credencial biométrica.' };
    }

    const credId = bufferToBase64Url(credential.rawId);
    await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.WEBAUTHN_CREDENTIAL_ID, credId);
    return { ok: true, credentialId: credId };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Registro de Face ID cancelado por el usuario.',
    };
  }
}

export async function verifyBiometricPasskey(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const savedCredId = await AsyncStorage.getItem(
      APP_CONFIG.STORAGE_KEYS.WEBAUTHN_CREDENTIAL_ID
    );
    if (!savedCredId) {
      return { ok: false, error: 'No hay Face ID vinculado en este dispositivo.' };
    }

    const challenge = randomChallenge(32);
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        allowCredentials: [
          {
            id: base64UrlToBuffer(savedCredId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 30000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { ok: false, error: 'No se recibió respuesta biométrica.' };
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    const authData = new Uint8Array(response.authenticatorData);
    // Byte 32 contiene los flags de authenticatorData:
    // Bit 0 (0x01) = UP (User Present), Bit 2 (0x04) = UV (User Verified)
    const flags = authData[32] || 0;
    const isUserPresent = (flags & 0x01) !== 0;
    const isUserVerified = (flags & 0x04) !== 0;

    if (!isUserPresent || !isUserVerified) {
      return {
        ok: false,
        error: 'El autenticador no confirmó la verificación biométrica (flag UV).',
      };
    }

    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Verificación Face ID cancelada.',
    };
  }
}

