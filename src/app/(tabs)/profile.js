import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Heading, Notice, Page } from '../../components/ui';
import { useStore } from '../../store/StoreProvider';
import { getApiErrorMessage } from '../../lib/api';

export default function ProfileScreen() {
  const { user, signOut, language, setLanguage, t, storeError } = useStore();
  const [signOutError, setSignOutError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setSignOutError('');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(getApiErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content}>
        {storeError ? <Notice error>{storeError}</Notice> : null}
        <Text style={styles.eyebrow}>{t('yourDg')}</Text>
        <Heading style={styles.title}>{t('profile')}</Heading>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'D'}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user ? user.name : t('welcome')}</Text>
            <Text style={styles.email}>{user ? user.email : t('profileGreeting')}</Text>
            {user ? <Text style={styles.accountRole}>{user.role === 'seller' ? t('sellerAccount') : t('customerAccount')}</Text> : null}
          </View>
        </View>
        {user ? (
          <>
            <Text style={styles.section}>{t('account')}</Text>
            <Text style={styles.menu} onPress={() => router.push('/(tabs)/orders')}>{t('orderHistory')} <Text style={styles.arrow}>›</Text></Text>
            <Text style={styles.menu} onPress={() => router.push('/reports')}>{t('storeReports')} <Text style={styles.arrow}>›</Text></Text>
            {signOutError ? <Notice error>{signOutError}</Notice> : null}
            <Button title={t('signOut')} secondary onPress={handleSignOut} disabled={isSigningOut} style={styles.action} />
          </>
        ) : (
          <View style={styles.authActions}>
            <Button title={t('login')} onPress={() => router.push('/auth/login')} />
            <Button title={t('register')} secondary onPress={() => router.push('/auth/register')} style={styles.action} />
          </View>
        )}
        <Text style={styles.section}>{t('language').toUpperCase()}</Text>
        <View style={styles.languageRow}>
          {[['en', 'English'], ['fr', 'Français'], ['rw', 'Ikinyarwanda']].map(([code, label]) => (
            <Text
              key={code}
              accessibilityRole="button"
              accessibilityState={{ selected: language === code }}
              onPress={() => setLanguage(code)}
              style={[styles.language, language === code && styles.languageSelected]}
            >{language === code ? '✓  ' : ''}{label}</Text>
          ))}
        </View>
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>{t('demoMode')}</Text>
          <Text style={styles.demoCopy}>{t('demoCopy')}</Text>
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 30 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 30, marginTop: 7, marginBottom: 22 },
  card: { backgroundColor: 'white', padding: 17, borderRadius: 17, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E6E9DD', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, color: colors.oliveDark, fontWeight: '700' },
  userInfo: { marginLeft: 13, flex: 1 },
  name: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  email: { color: colors.muted, fontSize: 11, marginTop: 4 },
  authActions: { marginTop: 19 },
  action: { marginTop: 10 },
  section: { color: colors.muted, fontWeight: '800', letterSpacing: 1.3, fontSize: 9, marginTop: 27, marginBottom: 12 },
  menu: { color: colors.ink, fontWeight: '600', fontSize: 14, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  arrow: { color: colors.olive, fontSize: 22, position: 'absolute', right: 0 },
  languageRow: { flexDirection: 'row', gap: 8 },
  language: { flex: 1, backgroundColor: 'white', borderRadius: 12, paddingVertical: 13, textAlign: 'center', color: colors.muted, overflow: 'hidden', fontSize: 11, borderWidth: 1, borderColor: colors.line },
  languageSelected: { backgroundColor: '#EDF0E6', color: colors.oliveDark, borderColor: '#D6DCC8', fontWeight: '700' },
  demoCard: { marginTop: 27, padding: 15, backgroundColor: '#F0EEE7', borderRadius: 14 },
  demoTitle: { color: colors.oliveDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  demoCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
});
