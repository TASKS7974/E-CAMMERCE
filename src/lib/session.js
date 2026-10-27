import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'dg.access-token';

function getWebStorage() {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function getStoredAccessToken() {
  if (Platform.OS === 'web') {
    return Promise.resolve(getWebStorage()?.getItem(ACCESS_TOKEN_KEY) || null);
  }
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token) {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    if (!storage) throw new Error('Browser storage is unavailable.');
    storage.setItem(ACCESS_TOKEN_KEY, token);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(ACCESS_TOKEN_KEY);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
