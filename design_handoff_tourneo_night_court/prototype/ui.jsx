// Turneo — shared UI primitives: glass cards, badges, avatars, buttons, tab bar
const T = () => window.TURNEO;

// ─── Glass Card ───
const Card = ({ children, style = {}, onClick, glow = false, padded = true, elevated = false }) => {
  const t = T();
  return (
    <div
      onClick={onClick}
      style={{
        background: elevated ? t.bgElev : t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 20,
        padding: padded ? 16 : 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glow
          ? `0 0 0 1px ${t.primaryGlow}, 0 10px 30px -10px ${t.primaryGlow}`
          : '0 1px 0 rgba(255,255,255,0.04) inset',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .18s ease, background .18s ease',
        ...style,
      }}
    >{children}</div>
  );
};

// ─── Pill Badge ───
const Pill = ({ children, color, bg, dot = false, style = {} }) => {
  const t = T();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 9px', borderRadius: 999,
      background: bg || t.primaryBg,
      color: color || t.primaryLight,
      fontFamily: t.fontUI, fontSize: 10.5, fontWeight: 700,
      letterSpacing: 0.6, textTransform: 'uppercase',
      lineHeight: 1, whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: color || t.primaryLight }} />}
      {children}
    </span>
  );
};

// ─── LIVE Pulse ───
const LivePulse = ({ label = 'LIVE' }) => {
  const t = T();
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 6,
      background: t.coralBg,
      color: t.coral, fontFamily: t.fontUI, fontSize: 10,
      fontWeight: 800, letterSpacing: 1.2,
    }}>
      <span style={{ position: 'relative', width: 6, height: 6 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 999, background: t.coral,
          animation: 'tpulse 1.4s ease-out infinite',
        }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: t.coral }} />
      </span>
      {label}
    </div>
  );
};

