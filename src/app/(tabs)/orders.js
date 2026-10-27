import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Heading, Notice, Page } from '../../components/ui';
import { formatPrice } from '../../data/products';
import { useStore } from '../../store/StoreProvider';
import { createPurchaseSummaryCsv } from '../../utils/purchaseSummary';
import { downloadPurchaseSummary } from '../../utils/purchaseSummaryDownload';

export default function OrdersScreen() {
  const { orders, t, user, statusName, productName, ordersLoading, authLoading, storeError } = useStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadReady, setDownloadReady] = useState(false);

  async function downloadSummary() {
    setIsDownloading(true);
    setDownloadError('');
    setDownloadReady(false);
    try {
      const csv = createPurchaseSummaryCsv(orders, { productName, statusName });
      await downloadPurchaseSummary(csv);
      setDownloadReady(true);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? `${t('purchaseSummaryError')}: ${error.message}`
          : t('purchaseSummaryError'),
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{t('orderDetails')}</Text>
        <Heading style={styles.title}>{t('orders')}</Heading>
        {storeError ? <Notice error>{storeError}</Notice> : null}
        {user && orders.length ? (
          <View style={styles.summaryActions}>
            <Button
              title={t('downloadPurchaseSummary')}
              secondary
              disabled={isDownloading}
              onPress={downloadSummary}
            />
            {downloadReady ? <Notice>{t('purchaseSummaryReady')}</Notice> : null}
            {downloadError ? <Notice error>{downloadError}</Notice> : null}
          </View>
        ) : null}
        {authLoading ? (
          <View style={styles.empty}><Text style={styles.copy}>{t('checkingAccount')}</Text></View>
        ) : !user ? (
          <View style={styles.empty}>
            <Text style={styles.icon}>✦</Text>
            <Heading style={styles.emptyTitle}>{t('ordersOnePlace')}</Heading>
            <Text style={styles.copy}>{t('signInOrderHistory')}</Text>
            <Button title={t('login')} onPress={() => router.push('/auth/login')} style={styles.button} />
          </View>
        ) : ordersLoading ? (
          <View style={styles.empty}><Text style={styles.copy}>{t('loadingOrders')}</Text></View>
        ) : orders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.icon}>📦</Text>
            <Heading style={styles.emptyTitle}>{t('emptyOrders')}</Heading>
            <Text style={styles.copy}>{t('ordersLoveCopy')}</Text>
            <Button title={t('shopNow')} onPress={() => router.replace('/(tabs)/shop')} style={styles.button} />
          </View>
        ) : orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.smallLabel}>{t('order')}</Text>
                <Text style={styles.orderId}>{order.id}</Text>
              </View>
              <Text style={styles.status}>{statusName(order.status)}</Text>
            </View>
            <Text style={styles.date}>{new Date(order.date).toLocaleDateString()}</Text>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.copy}>{order.items.length} {t('product')}{order.items.length === 1 ? '' : ` ${t('items')}`}</Text>
              <Text style={styles.total}>{formatPrice(order.total)}</Text>
            </View>
            <Text accessibilityRole="button" onPress={() => router.push(`/orders/${order.id}`)} style={styles.details}>{t('trackOrder')}  →</Text>
          </View>
        ))}
        <Text style={styles.demoText}>{t('orderHistoryCloudNote')}</Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 24, flexGrow: 1 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 30, marginTop: 7, marginBottom: 22 },
  summaryActions: { marginBottom: 18 },
  empty: { flex: 1, minHeight: 410, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 43, marginBottom: 18 },
  emptyTitle: { textAlign: 'center', fontSize: 21, maxWidth: 270 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  button: { marginTop: 22, alignSelf: 'stretch' },
  card: { backgroundColor: 'white', borderRadius: 17, padding: 16, marginBottom: 13, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  orderId: { color: colors.ink, fontWeight: '700', fontSize: 14, marginTop: 4 },
  status: { color: colors.oliveDark, backgroundColor: '#EDF0E6', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, fontSize: 10, fontWeight: '700' },
  date: { color: colors.muted, fontSize: 11, marginTop: 7 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
  total: { color: colors.ink, fontWeight: '700', fontSize: 12 },
  details: { color: colors.oliveDark, fontWeight: '700', fontSize: 12, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  demoText: { textAlign: 'center', color: colors.muted, fontSize: 10, marginTop: 'auto', paddingVertical: 20 },
});
