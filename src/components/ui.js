import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  ink: '#22231F',
  muted: '#85877F',
  olive: '#667247',
  oliveDark: '#4E5937',
  cream: '#F8F7F2',
  paper: '#FFFFFF',
  line: '#E9E8E1',
  peach: '#F2E2D9',
  red: '#B74439',
};

export function Page({ children, style }) {
  return <View style={[styles.page, style]}>{children}</View>;
}

export function Heading({ children, style }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Button({ title, onPress, secondary = false, disabled = false, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
  centered = false,
}) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={[styles.fieldLabel, centered && styles.centeredText]}>{label}</Text> : null}
      <TextInput
        style={[styles.field, centered && styles.centeredText]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
      />
    </View>
  );
}

export function Notice({ children, error = false, centered = false }) {
  return (
    <View style={[styles.notice, error && styles.noticeError]}>
      <Text style={[styles.noticeText, error && styles.noticeErrorText, centered && styles.centeredText]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 20 },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  button: { minHeight: 52, borderRadius: 15, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  buttonSecondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonText: { color: colors.paper, fontSize: 15, fontWeight: '700' },
  buttonSecondaryText: { color: colors.ink },
  fieldWrap: { marginBottom: 16 },
  centeredText: { textAlign: 'center' },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  field: { minHeight: 50, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, fontSize: 15 },
  notice: { padding: 12, borderRadius: 12, backgroundColor: '#EDF0E6', marginBottom: 14 },
  noticeText: { color: colors.oliveDark, fontSize: 13, lineHeight: 19 },
  noticeError: { backgroundColor: '#F8E8E5' },
  noticeErrorText: { color: colors.red },
});
