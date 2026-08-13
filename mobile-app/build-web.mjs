/**
 * build-web.mjs — Script build + patch untuk Expo web
 * 
 * Masalah: Firebase Hosting tidak serve file di path yang mengandung '@'
 * (dari @expo/vector-icons). Font di /assets/node_modules/@expo/... 
 * dapat index.html, bukan binary font.
 * 
 * Solusi:
 * 1. expo export --platform web (build normal)
 * 2. Copy font ke /fonts/ (path bersih tanpa @)  
 * 3. Inject @font-face CSS ke index.html untuk override font loading
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const FONTS_SRC = join(DIST, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const FONTS_DST = join(DIST, 'fonts');

// Step 1: Build
console.log('📦 Building Expo web...');
execSync('npx expo export --platform web', { stdio: 'inherit' });

// Step 2: Copy fonts ke path bersih
console.log('🔤 Copying fonts to /fonts/...');
if (existsSync(FONTS_SRC)) {
  mkdirSync(FONTS_DST, { recursive: true });
  const files = readdirSync(FONTS_SRC).filter(f => f.endsWith('.ttf'));
  for (const file of files) {
    const simpleName = file.split('.')[0] + '.ttf';
    copyFileSync(join(FONTS_SRC, file), join(FONTS_DST, simpleName));
    console.log(`  Copied: ${file} → fonts/${simpleName}`);
  }
}

// Step 3: Patch index.html dengan CSS @font-face override
console.log('🩹 Patching index.html with font overrides...');
const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');

// Daftar semua icon fonts yang perlu di-override
const fontFamilies = [
  'AntDesign', 'Entypo', 'EvilIcons', 'Feather', 'FontAwesome',
  'FontAwesome5_Brands', 'FontAwesome5_Regular', 'FontAwesome5_Solid',
  'FontAwesome6_Brands', 'FontAwesome6_Regular', 'FontAwesome6_Solid',
  'Fontisto', 'Foundation', 'Ionicons', 'MaterialCommunityIcons',
  'MaterialIcons', 'Octicons', 'SimpleLineIcons', 'Zocial',
];

const cssRules = fontFamilies
  .filter(name => existsSync(join(FONTS_DST, `${name}.ttf`)))
  .map(name => `    @font-face { font-family: '${name}'; src: url('/fonts/${name}.ttf') format('truetype'); font-display: swap; }`)
  .join('\n');

const fontStyleTag = `  <!-- Font override: /fonts/ path agar tidak di-rewrite oleh Firebase Hosting -->
  <style>
${cssRules}
  </style>`;

html = html.replace('</head>', `${fontStyleTag}\n</head>`);
writeFileSync(indexPath, html, 'utf8');

console.log('✅ Build + patch selesai!');
console.log('   Deploy: firebase deploy --only hosting --project edutech-smk');
