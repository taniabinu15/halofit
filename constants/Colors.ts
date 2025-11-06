// HaloFit Brand Colors - Hot Pink Cute Theme ✨💕
const tintColorLight = '#FF1493'; // Deep hot pink!
const tintColorDark = '#FF69B4'; // Hot pink for dark mode

export const HaloFitColors = {
  // Primary Hot Pink Shades 💖
  primary: '#FF1493',        // Deep hot pink - main color!
  primaryLight: '#FF69B4',   // Hot pink
  primaryDark: '#C71585',    // Medium violet red
  
  // Accent Pinks & Purples 💕
  accent: '#FFB6C1',         // Light pink
  accentLight: '#FFF0F5',    // Lavender blush - super soft!
  accentPurple: '#DA70D6',   // Orchid purple
  accentCoral: '#FF6B9D',    // Coral pink
  
  // Cute Gradients 🌸
  gradientStart: '#FF1493',  // Hot pink
  gradientMiddle: '#FF69B4', // Hot pink light
  gradientEnd: '#FFB6C1',    // Light pink
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#F5F5F5',
  grayDark: '#424242',
  
  // Backgrounds - soft & cute! 🎀
  background: '#FFF0F5',       // Lavender blush
  cardBackground: '#FFFFFF',   // Pure white for contrast
  
  // Text
  textPrimary: '#2D2D2D',
  textSecondary: '#757575',
  textLight: '#B0B0B0',
  
  // Fun accents! ✨
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF1744',
};

const tintColorLightPink = HaloFitColors.primary;
const tintColorDarkPink = HaloFitColors.primaryLight;

export default {
  light: {
    text: HaloFitColors.textPrimary,
    background: HaloFitColors.background,
    tint: tintColorLightPink,
    tabIconDefault: HaloFitColors.gray,
    tabIconSelected: tintColorLightPink,
  },
  dark: {
    text: HaloFitColors.white,
    background: '#1A0A12', // Dark pink-ish background
    tint: tintColorDarkPink,
    tabIconDefault: HaloFitColors.gray,
    tabIconSelected: tintColorDarkPink,
  },
};
