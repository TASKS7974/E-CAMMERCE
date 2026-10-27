module.exports = ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: config.ios?.bundleIdentifier || 'com.dgshop.ecommerce',
    },
    android: {
      ...config.android,
      package: config.android?.package || 'com.dgshop.ecommerce',
    },
    plugins: [
      ...(config.plugins || []).filter((plugin) => (
        (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-secure-store'
      )),
      ['expo-secure-store', { configureAndroidBackup: true }],
    ],
  };
};
