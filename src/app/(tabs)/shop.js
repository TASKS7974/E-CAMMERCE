import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import ProductCard from '../../components/ProductCard';
import { Button, colors, Heading, Notice, Page } from '../../components/ui';
import { CATEGORIES } from '../../data/products';
import { useStore } from '../../store/StoreProvider';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'rw', label: 'RW', name: 'Ikinyarwanda' },
];

export default function StorefrontScreen() {
  const {
    products,
    addToCart,
    language,
    setLanguage,
    t,
    categoryName,
    productName,
    productsLoading,
    storeError,
  } = useStore();
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [under25, setUnder25] = useState(false);
  const filtered = useMemo(() => products.filter((product) => (
    (category === 'All' || product.category === category)
    && productName(product).toLowerCase().includes(query.trim().toLowerCase())
    && (!under25 || product.price < 25000)
  )), [products, category, query, under25, productName]);

  return (
    <Page style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topline}>
          <View>
            <Text style={styles.brand}>D&G <Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.location}>RWAMAGANA · RWANDA</Text>
          </View>
          <View style={styles.topActions}>
            <View style={styles.languagePicker}>
              {LANGUAGES.map((option) => {
                const selected = language === option.code;
                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch language to ${option.name}`}
                    accessibilityState={{ selected }}
                    hitSlop={4}
                    onPress={() => setLanguage(option.code)}
                    style={[styles.languageOption, selected && styles.languageOptionSelected]}
                  >
                    <Text style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.demo}><Text style={styles.demoText}>DEMO</Text></View>
          </View>
        </View>
        <Text style={styles.greeting}>{t('hello')}</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel={t('search')}
            placeholder={t('search')}
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query ? <Text onPress={() => setQuery('')} style={styles.clear}>×</Text> : null}
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerEyebrow}>THE RWANDA EDIT</Text>
            <Text style={styles.bannerTitle}>Good things,{'\n'}made to last.</Text>
            <Text style={styles.bannerSub}>Find your new favourite.</Text>
            <Button title={t('shopNow')} onPress={() => { setCategory('All'); setUnder25(false); }} style={styles.bannerButton} />
          </View>
          <Text style={styles.bannerEmoji}>🛍️</Text>
          <View style={styles.sun} />
        </View>

        <View style={styles.sectionHead}>
          <Heading>{t('featured')}</Heading>
          <Text style={styles.resultCount}>{filtered.length} {t('items')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((item) => {
            const label = item === 'All' ? t('all') : categoryName(item);
            const selected = category === item;
            return (
              <Text
                key={item}
                accessibilityRole="button"
                onPress={() => setCategory(item)}
                style={[styles.chip, selected && styles.chipActive, item !== 'All' && styles.chipSpacing]}
              >{label}</Text>
            );
          })}
        </ScrollView>
        <Text
          accessibilityRole="button"
          onPress={() => setUnder25(!under25)}
          style={[styles.priceFilter, under25 && styles.priceFilterActive]}
        >{under25 ? '✓ ' : '＋ '}{t('under25')}</Text>

        <View style={styles.grid}>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/product/${product.id}`)}
              onAdd={() => addToCart(product)}
            />
          ))}
        </View>
        {storeError ? <Notice error>{storeError}</Notice> : null}
        {productsLoading ? <Notice>{t('loadingProducts')}</Notice> : null}
        {!productsLoading && !storeError && filtered.length === 0 ? <Notice>{t('noProducts')}</Notice> : null}
        <Text style={styles.demoNote}>{t('demoCatalogue')}</Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 0 },
  topline: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { alignItems: 'flex-end' },
  languagePicker: { flexDirection: 'row', padding: 3, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: colors.line },
  languageOption: { minWidth: 36, minHeight: 34, paddingHorizontal: 8, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  languageOptionSelected: { backgroundColor: colors.ink },
  languageOptionText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  languageOptionTextSelected: { color: 'white' },
  brand: { fontSize: 31, letterSpacing: -1.5, fontWeight: '800', color: colors.ink },
  brandDot: { color: colors.olive },
  location: { fontSize: 8, letterSpacing: 1.8, fontWeight: '700', color: colors.muted, marginTop: 1 },
  demo: { borderWidth: 1, borderColor: '#D7DCCB', backgroundColor: '#EFF1EA', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 },
  demoText: { color: colors.oliveDark, fontWeight: '800', fontSize: 9, letterSpacing: 1 },
  greeting: { color: colors.muted, fontSize: 14, marginHorizontal: 20, marginTop: 20, marginBottom: 14 },
  searchBox: { height: 49, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: 'white', marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  searchIcon: { fontSize: 24, color: colors.muted, marginRight: 7 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  clear: { color: colors.muted, fontSize: 23, paddingHorizontal: 4 },
  banner: { marginHorizontal: 20, marginTop: 20, marginBottom: 28, padding: 19, height: 176, borderRadius: 20, backgroundColor: '#E6E9DD', overflow: 'hidden', flexDirection: 'row' },
  bannerCopy: { zIndex: 1, flex: 1 },
  bannerEyebrow: { color: colors.oliveDark, fontSize: 8, fontWeight: '800', letterSpacing: 1.4 },
  bannerTitle: { color: colors.ink, fontSize: 22, fontWeight: '700', lineHeight: 26, marginTop: 9, letterSpacing: -0.4 },
  bannerSub: { color: colors.muted, fontSize: 10, marginTop: 5 },
  bannerButton: { marginTop: 13, minHeight: 32, borderRadius: 10, alignSelf: 'flex-start', paddingHorizontal: 12 },
  bannerButtonText: { fontSize: 10 },
  bannerEmoji: { fontSize: 73, position: 'absolute', right: 9, bottom: 13, zIndex: 1 },
  sun: { width: 127, height: 127, borderRadius: 70, backgroundColor: '#D6DCC8', position: 'absolute', right: 4, top: 10 },
  sectionHead: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { color: colors.muted, fontSize: 11 },
  chips: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  chip: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingVertical: 9, color: colors.muted, backgroundColor: 'white', fontSize: 11, fontWeight: '600', marginRight: 8 },
  chipSpacing: { marginLeft: 0 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink, color: 'white' },
  priceFilter: { color: colors.muted, borderColor: colors.line, borderWidth: 1, backgroundColor: 'white', overflow: 'hidden', alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, marginHorizontal: 20, marginTop: 9, marginBottom: 16, fontSize: 10 },
  priceFilterActive: { color: colors.oliveDark, borderColor: '#C9D0BA', backgroundColor: '#EFF1EA' },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  demoNote: { color: colors.muted, fontSize: 10, textAlign: 'center', marginBottom: 22 },
});
