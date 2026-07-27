/**
 * EduBD design tokens.
 *
 * Grounded in Bangladeshi textile heritage rather than generic trend
 * colors — see the design concept doc for the full reasoning. Import this
 * instead of redefining a local color object per page, so a future palette
 * change happens in one place instead of N places.
 *
 *   import { C, FONT } from "@/lib/theme";
 */
export const C = {
  // Base surfaces
  rice:      "#FBF6EE", // page background — cotton base cloth of a kantha quilt
  riceDeep:  "#F3ECDE", // secondary surface (footers, subtle section breaks)
  w:         "#FFFFFF", // pure white — cards that need to lift off the rice background
  line:      "#E4DBC8", // hairline borders

  // Text
  ink:       "#211D1A", // primary text — kantha's black embroidery thread
  inkSoft:   "#5B564E", // secondary/muted text

  // Brand
  indigo:      "#28305E", // primary — indigo dye (nil), historically significant to Bengal
  indigoDeep:  "#1A2044", // headings, high-emphasis indigo text
  indigoSoft:  "#9098C4", // light tint uses only (badges, subtle backgrounds)

  // Accent — used deliberately sparingly, per the design brief (CTAs and
  // highlights only, never a base/structural color)
  red:      "#B23A2E", // kantha's red thread + the flag's red disc — primary CTA color
  redDeep:  "#8C2A21",

  // Supporting accents
  gold:   "#C98A2C", // turmeric — tertiary highlights, badges, ratings
  green:  "#3A6B4C", // paddy fields + the flag's green — success states only
};

export const FONT = {
  display: "'Fraunces', serif",  // headlines — warm, human, used with restraint
  body:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};
