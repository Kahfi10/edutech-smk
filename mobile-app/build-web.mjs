/**
 * build-web.mjs — Script build + patch untuk Expo web
 *
 * Masalah: Firebase Hosting tidak serve file di path yang mengandung '@'
 * Path: /assets/node_modules/@expo/vector-icons/... → HTML bukan font!
 *
 * Solusi:
 * 1. expo export --platform web
 * 2. Copy font ke /fonts/ (path bersih tanpa @)
 * 3. PATCH JS BUNDLE: replace URL font @expo → /fonts/FontName.ttf
 * 4. Inject @font-face CSS ke index.html sebagai backup
 */

import { execSync } from 'child_process';
import {
  readFileSync, writeFileSync, mkdirSync, copyFileSync,
  existsSync, readdirSync,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST      = join(__dirname, 'dist');
const FONTS_SRC = join(DIST, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const FONTS_DST = join(DIST, 'fonts');

const FONT_NAMES = [
  'AntDesign','Entypo','EvilIcons','Feather','FontAwesome',
  'FontAwesome5_Brands','FontAwesome5_Regular','FontAwesome5_Solid',
  'FontAwesome6_Brands','FontAwesome6_Regular','FontAwesome6_Solid',
  'Fontisto','Foundation','Ionicons','MaterialCommunityIcons',
  'MaterialIcons','Octicons','SimpleLineIcons','Zocial',
];

// ─── Step 1: Build ────────────────────────────────────────────────
console.log('\n📦 Step 1: Building Expo web...');
execSync('npx expo export --platform web', { stdio: 'inherit' });

// ─── Step 2: Copy fonts ke /fonts/ ───────────────────────────────
console.log('\n🔤 Step 2: Copying fonts to /fonts/...');
if (existsSync(FONTS_SRC)) {
  mkdirSync(FONTS_DST, { recursive: true });
  for (const file of readdirSync(FONTS_SRC).filter(f => f.endsWith('.ttf'))) {
    const simpleName = file.split('.')[0] + '.ttf';
    copyFileSync(join(FONTS_SRC, file), join(FONTS_DST, simpleName));
    console.log(`  ✓ ${file} → fonts/${simpleName}`);
  }
} else {
  console.warn('  ⚠ Font source not found:', FONTS_SRC);
}

// ─── Step 3: Patch JS bundles ─────────────────────────────────────
console.log('\n🔧 Step 3: Patching JS bundles (replace @expo font URLs)...');
const jsDir = join(DIST, '_expo/static/js/web');
if (existsSync(jsDir)) {
  for (const file of readdirSync(jsDir).filter(f => f.endsWith('.js'))) {
    const filePath = join(jsDir, file);
    let content = readFileSync(filePath, 'utf8');
    let patched  = 0;

    for (const name of FONT_NAMES) {
      const pattern = new RegExp(
        `"/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/${name}\\.[a-f0-9]+\\.ttf"`,
        'g'
      );
      const replacement = `"/fonts/${name}.ttf"`;
      const newContent  = content.replace(pattern, replacement);
      if (newContent !== content) { patched++; content = newContent; }
    }

    if (patched > 0) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ ${file}: patched ${patched} font URL(s)`);
    }
  }
}

// ─── Step 4: Patch index.html dengan CSS @font-face ──────────────
console.log('\n🩹 Step 4: Patching index.html with @font-face CSS...');
const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');

const cssRules = FONT_NAMES
  .filter(n => existsSync(join(FONTS_DST, `${n}.ttf`)))
  .map(n => `    @font-face { font-family: '${n}'; src: url('/fonts/${n}.ttf') format('truetype'); font-display: swap; }`)
  .join('\n');

const fontTag = `  <!-- Font override: /fonts/ agar Firebase Hosting tidak return index.html -->\n  <style>\n${cssRules}\n  </style>`;

if (!html.includes('Font override')) {
  html = html.replace('</head>', `${fontTag}\n</head>`);
  writeFileSync(indexPath, html, 'utf8');
  console.log('  ✓ index.html patched');
} else {
  console.log('  ✓ index.html already patched');
}

console.log('\n✅ Build + patch selesai!');
console.log('   Deploy app  : firebase deploy --only hosting:app --project edutech-smk');
console.log('   Deploy admin: firebase deploy --only hosting:admin --project edutech-smk');
