/**
 * Token aliases used by the Night Court primitives.  The colour names mirror
 * the prototype's `tokens.js` so porting screen-files is a 1-to-1 rename.
 */
import { nightCourtColors } from '../../theme/colors';

export const NC = {
  bg:           '#0A0A14',
  bgElev:       '#0D0D1A',
  bgCard:       '#111127',
  bgInput:      '#16162A',
  bgHover:      '#1A1A33',
  bgPressed:    '#1F1F3D',

  primary:      nightCourtColors.primary,        // #6366F1
  primaryDark:  nightCourtColors.primaryDark,    // #4F46E5
  primaryLight: nightCourtColors.primaryLight,   // #818CF8
  primaryBg:    nightCourtColors.primaryBg,      // rgba(99,102,241,0.12)
  primaryGlow:  'rgba(99,102,241,0.35)',

  gold:         nightCourtColors.gold,           // #F59E0B
  goldLight:    nightCourtColors.goldLight,      // #FCD34D
  goldBg:       nightCourtColors.goldBg,

  coral:        '#FF4757',
  coralBg:      'rgba(255,71,87,0.12)',
  green:        '#10B981',

  textP:        '#FFFFFF',
  textS:        'rgba(255,255,255,0.6)',
  textT:        'rgba(255,255,255,0.35)',
  textD:        'rgba(255,255,255,0.2)',

  border:       'rgba(255,255,255,0.08)',
  borderStr:    'rgba(255,255,255,0.15)',
  divider:      'rgba(255,255,255,0.06)',

  tierFree:     '#888780',
  tierPlus:     '#818CF8',
  tierClub:     '#F59E0B',
} as const;
