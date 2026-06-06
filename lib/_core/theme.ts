import { themeColors } from "@/theme.config";

export type ColorScheme = "light" | "dark";

export const ThemeColors = themeColors;

type ThemeColorTokens = typeof ThemeColors;
type ThemeColorName = keyof ThemeColorTokens;
type SchemePalette = Record<ColorScheme, Record<ThemeColorName, string>>;
type SchemePaletteItem = SchemePalette[ColorScheme];

export type ThemeColorPalette = SchemePaletteItem;

function buildSchemePalette(colors: ThemeColorTokens): SchemePalette {
  const palette: SchemePalette = {
    light: {} as Record<ThemeColorName, string>,
    dark: {} as Record<ThemeColorName, string>,
  };

  (Object.keys(colors) as ThemeColorName[]).forEach((key) => {
    palette.light[key] = colors[key].light;
    palette.dark[key] = colors[key].dark;
  });

  return palette;
}

const schemePalette = buildSchemePalette(ThemeColors);

export const Colors: Record<ColorScheme, SchemePaletteItem> = schemePalette;

export const Fonts = {
  heading: "System",
  body: "System",
  mono: "System",
};

export const SchemeColors = schemePalette;
