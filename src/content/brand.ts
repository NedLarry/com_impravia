/**
 * Brand configuration.
 *
 * The logo is not final. Every component reads logo paths from here, and the
 * files themselves live in public/brand/. To change the logo, either replace
 * those files (keeping the names) or point these paths at new ones.
 */
export const brand = {
  name: 'Impravia',
  legalName: 'Impravia Limited',
  registration: 'RC 9410057',
  location: 'Lagos, Nigeria',
  motto: 'Making the impossible plausible',
  email: 'admin@impravia.com',

  logo: {
    /** Primary horizontal lockup, for dark backgrounds */
    horizontalDark: '/brand/logo-horizontal-dark-bg.svg',
    /** Primary horizontal lockup, for light backgrounds */
    horizontalLight: '/brand/logo-horizontal-light-bg.svg',
    /** Mark alone, for dark backgrounds (used as hero art and favicon) */
    markDark: '/brand/mark-dark-bg.svg',
    markLight: '/brand/mark-light-bg.svg',
    /** Intrinsic sizes, used for width/height attributes to avoid layout shift */
    horizontalSize: { width: 1100, height: 200 },
    markSize: { width: 231, height: 200 },
  },
} as const
