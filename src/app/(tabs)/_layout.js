import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useStore } from '../../store/StoreProvider';
import { colors } from '../../components/ui';

const ICONS = { shop: '⌂', orders: '▤', cart: '◇', 'reports-summary': '▥', profile: '◉' };

export default function TabLayout() {
  const { t, cart } = useStore();
  const labels = {
    shop: t('shop'),
    orders: t('orders'),
    cart: t('cart'),
    'reports-summary': t('reportsTab'),
    profile: t('profile'),
  };

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#000000',
      tabBarStyle: { height: 84, paddingTop: 9, paddingBottom: 19, borderTopColor: colors.line, backgroundColor: '#FFFFFF' },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      {Object.keys(ICONS).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: labels[name],
            tabBarBadge: name === 'cart' && cart.length ? cart.reduce((sum, item) => sum + item.quantity, 0) : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.olive, color: 'white', fontSize: 9 },
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22, lineHeight: 25 }}>{ICONS[name]}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
