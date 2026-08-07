const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Pastikan Firebase RN bundle dipakai (bukan web bundle)
// Firebase pakai field 'react-native' di package.json untuk RN bundle
config.resolver.resolverMainFields = [
  'react-native',
  'browser',
  'main',
];

module.exports = config;
