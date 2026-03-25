export const THEME_MODE_OPTIONS = [
  {
    label: "Light",
    value: "light",
  },
  {
    label: "Dark",
    value: "dark",
  },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((m) => m.value);

export type ThemeMode = (typeof THEME_MODE_VALUES)[number];

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Default",
    value: "default",
    primary: {
      light: "oklch(0.205 0 0)",
      dark: "oklch(0.922 0 0)",
    },
  },
  {
    label: "Amethyst Haze",
    value: "amethyst-haze",
    primary: {
      light: "oklch(0.6104 0.0767 299.7335)",
      dark: "oklch(0.7058 0.0777 302.0489)",
    },
  },
  {
    label: "Brutalist",
    value: "brutalist",
    primary: {
      light: "oklch(0.6489 0.2370 26.9728)",
      dark: "oklch(0.7044 0.1872 23.1858)",
    },
  },
  {
    label: "Caffeine",
    value: "caffeine",
    primary: {
      light: "oklch(0.4341 0.0392 41.9938)",
      dark: "oklch(0.9247 0.0524 66.1732)",
    },
  },
  {
    label: "Claymorphism",
    value: "claymorphism",
    primary: {
      light: "oklch(0.5854 0.2041 277.1173)",
      dark: "oklch(0.6801 0.1583 276.9349)",
    },
  },
  {
    label: "Clean Slate",
    value: "clean-slate",
    primary: {
      light: "oklch(0.5854 0.2041 277.1173)",
      dark: "oklch(0.6801 0.1583 276.9349)",
    },
  },
  {
    label: "Modern Minimal",
    value: "modern-minimal",
    primary: {
      light: "oklch(0.5854 0.2041 277.1173)",
      dark: "oklch(0.6801 0.1583 276.9349)",
    },
  },
  {
    label: "Mono",
    value: "mono",
    primary: {
      light: "oklch(0.5555 0 0)",
      dark: "oklch(0.5555 0 0)",
    },
  },
  {
    label: "Notebook",
    value: "notebook",
    primary: {
      light: "oklch(0.4891 0 0)",
      dark: "oklch(0.7572 0 0)",
    },
  },
  {
    label: "Soft Pop",
    value: "soft-pop",
    primary: {
      light: "oklch(0.5106 0.2301 276.9656)",
      dark: "oklch(0.6801 0.1583 276.9349)",
    },
  },
  {
    label: "Tangerine",
    value: "tangerine",
    primary: {
      light: "oklch(0.64 0.17 36.44)",
      dark: "oklch(0.64 0.17 36.44)",
    },
  },
  {
    label: "Twitter",
    value: "twitter",
    primary: {
      light: "oklch(0.6231 0.1880 259.8145)",
      dark: "oklch(0.6231 0.1880 259.8145)",
    },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
