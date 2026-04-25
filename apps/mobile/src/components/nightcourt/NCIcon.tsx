/**
 * Stroke-based icon set ported from `design_handoff_tourneo_night_court/
 * prototype/icons.jsx` to react-native-svg.  Names + viewBox + stroke width
 * default match the prototype.
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

export type IconName =
  | 'home' | 'trophy' | 'user' | 'search' | 'bell' | 'flame' | 'calendar'
  | 'pin' | 'bolt' | 'chevron' | 'chevronL' | 'chevronD' | 'chevronU'
  | 'plus' | 'check' | 'close' | 'filter' | 'star' | 'heart' | 'users'
  | 'shield' | 'ball' | 'stopwatch' | 'target' | 'trend' | 'zap' | 'medal'
  | 'crown' | 'settings' | 'arrowR' | 'arrowU' | 'arrowD' | 'euro' | 'dot'
  | 'live' | 'play' | 'share' | 'more' | 'ticket' | 'sparkle';

interface NCIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const NCIcon = React.memo(function NCIcon({
  name,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
}: NCIconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPaths(name, color, common)}
    </Svg>
  );
});

function renderPaths(
  name: IconName,
  color: string,
  c: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: 'none';
  }
) {
  switch (name) {
    case 'home':
      return <Path {...c} d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2V10z" />;
    case 'trophy':
      return (
        <>
          <Path {...c} d="M8 4h8v4a4 4 0 11-8 0V4z" />
          <Path {...c} d="M4 4h4v2a4 4 0 01-4 4V4zM16 4h4v6a4 4 0 01-4-4V4z" />
          <Path {...c} d="M12 12v4M9 20h6M10 16h4l1 4H9l1-4z" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...c} cx="12" cy="8" r="4" />
          <Path {...c} d="M4 21a8 8 0 1116 0" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...c} cx="11" cy="11" r="7" />
          <Path {...c} d="M20 20l-3.5-3.5" />
        </>
      );
    case 'bell':
      return (
        <>
          <Path {...c} d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
          <Path {...c} d="M10 21a2 2 0 004 0" />
        </>
      );
    case 'flame':
      return (
        <>
          <Path {...c} d="M12 2s4 4 4 8a4 4 0 11-8 0c0-1 .5-2 1-3 1 3 3 3 3-5z" />
          <Path {...c} d="M8 14a4 4 0 108 0" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect {...c} x={3} y={5} width={18} height={16} rx={2} />
          <Path {...c} d="M3 9h18M8 3v4M16 3v4" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path {...c} d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
          <Circle {...c} cx="12" cy="10" r="2.5" />
        </>
      );
    case 'bolt':
    case 'zap':
      return <Path {...c} d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />;
    case 'chevron':
      return <Path {...c} d="M9 6l6 6-6 6" />;
    case 'chevronL':
      return <Path {...c} d="M15 6l-6 6 6 6" />;
    case 'chevronD':
      return <Path {...c} d="M6 9l6 6 6-6" />;
    case 'chevronU':
      return <Path {...c} d="M6 15l6-6 6 6" />;
    case 'plus':
      return <Path {...c} d="M12 5v14M5 12h14" />;
    case 'check':
      return <Path {...c} d="M4 12l5 5L20 6" />;
    case 'close':
      return <Path {...c} d="M6 6l12 12M18 6L6 18" />;
    case 'filter':
      return <Path {...c} d="M3 5h18M6 12h12M10 19h4" />;
    case 'star':
      return <Path {...c} d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z" />;
    case 'heart':
      return <Path {...c} d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />;
    case 'users':
      return (
        <>
          <Circle {...c} cx="9" cy="8" r="3.5" />
          <Path {...c} d="M2.5 20a6.5 6.5 0 0113 0" />
          <Path {...c} d="M16 5a3.5 3.5 0 010 7M22 20a6.5 6.5 0 00-4-6" />
        </>
      );
    case 'shield':
      return <Path {...c} d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" />;
    case 'ball':
      return (
        <>
          <Circle {...c} cx="12" cy="12" r="9" />
          <Path {...c} d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </>
      );
    case 'stopwatch':
      return (
        <>
          <Circle {...c} cx="12" cy="14" r="7" />
          <Path {...c} d="M12 14V9M9 2h6M12 7v0" />
        </>
      );
    case 'target':
      return (
        <>
          <Circle {...c} cx="12" cy="12" r="9" />
          <Circle {...c} cx="12" cy="12" r="5" />
          <Circle {...c} cx="12" cy="12" r="1.5" />
        </>
      );
    case 'trend':
      return (
        <>
          <Path {...c} d="M3 17l6-6 4 4 8-8" />
          <Path {...c} d="M14 7h7v7" />
        </>
      );
    case 'medal':
      return (
        <>
          <Circle {...c} cx="12" cy="15" r="6" />
          <Path {...c} d="M8 4l4 7 4-7M6 4h4M14 4h4" />
        </>
      );
    case 'crown':
      return <Path {...c} d="M3 18h18l-1-10-5 4-3-6-3 6-5-4-1 10z" />;
    case 'settings':
      return (
        <>
          <Circle {...c} cx="12" cy="12" r="3" />
          <Path {...c} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.5-7.5l-1.5 1.5M6 18l-1.5 1.5m13 0L16 18M6 6L4.5 4.5" />
        </>
      );
    case 'arrowR':
      return <Path {...c} d="M5 12h14M13 6l6 6-6 6" />;
    case 'arrowU':
      return <Path {...c} d="M12 19V5M6 11l6-6 6 6" />;
    case 'arrowD':
      return <Path {...c} d="M12 5v14M6 13l6 6 6-6" />;
    case 'euro':
      return <Path {...c} d="M18 7a6 6 0 100 10M4 10h10M4 14h10" />;
    case 'dot':
      return <Circle cx="12" cy="12" r="4" fill={color} />;
    case 'live':
      return (
        <>
          <Circle cx="12" cy="12" r="3" fill={color} />
          <Circle {...c} cx="12" cy="12" r="7" opacity={0.4} />
          <Circle {...c} cx="12" cy="12" r="10" opacity={0.15} />
        </>
      );
    case 'play':
      return <Path d="M7 4v16l14-8-14-8z" fill={color} />;
    case 'share':
      return (
        <>
          <Circle {...c} cx="6" cy="12" r="2.5" />
          <Circle {...c} cx="18" cy="5" r="2.5" />
          <Circle {...c} cx="18" cy="19" r="2.5" />
          <Path {...c} d="M8 11l8-5M8 13l8 5" />
        </>
      );
    case 'more':
      return (
        <>
          <Circle cx="5" cy="12" r="1.5" fill={color} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
          <Circle cx="19" cy="12" r="1.5" fill={color} />
        </>
      );
    case 'ticket':
      return (
        <>
          <Path {...c} d="M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 100-4V9z" />
          <Path {...c} d="M10 7v10" />
        </>
      );
    case 'sparkle':
      return (
        <Path
          {...c}
          d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"
        />
      );
    default:
      return <Circle cx="12" cy="12" r="4" fill={color} />;
  }
}
