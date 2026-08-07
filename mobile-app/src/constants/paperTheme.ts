import { MD3LightTheme } from 'react-native-paper';
import { Colors } from './theme';

export const PaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:            Colors.black,
    primaryContainer:   Colors.gray11,
    secondary:          Colors.gray3,
    secondaryContainer: Colors.gray10,
    tertiary:           Colors.gray5,
    error:              Colors.gray1,
    errorContainer:     Colors.gray11,
    background:         Colors.background,
    surface:            Colors.cardBackground,
    surfaceVariant:     Colors.gray11,
    onPrimary:          Colors.white,
    onSecondary:        Colors.white,
    onBackground:       Colors.label,
    onSurface:          Colors.label,
    outline:            Colors.separator,
    outlineVariant:     Colors.gray10,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: Colors.white,
      level2: Colors.white,
    },
  },
  roundness: 12,
};
