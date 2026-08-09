const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo sudah aktifkan unstable_enablePackageExports = true
// Tapi unstable_conditionNames kosong — Metro tidak tahu pakai kondisi 'react-native'
// Akibatnya @firebase/auth tidak di-resolve ke dist/rn/index.js
//
// FIX: tambahkan 'react-native' ke conditionNames
// Sehingga @firebase/auth → dist/rn/index.js (ada getReactNativePersistence)
config.resolver.unstable_conditionNames = [
  'react-native',
  'require',
  'default',
];

config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

module.exports = config;
