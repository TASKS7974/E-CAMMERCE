import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../data/products';
import { colors } from './ui';
import { useStore } from '../store/StoreProvider';

export default function ProductCard({ product, onPress, onAdd }) {
  const { categoryName, productName, t } = useStore();
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('view')} ${productName(product)}`} onPress={onPress}>
        <View style={[styles.image, { backgroundColor: product.color }]}>
          <Text style={styles.emoji}>{product.emoji}</Text>
          <Image source={product.image} style={styles.photo} contentFit="cover" transition={150} />
          {product.tag ? <Text style={styles.tag}>{product.tag}</Text> : null}
          <Text style={styles.rating}>★ {product.rating}</Text>
        </View>
        <Text style={styles.category}>{categoryName(product.category).toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>{productName(product)}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('add')} ${productName(product)} ${t('toBag')}`} onPress={onAdd} style={styles.add}>
        <Text style={styles.addText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48.2%', marginBottom: 20, position: 'relative' },
  image: { aspectRatio: 0.91, borderRadius: 17, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  photo: { ...StyleSheet.absoluteFillObject, borderRadius: 17 },
  emoji: { fontSize: 72 },
  tag: { position: 'absolute', left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.88)', color: colors.ink, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  rating: { position: 'absolute', bottom: 10, right: 10, fontSize: 11, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.88)', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 9, overflow: 'hidden' },
  category: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 11 },
  name: { color: colors.ink, fontSize: 14, fontWeight: '600', lineHeight: 19, marginTop: 4, paddingRight: 25 },
  price: { color: colors.ink, fontSize: 12, fontWeight: '700', marginTop: 6 },
  add: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.olive, position: 'absolute', right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  addText: { color: 'white', fontSize: 22, lineHeight: 25, fontWeight: '400' },
});
