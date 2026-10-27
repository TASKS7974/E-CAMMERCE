import React, { useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, colors, Heading, Notice, Page } from '../../components/ui';
import { formatPrice } from '../../data/products';
import { useStore } from '../../store/StoreProvider';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { products, addToCart, t, productName, productsLoading, storeError } = useStore();
  const product = products.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <Page style={styles.missing}>
        <Text accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹  {t('backToShop')}</Text>
        <View style={styles.missingBody}>
          {productsLoading ? (
            <Notice>{t('loadingProducts')}</Notice>
          ) : storeError ? (
            <Notice error>{storeError}</Notice>
          ) : (
            <>
              <Heading>{t('productNotFound')}</Heading>
              <Text style={styles.description}>{t('productNotFoundCopy')}</Text>
            </>
          )}
          <Button title={t('shopNow')} onPress={() => router.replace('/(tabs)/shop')} />
        </View>
      </Page>
    );
  }

  return (
    <Page style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹  Back to shop</Text>
        <View style={[styles.image, { backgroundColor: product.color }]}>
          <Text style={styles.emoji}>{product.emoji}</Text>
          <Image source={product.image} style={styles.photo} contentFit="cover" transition={150} />
          {product.tag ? <Text style={styles.tag}>{product.tag}</Text> : null}
          <Text style={styles.rating}>★ {product.rating} · {t('customerFavourite')}</Text>
        </View>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Heading style={styles.name}>{productName(product)}</Heading>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.description}>
          {t('productDescription')}
        </Text>
        <View style={styles.details}>
          <Text style={styles.detailTitle}>{t('theDetails')}</Text>
          <Text style={styles.detailCopy}>{t('rwandaSample')}</Text>
        </View>
        <View style={styles.actionRow}>
          <View style={styles.quantity}>
            <Text accessibilityRole="button" accessibilityLabel={t('decreaseQuantity')} onPress={() => setQuantity((current) => Math.max(1, current - 1))} style={styles.quantityButton}>−</Text>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Text accessibilityRole="button" accessibilityLabel={t('increaseQuantity')} onPress={() => setQuantity((current) => current + 1)} style={styles.quantityButton}>＋</Text>
          </View>
          <Button title={`${t('add')} · ${formatPrice(product.price * quantity)}`} onPress={() => {
            addToCart(product, quantity);
            setAdded(true);
          }} style={styles.addButton} />
        </View>
        {added ? (
          <View style={styles.addedNotice}>
            <Notice>{t('added')}</Notice>
            <Text accessibilityRole="button" onPress={() => router.push('/(tabs)/cart')} style={styles.viewBag}>{t('viewYourBag')}  →</Text>
          </View>
        ) : null}
        <Text style={styles.demo}>{t('demoProduct')}</Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  back: { color: colors.oliveDark, fontSize: 13, fontWeight: '600', paddingVertical: 10, marginBottom: 8 },
  image: { aspectRatio: 1.05, width: '100%', borderRadius: 21, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  photo: { ...StyleSheet.absoluteFillObject, borderRadius: 21 },
  emoji: { fontSize: 112 },
  tag: { position: 'absolute', top: 15, left: 15, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.88)', color: colors.ink, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  rating: { position: 'absolute', right: 13, bottom: 13, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden', fontSize: 10 },
  category: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 22 },
  name: { fontSize: 26, lineHeight: 32, marginTop: 6 },
  price: { color: colors.ink, fontSize: 16, fontWeight: '700', marginTop: 9 },
  description: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 14 },
  details: { backgroundColor: 'white', borderRadius: 14, padding: 15, marginTop: 20 },
  detailTitle: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  detailCopy: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  quantity: { height: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: 'white', marginRight: 10 },
  quantityButton: { color: colors.ink, fontSize: 18, paddingHorizontal: 13, paddingVertical: 12 },
  quantityValue: { color: colors.ink, fontSize: 13, minWidth: 15, textAlign: 'center' },
  addButton: { flex: 1 },
  addedNotice: { marginTop: 14 },
  viewBag: { color: colors.oliveDark, textAlign: 'center', fontSize: 12, fontWeight: '700', padding: 10 },
  demo: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 20 },
  missing: { justifyContent: 'center' },
  missingBody: { marginTop: 16 },
});
