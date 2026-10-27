import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Field, Heading, Notice, Page } from './ui';
import { useStore } from '../store/StoreProvider';
import { getApiErrorMessage } from '../lib/api';

function safeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? path
    : '/(tabs)/profile';
}

export default function AuthForm({
  mode,
  returnTo,
  showBack = true,
  showProductImages = false,
}) {
  const isRegister = mode === 'register';
  const isLogin = mode === 'login';
  const isCenteredAuth = isLogin || isRegister;
  const {
    startLogin,
    products,
    t,
    productName,
    backendConfigured,
  } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (isSubmitting) return;
    if (!backendConfigured) {
      setError(t('backendSetupNotice'));
      return;
    }
    if (isRegister && !name.trim()) {
      setError(t('fullName'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('recoveryInvalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('passwordRequirements'));
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await startLogin({ isRegister, name, email, password });
      router.replace(safeReturnPath(returnTo));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page style={showProductImages ? styles.loginPage : undefined}>
      <ScrollView
        contentContainerStyle={isCenteredAuth ? styles.centeredAuthContent : styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {showBack ? (
          <Text accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹  Back</Text>
        ) : null}
        {showProductImages ? (
          <View style={styles.productGallery} accessibilityLabel="Product photos">
            {['Clothing', 'Bags', 'Shoes'].map((category) => {
              const product = products.find((item) => item.category === category && item.image);
              return product ? (
                <Image
                  key={product.id}
                  source={product.image}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={150}
                  accessibilityLabel={productName(product)}
                />
              ) : null;
            })}
          </View>
        ) : (
          <View style={styles.intro}>
            <Text style={styles.brand}>D&G</Text>
            <Text style={styles.eyebrow}>A LITTLE SOMETHING, JUST FOR YOU</Text>
          </View>
        )}
        <Heading style={[styles.title, isCenteredAuth && styles.centeredText]}>
          {isRegister ? t('register') : t('login')}
        </Heading>
        <Text style={[styles.copy, isCenteredAuth && styles.centeredText]}>
          {isRegister
            ? t('customerRegisterCopy')
            : t('customerLoginCopy')}
        </Text>
        <View style={[styles.form, isCenteredAuth && styles.centeredAuthForm]}>
          {isRegister ? (
            <View style={styles.accountType}>
              <Text style={[styles.accountTypeLabel, styles.centeredText]}>{t('accountType')}</Text>
              <Text style={[styles.accountTypeValue, styles.centeredText]}>{t('customer')}</Text>
            </View>
          ) : null}
          {error ? <Notice error centered={isCenteredAuth}>{error}</Notice> : null}
          {!backendConfigured ? <Notice centered={isCenteredAuth}>{t('backendSetupNotice')}</Notice> : null}
          {isRegister ? (
            <Field
              label={t('fullName')}
              value={name}
              onChangeText={setName}
              placeholder={t('fullName')}
              autoCapitalize="words"
              returnKeyType="next"
            />
          ) : null}
          <Field
            label={t('emailAddress')}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
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
            title={isRegister ? t('register') : t('login')}
            onPress={submit}
            disabled={!backendConfigured || isSubmitting}
          />
          {!isRegister ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({
                pathname: '/auth/forgot-password',
                params: returnTo ? { returnTo } : {},
              })}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </Pressable>
          ) : null}
          {backendConfigured ? <Text style={styles.demo}>{t('authNotice')}</Text> : null}
          <Text
            accessibilityRole="button"
            onPress={() => router.replace({
              pathname: isRegister ? '/auth/login' : '/auth/register',
              params: returnTo ? { returnTo } : {},
            })}
            style={styles.switch}
          >
            {isRegister ? 'Already have an account? ' : 'New to D&G? '}
            <Text style={styles.switchLink}>{isRegister ? t('login') : t('register')}</Text>
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  loginPage: { backgroundColor: '#F4F6F8' },
  content: { flexGrow: 1, paddingTop: 18, paddingBottom: 32 },
  centeredAuthContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 18, paddingBottom: 32 },
  back: { alignSelf: 'flex-start', color: colors.oliveDark, fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  intro: { alignItems: 'center', marginTop: 28, marginBottom: 36 },
  brand: { color: colors.ink, fontSize: 37, fontWeight: '800', letterSpacing: -2 },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginTop: 5 },
  productGallery: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 24 },
  productImage: { width: '31%', maxWidth: 112, aspectRatio: 1, borderRadius: 16, backgroundColor: '#E9E2D7' },
  title: { fontSize: 28, width: '100%' },
  centeredText: { textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7, width: '100%' },
  form: { marginTop: 26 },
  centeredAuthForm: { width: '100%', maxWidth: 440 },
  forgotPassword: { alignSelf: 'center', paddingVertical: 8, marginTop: 4, marginBottom: 4 },
  forgotPasswordText: { color: colors.oliveDark, fontSize: 12, fontWeight: '600' },
  accountType: { padding: 13, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, marginBottom: 20 },
  accountTypeLabel: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  accountTypeValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  demo: { color: colors.muted, textAlign: 'center', fontSize: 10, lineHeight: 16, marginTop: 15 },
  switch: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 24, paddingVertical: 8 },
  switchLink: { color: colors.oliveDark, fontWeight: '700' },
});
