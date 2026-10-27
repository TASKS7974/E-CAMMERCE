import React from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, colors, Heading, Page } from '../../components/ui';
import { formatPrice } from '../../data/products';
import { useStore } from '../../store/StoreProvider';

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, t, categoryName, productName } = useStore();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = cart.length ? 2000 : 0;

  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t('yourPicks')}</Text>
        <View style={styles.titleRow}>
          <Heading style={styles.title}>{t('cart')}</Heading>
          <Text style={styles.count}>{cart.reduce((sum, item) => sum + item.quantity, 0)} {t('items')}</Text>
        </View>
        {cart.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Heading style={styles.emptyTitle}>{t('emptyCart')}</Heading>
            <Text style={styles.emptyText}>{t('emptyCartBrowse')}</Text>
            <Button title={t('shopNow')} onPress={() => router.replace('/(tabs)/shop')} style={styles.shopButton} />
          </View>
        ) : (
          <>
            {cart.map((item) => (
              <View key={item.id} style={styles.item}>
                <View style={[styles.thumb, { backgroundColor: item.color }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Image source={item.image} style={styles.photo} contentFit="cover" transition={150} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.category}>{categoryName(item.category)}</Text>
                  <Text style={styles.name}>{productName(item)}</Text>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                  <View style={styles.controls}>
                    <Text accessibilityRole="button" onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.control}>−</Text>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Text accessibilityRole="button" onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.control}>+</Text>
                  </View>
                </View>
                <View style={styles.side}>
                  <Text accessibilityRole="button" onPress={() => removeFromCart(item.id)} style={styles.remove}>×</Text>
                  <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.summary}>
              <View style={styles.summaryRow}><Text style={styles.label}>{t('subtotal')}</Text><Text style={styles.value}>{formatPrice(subtotal)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.label}>{t('delivery')}</Text><Text style={styles.value}>{formatPrice(delivery)}</Text></View>
              <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>{t('total')}</Text><Text style={styles.totalValue}>{formatPrice(subtotal + delivery)}</Text></View>
              <Text style={styles.demoText}>{t('demoCheckout')}</Text>
            </View>
            <Button title={t('checkout')} onPress={() => router.push('/checkout')} />
          </>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 28 },
  eyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6, marginBottom: 7 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  title: { fontSize: 30 },
  count: { color: colors.muted, fontSize: 12 },
  empty: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 52, marginBottom: 20 },
  emptyTitle: { fontSize: 20, textAlign: 'center', maxWidth: 260 },
  emptyText: { color: colors.muted, fontSize: 13, marginTop: 8, marginBottom: 20 },
  shopButton: { minWidth: 200 },
  item: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 82, height: 94, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  photo: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  emoji: { fontSize: 39 },
  info: { flex: 1, paddingLeft: 13, paddingTop: 2 },
  category: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  name: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 5 },
  price: { color: colors.ink, fontWeight: '700', fontSize: 12, marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-start', borderRadius: 9, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line },
  control: { paddingHorizontal: 9, paddingVertical: 4, color: colors.ink, fontSize: 17 },
  quantity: { color: colors.ink, fontSize: 11, minWidth: 18, textAlign: 'center' },
  side: { justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 1 },
  remove: { color: colors.muted, fontSize: 21, lineHeight: 21, paddingHorizontal: 4 },
  lineTotal: { color: colors.ink, fontWeight: '700', fontSize: 11 },
  summary: { backgroundColor: 'white', borderRadius: 16, marginTop: 22, marginBottom: 18, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  label: { color: colors.muted, fontSize: 12 },
  value: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 12 },
  totalLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  totalValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  demoText: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 12 },
});