// ─── Avatar (initials or color blob) ───
const Avatar = ({ name = 'TN', size = 36, hue = 240, ring = false, style = {} }) => {
  const t = T();
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, oklch(0.55 0.18 ${hue}), oklch(0.38 0.16 ${hue - 30}))`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: t.fontDisplay, fontWeight: 700, color: '#fff',
      fontSize: size * 0.38, letterSpacing: -0.3,
      boxShadow: ring ? `0 0 0 2px ${t.bg}, 0 0 0 3.5px ${t.primary}` : 'none',
      flexShrink: 0, ...style,
    }}>{initials}</div>
  );
};

// ─── Button ───
const Button = ({ children, variant = 'primary', size = 'md', onClick, style = {}, icon, full = false }) => {
  const t = T();
  const sz = size === 'sm' ? { h: 36, fs: 13, px: 14 } : size === 'lg' ? { h: 56, fs: 16, px: 22 } : { h: 48, fs: 14.5, px: 18 };
  const vs = {
    primary:  { bg: t.primary, color: '#fff', border: 'transparent', shadow: `0 8px 24px -8px ${t.primaryGlow}` },
    secondary:{ bg: t.bgCard, color: t.textP, border: t.borderStr, shadow: 'none' },
    ghost:    { bg: 'transparent', color: t.textP, border: t.border, shadow: 'none' },
    gold:     { bg: t.gold, color: '#1A120B', border: 'transparent', shadow: '0 8px 24px -8px rgba(245,158,11,0.4)' },
  }[variant];
  return (
    <button
      onClick={onClick}
      style={{
        height: sz.h, padding: `0 ${sz.px}px`, borderRadius: 14,
        background: vs.bg, color: vs.color, border: `1px solid ${vs.border}`,
        fontFamily: t.fontUI, fontSize: sz.fs, fontWeight: 600,
        letterSpacing: -0.1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', width: full ? '100%' : 'auto',
        boxShadow: vs.shadow, transition: 'transform .1s ease, filter .15s ease',
        ...style,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {icon && <Icon name={icon} size={sz.fs + 4} />}
      {children}
    </button>
  );
};

// ─── Section Header ───
const Section = ({ title, action, actionLabel = 'Alle', style = {}, children }) => {
  const t = T();
  return (
    <div style={{ marginBottom: 20, ...style }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 20px', marginBottom: 12,
      }}>
        <h3 style={{
          fontFamily: t.fontDisplay, fontSize: 19, fontWeight: 700,
          letterSpacing: -0.4, color: t.textP, margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          minWidth: 0, flex: '1 1 auto',
        }}>{title}</h3>
        {action && (
          <button onClick={action} style={{
            background: 'none', border: 'none', padding: 0,
            fontFamily: t.fontUI, fontSize: 13, fontWeight: 600, color: t.primaryLight,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 12,
          }}>{actionLabel} →</button>
        )}
      </div>
      {children}
    </div>
  );
};

// ─── Bottom Tab Bar ───
const BottomTabs = ({ active, onChange }) => {
  const t = T();
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'turniere', label: 'Turniere', icon: 'trophy' },
    { id: 'match', label: '', icon: 'play', special: true },
    { id: 'community', label: 'Community', icon: 'users' },
    { id: 'profil', label: 'Profil', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      height: 88, paddingBottom: 26, paddingTop: 10,
      background: 'rgba(10,10,20,0.75)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
    }}>
      {tabs.map(tab => {
        if (tab.special) {
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} style={{
              marginTop: -18, width: 54, height: 54, borderRadius: 999,
              background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})`,
              border: `3px solid ${t.bg}`,
              boxShadow: `0 10px 24px -4px ${t.primaryGlow}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}>
              <Icon name="bolt" size={24} color="#fff" strokeWidth={2.5} />
            </button>
          );
        }
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            opacity: isActive ? 1 : 0.55, minWidth: 54,
            transition: 'opacity .15s ease',
          }}>
            <Icon name={tab.icon} size={22} color={isActive ? t.primary : t.textS} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{
              fontFamily: t.fontUI, fontSize: 10, fontWeight: 600,
              color: isActive ? t.primary : t.textS, letterSpacing: 0.2,
            }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Top bar (custom, replaces IOS default) ───
const TopBar = ({ greeting, name, onBell, badge = 0, onAvatar }) => {
  const t = T();
  return (
    <div style={{
      padding: '62px 20px 12px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto' }}>
        <Avatar name={name} hue={250} size={42} ring onClick={onAvatar} />
        <div style={{ minWidth: 0, flex: '1 1 auto' }}>
          <div style={{
            fontFamily: t.fontUI, fontSize: 12, color: t.textT,
            fontWeight: 500, letterSpacing: 0.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{greeting}</div>
          <div style={{
            fontFamily: t.fontDisplay, fontSize: 17, color: t.textP,
            fontWeight: 700, letterSpacing: -0.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</div>
        </div>
      </div>
      <button onClick={onBell} style={{
        width: 42, height: 42, borderRadius: 999,
        background: t.bgCard, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative', padding: 0,
      }}>
        <Icon name="bell" size={19} color={t.textP} />
        {badge > 0 && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 8, height: 8, borderRadius: 999,
            background: t.coral, border: `2px solid ${t.bgCard}`,
          }} />
        )}
      </button>
    </div>
  );
};

// ─── Background (subtle indigo gradient glow) ───
const Screen = ({ children, style = {} }) => {
  const t = T();
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: t.bg, overflow: 'hidden',
      ...style,
    }}>
      {/* top glow */}
      <div style={{
        position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)',
        width: 520, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};

// ─── Scrollable content region ───
const ScrollArea = ({ children, style = {}, padBottom = 100 }) => (
  <div style={{
    flex: 1, overflowY: 'auto', overflowX: 'hidden',
    paddingBottom: padBottom, scrollbarWidth: 'none',
    ...style,
  }}>
    {children}
  </div>
);

Object.assign(window, {
  Card, Pill, LivePulse, Avatar, Button, Section, BottomTabs, TopBar, Screen, ScrollArea,
});
