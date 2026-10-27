import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, colors, Heading, Notice, Page } from '../../components/ui';
import { formatPrice } from '../../data/products';
import { ORDER_STATUSES, useStore } from '../../store/StoreProvider';
import { getApiErrorMessage } from '../../lib/api';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const { orders, saveDeliveryMessage, t, statusName, productName, user, authLoading, ordersLoading } = useStore();
  const order = orders.find((item) => item.id === id);
  const [deliveryMessageDraft, setDeliveryMessageDraft] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [isSavingMessage, setIsSavingMessage] = useState(false);
  const deliveryMessage = deliveryMessageDraft ?? order?.deliveryMessage ?? '';

  async function submitDeliveryMessage() {
    if (isSavingMessage) return;
    setMessageError('');
    setIsSavingMessage(true);
    try {
      await saveDeliveryMessage(order.id, deliveryMessage);
      setDeliveryMessageDraft(null);
    } catch (error) {
      setMessageError(getApiErrorMessage(error));
    } finally {
      setIsSavingMessage(false);
    }
  }

  if (!order && (authLoading || ordersLoading)) {
    return (
      <Page style={styles.missing}>
        <Notice>{t('loadingOrders')}</Notice>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page style={styles.missing}>
        <Text accessibilityRole="button" onPress={() => router.replace('/(tabs)/orders')} style={styles.back}>‹  {t('orders')}</Text>
        <Notice>{t('unavailableOrder')}</Notice>
        <Button title={t('orders')} onPress={() => router.replace('/(tabs)/orders')} />
      </Page>
    );
  }

  const activeIndex = ORDER_STATUSES.indexOf(order.status);
  const complete = activeIndex === ORDER_STATUSES.length - 1;

  return (
    <Page style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹  {t('orders')}</Text>
        <Text style={styles.eyebrow}>{t('yourOrder')}</Text>
        <Heading style={styles.title}>{t('trackYourOrder')}</Heading>
        <View style={styles.orderCard}>
          <View style={styles.orderTop}>
            <View>
              <Text style={styles.label}>{t('orderNumber')}</Text>
              <Text style={styles.orderId}>{order.id}</Text>
            </View>
            <Text style={styles.status}>{statusName(order.status)}</Text>
          </View>
          <Text style={styles.date}>Placed {new Date(order.date).toLocaleDateString()}</Text>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.sectionTitle}>{t('deliveryProgress')}</Text>
          {ORDER_STATUSES.map((status, index) => {
            const done = index <= activeIndex;
            const current = index === activeIndex;
            return (
              <View key={status} style={styles.step}>
                <View style={styles.markerColumn}>
                  <View style={[styles.marker, done && styles.markerDone]}><Text style={styles.markerText}>{done ? '✓' : ''}</Text></View>
                  {index < ORDER_STATUSES.length - 1 ? <View style={[styles.connector, index < activeIndex && styles.connectorDone]} /> : null}
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, current && styles.stepCurrent]}>{statusName(status)}</Text>
                  <Text style={styles.stepHint}>
                    {current ? t('currentStatus') : done ? t('completed') : t('nextStep')}
                  </Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.demoNote}>{t('trackingManagedByStore')}</Text>
          {complete ? <Notice>{t('finalStatus')}</Notice> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <Text style={styles.detail}>{order.customer?.name || 'Demo customer'}</Text>
          <Text style={styles.subDetail}>{order.delivery?.address}, {order.delivery?.city}</Text>
          <Text style={styles.subDetail}>{order.delivery?.phone}</Text>
          <Text style={styles.payment}>Payment: {order.paymentMethod}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items · {formatPrice(order.total)}</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemName}>{item.quantity} × {productName(item)}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>
        {complete && user?.role === 'customer' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('deliveryConfirmation')}</Text>
            <Text style={styles.messageHelp}>{t('deliveryMessageHelp')}</Text>
            <TextInput
              accessibilityLabel={t('deliveryMessagePlaceholder')}
              value={deliveryMessage}
              onChangeText={setDeliveryMessageDraft}
              placeholder={t('deliveryMessagePlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={styles.messageInput}
            />
            {order.deliveryMessage && deliveryMessage === order.deliveryMessage
              ? <Notice>{t('deliveryMessageSaved')}</Notice>
              : null}
            {messageError ? <Notice error>{messageError}</Notice> : null}
            <Button
              title={t(order.deliveryMessage ? 'updateDeliveryMessage' : 'sendDeliveryMessage')}
              disabled={!deliveryMessage.trim() || isSavingMessage}
              onPress={submitDeliveryMessage}
            />
          </View>
        ) : null}
        <Button title={t('shopNow')} secondary onPress={() => router.replace('/(tabs)/shop')} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  back: { color: colors.oliveDark, fontSize: 13, fontWeight: '600', paddingVertical: 9, marginBottom: 12 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 28, marginTop: 6, marginBottom: 18 },
  orderCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 14 },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 10 },
  orderId: { color: colors.ink, fontWeight: '700', fontSize: 15, marginTop: 4 },
  status: { color: colors.oliveDark, backgroundColor: '#EDF0E6', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, fontSize: 10, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 11, marginTop: 9 },
  trackingCard: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 14 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 16 },
  step: { minHeight: 56, flexDirection: 'row' },
  markerColumn: { width: 25, alignItems: 'center' },
  marker: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.line, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  markerDone: { backgroundColor: colors.olive, borderColor: colors.olive },
  markerText: { color: 'white', fontSize: 11, fontWeight: '800' },
  connector: { width: 2, flex: 1, backgroundColor: colors.line, marginVertical: 3 },
  connectorDone: { backgroundColor: colors.olive },
  stepCopy: { paddingLeft: 11, paddingTop: 1, flex: 1 },
  stepTitle: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  stepCurrent: { color: colors.oliveDark, fontWeight: '800' },
  stepHint: { color: colors.muted, fontSize: 9, marginTop: 4 },
  demoNote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3, marginBottom: 13 },
  advanceButton: { minHeight: 46 },
  section: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 16, marginBottom: 14 },
  detail: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  subDetail: { color: colors.muted, fontSize: 11, marginTop: 5 },
  payment: { color: colors.oliveDark, fontSize: 10, fontWeight: '600', marginTop: 11 },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  itemName: { color: colors.muted, fontSize: 11, flex: 1, paddingRight: 8 },
  itemPrice: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  messageHelp: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 12 },
  messageInput: { minHeight: 110, borderRadius: 13, padding: 13, color: colors.ink, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, fontSize: 14, marginBottom: 14 },
  missing: { justifyContent: 'center' },
});
