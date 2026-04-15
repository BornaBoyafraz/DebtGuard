/**
 * DebtGuard canonical theme colors.
 *
 * These are the ONLY hex values permitted in this codebase.
 * All UI code must use either:
 *   1. CSS variables via Tailwind utilities (preferred): bg-accent, text-danger, etc.
 *   2. These constants when a raw hex is required (e.g. Recharts, inline style).
 *
 * Never hardcode colors outside this file.
 */

// ─── Brand / Primary ────────────────────────────────────────────────────────
/** Dark mode primary accent — light peach. Text on this must be DARK. */
export const ACCENT_DARK = '#ffe0c2';
/** Light mode primary accent — warm brown. Text on this must be WHITE. */
export const ACCENT_LIGHT = '#644a40';
/** Text color on ACCENT_DARK background (dark mode buttons, logo bg) */
export const ACCENT_FOREGROUND_DARK = '#202020';
/** Text color on ACCENT_LIGHT background (light mode buttons, logo bg) */
export const ACCENT_FOREGROUND_LIGHT = '#ffffff';

// ─── Secondary / Warm ───────────────────────────────────────────────────────
export const SECONDARY_DARK = '#393028';
export const SECONDARY_LIGHT = '#ffdfb5';

// ─── Semantic ───────────────────────────────────────────────────────────────
export const COLOR_SUCCESS = '#10b981';
export const COLOR_WARNING = '#f59e0b';
export const COLOR_DANGER  = '#e54d2e';

// ─── Neutrals (dark mode) ───────────────────────────────────────────────────
export const BG_DARK               = '#111111';
export const SURFACE_DARK          = '#191919';
export const SURFACE_ELEVATED_DARK = '#18181b';
export const SURFACE_OVERLAY_DARK  = '#2a2a2a';
export const BORDER_DARK           = '#201e18';
export const BORDER_SUBTLE_DARK    = '#27272a';
export const TEXT_PRIMARY_DARK     = '#eeeeee';
export const TEXT_SECONDARY_DARK   = '#b4b4b4';
export const TEXT_MUTED_DARK       = '#484848';

// ─── Neutrals (light mode) ──────────────────────────────────────────────────
export const BG_LIGHT               = '#f9f9f9';
export const SURFACE_LIGHT          = '#fcfcfc';
export const SURFACE_ELEVATED_LIGHT = '#efefef';
export const BORDER_LIGHT           = '#d8d8d8';
export const BORDER_SUBTLE_LIGHT    = '#ebebeb';
export const TEXT_PRIMARY_LIGHT     = '#202020';
export const TEXT_SECONDARY_LIGHT   = '#646464';
export const TEXT_MUTED_LIGHT       = '#909090';

// ─── Chart palette ──────────────────────────────────────────────────────────
/**
 * Ordered color palette for multi-scenario chart lines.
 * Index 0 = baseline, 1+ = stacked scenarios.
 */
export const CHART_COLORS = [
  ACCENT_DARK,      // #ffe0c2 — primary scenario
  SECONDARY_LIGHT,  // #ffdfb5 — stacked scenario 2
  COLOR_WARNING,    // #f59e0b — stacked scenario 3
  COLOR_DANGER,     // #e54d2e — stacked scenario 4
] as const;
