import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useCanGoBack } from 'expo-router';
import { Button, colors, Heading, Page } from './ui';
import { formatPrice } from '../data/products';
import { ORDER_STATUSES, useStore } from '../store/StoreProvider';

export default function ReportsScreen({ showBack = true }) {
  const canGoBack = useCanGoBack();
  const { orders, t, statusName, ordersLoading, storeError } = useStore();
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const productCount = orders.reduce((sum, order) => (
    sum + order.items.reduce((count, item) => count + item.quantity, 0)
  ), 0);
  const deliveredCount = orders.filter((order) => order.status === 'Delivered').length;

  function returnToProfile() {
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  }

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showBack ? (
          <Text accessibilityRole="button" onPress={returnToProfile} style={styles.back}>‹  {t('backToProfile')}</Text>
        ) : null}
        <Text style={styles.eyebrow}>D&G · {t('reportsEyebrow')}</Text>
        <Heading style={styles.title}>{t('reports')}</Heading>
        <Text style={styles.copy}>{t('reportsCopy')}</Text>
        {storeError ? <Text style={styles.error}>{storeError}</Text> : null}
        {ordersLoading ? <Text style={styles.copy}>{t('loadingOrders')}</Text> : null}
        <View style={styles.metric}>
          <Text style={styles.label}>{t('revenue')}</Text>
          <Text style={styles.value}>{formatPrice(revenue)}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.smallMetric}><Text style={styles.label}>{t('ordersMetric')}</Text><Text style={styles.smallValue}>{orders.length}</Text></View>
          <View style={[styles.smallMetric, styles.lastSmallMetric]}><Text style={styles.label}>{t('itemsMetric')}</Text><Text style={styles.smallValue}>{productCount}</Text></View>
        </View>
        <View style={styles.metric}>
          <Text style={styles.label}>{t('deliveredMetric')}</Text>
          <Text style={styles.smallValue}>{deliveredCount}</Text>
        </View>
        <View style={styles.statusSummary}>
          <Text style={styles.statusHeading}>{t('orderStatusSummary')}</Text>
          {ORDER_STATUSES.map((status) => (
            <View key={status} style={styles.statusRow}>
              <Text style={styles.statusName}>{statusName(status)}</Text>
              <Text style={styles.statusCount}>{orders.filter((order) => order.status === status).length}</Text>
            </View>
          ))}
        </View>
        {orders.length === 0 ? <Text style={styles.empty}>{t('reportsEmpty')}</Text> : null}
        <Text style={styles.note}>{t('reportsNote')}</Text>
        <Button title={t('viewOrders')} secondary onPress={() => router.replace('/(tabs)/orders')} style={styles.button} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 15, paddingBottom: 28 },
  back: { color: colors.oliveDark, fontSize: 13, fontWeight: '600', paddingVertical: 9, marginBottom: 13 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 29, marginTop: 6 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 20 },
  metric: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 17, marginBottom: 11 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  value: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 11 },
  smallMetric: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 17, marginRight: 11 },
  lastSmallMetric: { marginRight: 0 },
  smallValue: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 8 },
  statusSummary: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 17, marginBottom: 11 },
  statusHeading: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line },
  statusName: { color: colors.muted, fontSize: 12 },
  statusCount: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 12, textAlign: 'center', padding: 20 },
  error: { color: colors.red, fontSize: 12, marginBottom: 12 },
  note: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 },
  button: { marginTop: 18 },
});
