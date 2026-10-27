import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Field, Heading, Notice, Page } from '../components/ui';
import { formatPrice } from '../data/products';
import { useStore } from '../store/StoreProvider';
import { getApiErrorMessage } from '../lib/api';

const PAYMENT_OPTIONS = ['Cash on delivery', 'Mobile money (demo)'];

export default function CheckoutScreen() {
  const { cart, user, placeOrder, t, backendConfigured, authLoading } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (cart.length ? 2000 : 0);

  async function submit() {
    if (isSubmitting) return;
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setError(t('checkoutCompleteDetails'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('checkoutInvalidEmail'));
      return;
    }
    if (!cart.length) {
      setError(t('checkoutEmptyBag'));
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const order = await placeOrder({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        paymentMethod,
      });
      router.replace(`/orders/${order.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹  {t('back')}</Text>
        <Text style={styles.eyebrow}>{t('almostYours')}</Text>
        <Heading style={styles.title}>{t('checkout')}</Heading>
        {authLoading ? (
          <Notice>{t('checkingAccount')}</Notice>
        ) : !user ? (
          <View style={styles.signInCard}>
            <Heading style={styles.cardTitle}>{t('signInPlaceOrder')}</Heading>
            <Text style={styles.copy}>{t('checkoutAccountCopy')}</Text>
            {!backendConfigured ? <Notice>{t('backendSetupNotice')}</Notice> : null}
            <Button
              title={t('login')}
              onPress={() => router.push({ pathname: '/auth/login', params: { returnTo: '/checkout' } })}
              style={styles.signInButton}
            />
            <Text
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/auth/register', params: { returnTo: '/checkout' } })}
              style={styles.register}
            >
              {t('createDemoAccount')}
            </Text>
          </View>
        ) : cart.length === 0 ? (
          <View style={styles.signInCard}>
            <Heading style={styles.cardTitle}>{t('emptyCart')}</Heading>
            <Button title={t('shopNow')} onPress={() => router.replace('/(tabs)/shop')} style={styles.signInButton} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('address')}</Text>
              <Field label={t('fullName')} value={name} onChangeText={setName} placeholder={t('nameForDelivery')} autoCapitalize="words" />
              <Field label={t('emailAddress')} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label={t('phoneNumber')} value={phone} onChangeText={setPhone} placeholder="+250 7XX XXX XXX" keyboardType="phone-pad" />
              <Field label={t('streetArea')} value={address} onChangeText={setAddress} placeholder={t('streetPlaceholder')} />
              <Field label="City" value={city} onChangeText={setCity} placeholder="Kigali" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('payment')}</Text>
              <Text style={styles.demoCopy}>{t('demoPayment')}</Text>
              {PAYMENT_OPTIONS.map((option) => {
                const selected = paymentMethod === option;
                return (
                  <Text
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setPaymentMethod(option)}
                    style={[styles.paymentOption, selected && styles.paymentSelected]}
                  >
                    <Text style={styles.radio}>{selected ? '◉' : '○'}</Text>  {option === PAYMENT_OPTIONS[0] ? t('cashOnDelivery') : t('mobileMoneyDemo')}
                  </Text>
                );
              })}
            </View>

            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>{t('orderSummary')}</Text>
              <View style={styles.summaryRow}><Text style={styles.label}>{t('subtotal')}</Text><Text style={styles.value}>{formatPrice(subtotal)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.label}>{t('delivery')}</Text><Text style={styles.value}>{formatPrice(2000)}</Text></View>
              <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>{t('total')}</Text><Text style={styles.totalValue}>{formatPrice(total)}</Text></View>
            </View>
            {error ? <Notice error>{error}</Notice> : null}
            <Button title={t('placeOrder')} onPress={submit} disabled={isSubmitting} />
            <Text style={styles.footer}>{t('demoCheckoutFooter')}</Text>
          </>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  back: { color: colors.oliveDark, fontSize: 13, fontWeight: '600', paddingVertical: 9, marginBottom: 12 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 28, marginTop: 6, marginBottom: 20 },
  section: { marginBottom: 17 },
  sectionTitle: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 13 },
  demoCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 10 },
  paymentOption: { color: colors.ink, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 9, fontSize: 12 },
  paymentSelected: { borderColor: colors.olive, backgroundColor: '#F1F2EC' },
  radio: { color: colors.oliveDark, fontSize: 14, fontWeight: '700' },
  summary: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  label: { color: colors.muted, fontSize: 12 },
  value: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 12 },
  totalLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  totalValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 12 },
  signInCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 18, marginTop: 16 },
  cardTitle: { fontSize: 18 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  signInButton: { marginTop: 18 },
  register: { color: colors.oliveDark, textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 15 },
});
