const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Prioritaskan react-native field di package.json
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Force @firebase/auth ke RN bundle saat platform bukan web
// Ini menyelesaikan "Component auth has not been registered yet" di Expo Go
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/auth' && platform !== 'web') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@firebase/auth/dist/rn/index.js'
      ),
      type: 'sourceFile',
    };
  }
  // Default resolution untuk semua modul lainnya
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
