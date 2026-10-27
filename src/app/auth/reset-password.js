import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, colors, Field, Heading, Notice, Page } from '../../components/ui';
import { getApiErrorMessage } from '../../lib/api';
import { useStore } from '../../store/StoreProvider';

export default function ResetPasswordScreen() {
  const { token: searchToken } = useLocalSearchParams();
  const token = typeof searchToken === 'string' ? searchToken : '';
  const { authConfigured, finishPasswordReset, t } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (isSubmitting) return;
    if (!token) {
      setError(t('resetPasswordInvalid'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordRequirements'));
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await finishPasswordReset(token, password);
      router.replace('/auth/login');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>D&G</Text>
        <Heading style={styles.title}>{t('resetPassword')}</Heading>
        <Text style={styles.copy}>{t('resetPasswordCopy')}</Text>
        {!authConfigured ? <Notice>{t('authSetupNotice')}</Notice> : null}
        {error ? <Notice error>{error}</Notice> : null}
        <Field
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('password')}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Button
          title={t('continue')}
          onPress={submit}
          disabled={!authConfigured || isSubmitting}
        />
        <Text
          accessibilityRole="button"
          onPress={() => router.replace('/auth/login')}
          style={styles.backToLogin}
        >
          {t('backToLogin')}
        </Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingTop: 24, paddingBottom: 32 },
  brand: { color: colors.ink, fontSize: 37, fontWeight: '800', letterSpacing: -2, textAlign: 'center', marginBottom: 28 },
  title: { fontSize: 27, textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  backToLogin: { color: colors.oliveDark, textAlign: 'center', fontSize: 13, fontWeight: '600', paddingVertical: 16 },
});
