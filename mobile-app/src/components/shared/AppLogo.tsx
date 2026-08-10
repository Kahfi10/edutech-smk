import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, G, Text as SvgText } from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
}

/**
 * EduTech SMK Logo
 * Icon: Buku terbuka dengan sinyal WiFi di atas = digital learning
 */
export const AppLogo: React.FC<AppLogoProps> = ({ size = 56, variant = 'icon' }) => {
  const s = size;
  const r = s * 0.22; // border radius

  return (
    <View style={[styles.container, { width: s, height: s, borderRadius: r }]}>
      <Svg width={s * 0.65} height={s * 0.65} viewBox="0 0 40 40" fill="none">
        {/* Buku terbuka — kiri */}
        <Path
          d="M4 8C4 7.45 4.45 7 5 7H17C18.1 7 19 7.9 19 9V31C19 31 15 30 11 30C8.2 30 5.5 30.8 4 31.5V8Z"
          fill="white"
          opacity="0.9"
        />
        {/* Buku terbuka — kanan */}
        <Path
          d="M36 8C36 7.45 35.55 7 35 7H23C21.9 7 21 7.9 21 9V31C21 31 25 30 29 30C31.8 30 34.5 30.8 36 31.5V8Z"
          fill="white"
          opacity="0.9"
        />
        {/* Garis tengah buku */}
        <Path d="M19 9V31" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        {/* Garis halaman kiri */}
        <Path d="M7 12H16M7 16H16M7 20H14" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Garis halaman kanan */}
        <Path d="M33 12H24M33 16H24M33 20H26" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sinyal WiFi — digital learning */}
        <Path d="M20 4C22.5 4 24.8 4.8 26.6 6.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <Path d="M20 4C17.5 4 15.2 4.8 13.4 6.2" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <Circle cx="20" cy="4" r="1.5" fill="white" opacity="0.9" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1D1D1F',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
