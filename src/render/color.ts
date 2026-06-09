import { ColorSchemeType, CustomColorScheme } from '../data/types';

export function parseHex(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function toHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

/**
 * Multiplies the RGB components of a hex color by a factor to shade it.
 * @param hex The source hex color (e.g., '#40c463')
 * @param factor Shading factor (e.g. 0.85 to darken, 1.15 to lighten)
 */
export function shadeHex(hex: string, factor: number): string {
  try {
    const { r, g, b } = parseHex(hex);
    return toHex(r * factor, g * factor, b * factor);
  } catch {
    return hex; // fallback to original if parsing fails
  }
}

export const LIGHT_THEMES: Record<ColorSchemeType, CustomColorScheme> = {
  github: {
    empty: '#ebedf0',
    steps: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
  emerald: {
    empty: '#f0fdf4',
    steps: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
  },
  sky: {
    empty: '#f0f9ff',
    steps: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
  },
  coral: {
    empty: '#fff5f5',
    steps: ['#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787', '#fa5252', '#f03e3e'],
  },
  amber: {
    empty: '#fffbeb',
    steps: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706'],
  },
  purple: {
    empty: '#faf5ff',
    steps: ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea'],
  },
  sunset: {
    empty: '#fff5f5',
    steps: ['#ffedd5', '#fed7aa', '#fdba74', '#f97316', '#ea580c', '#c2410c'],
  },
  grayscale: {
    empty: '#f8f9fa',
    steps: ['#e9ecef', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40'],
  },
};

export const DARK_THEMES: Record<ColorSchemeType, CustomColorScheme> = {
  github: {
    empty: '#161b22',
    steps: ['#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  emerald: {
    empty: '#022c22',
    steps: ['#064e3b', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
  },
  sky: {
    empty: '#082f49',
    steps: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8'],
  },
  coral: {
    empty: '#2d0f0f',
    steps: ['#5c1d1d', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'],
  },
  amber: {
    empty: '#271b05',
    steps: ['#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b'],
  },
  purple: {
    empty: '#240046',
    steps: ['#3c096c', '#5a189a', '#7b2cbf', '#9d4edd', '#c77dff', '#e0aaff'],
  },
  sunset: {
    empty: '#1c0d02',
    steps: ['#431407', '#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316'],
  },
  grayscale: {
    empty: '#212529',
    steps: ['#343a40', '#495057', '#6c757d', '#adb5bd', '#ced4da', '#e9ecef'],
  },
};

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = parseHex(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return toHex(r * 255, g * 255, b * 255);
}

export function rotateHue(hex: string, degree: number): string {
  try {
    const { h, s, l } = hexToHsl(hex);
    const newH = (h + degree) % 360;
    return hslToHex(newH, s, l);
  } catch {
    return hex;
  }
}

export const NEGATIVE_LIGHT_THEMES: Record<ColorSchemeType, CustomColorScheme> = {
  github: {
    empty: '#ebedf0',
    steps: ['#ffc9c9', '#ff8787', '#fa5252', '#c92a2a'],
  },
  emerald: {
    empty: '#f0fdf4',
    steps: ['#fecdd3', '#fda4af', '#f43f5e', '#e11d48', '#be123c', '#9f1239'],
  },
  sky: {
    empty: '#f0f9ff',
    steps: ['#ffedd5', '#fed7aa', '#f97316', '#ea580c', '#c2410c', '#9a3412'],
  },
  coral: {
    empty: '#fff5f5',
    steps: ['#e0f2fe', '#bae6fd', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  },
  amber: {
    empty: '#fffbeb',
    steps: ['#f3e8ff', '#e9d5ff', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
  },
  purple: {
    empty: '#faf5ff',
    steps: ['#bbf7d0', '#86efac', '#22c55e', '#16a34a', '#15803d', '#14532d'],
  },
  sunset: {
    empty: '#fff5f5',
    steps: ['#e0f2fe', '#bae6fd', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  },
  grayscale: {
    empty: '#f8f9fa',
    steps: ['#ffeb3b', '#fdd835', '#fbc02d', '#f9a825', '#f57f17', '#e65100'],
  },
};

export const NEGATIVE_DARK_THEMES: Record<ColorSchemeType, CustomColorScheme> = {
  github: {
    empty: '#161b22',
    steps: ['#3c1313', '#6d1717', '#a62626', '#d33939'],
  },
  emerald: {
    empty: '#022c22',
    steps: ['#4c0519', '#881337', '#be123c', '#e11d48', '#fb7185', '#fecdd3'],
  },
  sky: {
    empty: '#082f49',
    steps: ['#431407', '#7c2d12', '#c2410c', '#ea580c', '#f97316', '#fdba74'],
  },
  coral: {
    empty: '#2d0f0f',
    steps: ['#0c4a6e', '#075985', '#0284c7', '#0ea5e9', '#38bdf8', '#bae6fd'],
  },
  amber: {
    empty: '#271b05',
    steps: ['#3b0764', '#581c87', '#7e22ce', '#a855f7', '#c084fc', '#e9d5ff'],
  },
  purple: {
    empty: '#240046',
    steps: ['#064e3b', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'],
  },
  sunset: {
    empty: '#1c0d02',
    steps: ['#0c4a6e', '#075985', '#0284c7', '#0ea5e9', '#38bdf8', '#bae6fd'],
  },
  grayscale: {
    empty: '#212529',
    steps: ['#5c3d03', '#825605', '#a86f05', '#cf8907', '#f5a30a', '#f7b83d'],
  },
};

/**
 * Gets a color for a specific value and maximum absolute value, based on themes.
 */
export function getColorForValue(
  value: number,
  maxAbsValue: number,
  theme: CustomColorScheme,
  negativeTheme?: CustomColorScheme
): string {
  if (value === 0) return theme.empty;

  const targetTheme = (value < 0 && negativeTheme) ? negativeTheme : theme;
  const absVal = Math.abs(value);

  if (maxAbsValue <= 0) return targetTheme.steps[0];

  // Find index in steps
  const ratio = absVal / maxAbsValue;
  const index = Math.min(
    Math.floor(ratio * targetTheme.steps.length),
    targetTheme.steps.length - 1
  );
  return targetTheme.steps[index];
}
