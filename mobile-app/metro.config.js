const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

const RN_AUTH_BUNDLE = path.resolve(
  __dirname,
  'node_modules/@firebase/auth/dist/rn/index.js'
);

// Map KEDUA nama modul Firebase Auth ke RN bundle saat platform bukan web
// - 'firebase/auth'  → static import di config.ts
// - '@firebase/auth' → re-export internal dari firebase/auth
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web') {
    if (
      moduleName === 'firebase/auth' ||
      moduleName === '@firebase/auth'
    ) {
      return { filePath: RN_AUTH_BUNDLE, type: 'sourceFile' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
