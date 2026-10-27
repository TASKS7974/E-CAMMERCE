import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, colors, Field, Heading, Notice, Page } from '../../components/ui';
import { useStore } from '../../store/StoreProvider';
import { getApiErrorMessage } from '../../lib/api';

function safeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? path
    : undefined;
}

export default function ForgotPasswordScreen() {
  const { returnTo: searchReturnTo } = useLocalSearchParams();
  const returnTo = safeReturnPath(searchReturnTo);
  const { t, authConfigured, sendPasswordReset } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function returnToLogin() {
    router.replace({
      pathname: '/auth/login',
      params: returnTo ? { returnTo } : {},
    });
  }

  async function submit() {
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t('recoveryInvalidEmail'));
      setSubmitted(false);
      return;
    }

    if (!authConfigured) {
      setError(t('authSetupNotice'));
      setSubmitted(false);
      return;
    }

    setError('');
    setEmail(normalizedEmail);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(normalizedEmail);
      setSubmitted(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>D&G</Text>
        <Heading style={styles.title}>{t('forgotPassword')}</Heading>
        <Text style={styles.copy}>{t('recoveryCopy')}</Text>
        {!authConfigured ? <Notice>{t('authSetupNotice')}</Notice> : null}
        <Field
          label={t('emailAddress')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setSubmitted(false);
            setError('');
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {error ? <Notice error>{error}</Notice> : null}
        {submitted ? <Notice>{t('recoveryEmailSent')}</Notice> : null}
        <Button title={t('continue')} onPress={submit} disabled={!authConfigured || isSubmitting} />
        <Text
          accessibilityRole="button"
          onPress={returnToLogin}
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
