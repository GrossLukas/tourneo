// Turneo — Profile + Membership
const ProfileScreen = ({ onNavigate }) => {
  const t = window.TURNEO;
  const d = window.TURNEO_DATA;
  return (
    <Screen>
      <ScrollArea>
        {/* Header */}
        <div style={{ padding: '62px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 800, color: t.textP, margin: 0, letterSpacing: -0.6 }}>Profil</h1>
          <button style={{
            width: 42, height: 42, borderRadius: 999, background: t.bgCard,
            border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><Icon name="settings" size={18} color={t.textP} /></button>
        </div>

        {/* Identity card */}
        <div style={{ padding: '18px 20px 0' }}>
          <Card padded={false} style={{
            padding: 18, textAlign: 'center',
            background: `linear-gradient(135deg, rgba(99,102,241,0.18) 0%, ${t.bgCard} 60%)`,
          }}>
            <Avatar name={d.user.name} hue={250} size={82} ring style={{ margin: '0 auto 12px' }} />
            <div style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.textP, letterSpacing: -0.5 }}>{d.user.name}</div>
            <div style={{ fontFamily: t.fontMono, fontSize: 12, color: t.textS, marginTop: 2 }}>{d.user.handle}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              padding: '6px 12px', borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(129,140,248,0.25), rgba(99,102,241,0.08))',
              border: '1px solid rgba(129,140,248,0.35)',
            }}>
              <Icon name="sparkle" size={12} color={t.primaryLight} />
              <span style={{ fontFamily: t.fontDisplay, fontSize: 12, fontWeight: 700, color: t.primaryLight, letterSpacing: 0.3 }}>TOURNEO PLUS</span>
            </div>
          </Card>
        </div>

        {/* ELO Big */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <StatBig v={d.user.elo} l="ELO" mono sub={`+${d.user.eloDelta}`} subC="#10B981" />
            <StatBig v={`${d.user.wr}%`} l="Winrate" />
            <StatBig v={d.user.streak} l="Streak" icon="flame" />
          </div>
        </div>

        {/* Achievements */}
        <Section title="Achievements" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', gap: 10, padding: '0 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {d.achievements.map(a => (
              <div key={a.label} style={{
                flexShrink: 0, width: 96, padding: 12, textAlign: 'center',
                background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, margin: '0 auto 8px',
                  background: `linear-gradient(135deg, oklch(0.6 0.16 ${a.hue}), oklch(0.4 0.14 ${a.hue - 20}))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={a.icon} size={24} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textP, fontWeight: 600, lineHeight: 1.25 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Friends */}
        <Section title="Freunde" action={() => {}} actionLabel="Alle">
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.friends.slice(0, 4).map(f => (
              <Card key={f.name} padded={false} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={f.name} hue={f.hue} size={40} />
                  {f.online && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 999, background: '#10B981', border: `2px solid ${t.bgCard}` }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.fontUI, fontSize: 13.5, fontWeight: 600, color: t.textP }}>{f.name}</div>
                  <div style={{ fontFamily: t.fontMono, fontSize: 11, color: t.textS }}>ELO {f.elo} · {f.online ? 'Online' : 'Offline'}</div>
                </div>
                <Button variant="ghost" size="sm" icon="bolt">Spielen</Button>
              </Card>
            ))}
          </div>
        </Section>

        {/* Membership CTA */}
        <div style={{ padding: '4px 20px 0' }}>
          <Card padded={false} onClick={() => onNavigate('membership')} style={{
            padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
            background: `linear-gradient(135deg, rgba(245,158,11,0.18), ${t.bgCard} 60%)`,
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px -6px rgba(245,158,11,0.5)',
            }}><Icon name="crown" size={24} color="#1A120B" strokeWidth={2.2} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: 700, color: t.textP, letterSpacing: -0.3 }}>Upgrade auf Club</div>
              <div style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textS, marginTop: 2 }}>−20% Gebühren · 48h Early Access</div>
            </div>
            <Icon name="chevron" size={18} color={t.gold} />
          </Card>
        </div>

        <div style={{ height: 20 }} />
      </ScrollArea>
    </Screen>
  );
};

const StatBig = ({ v, l, sub, subC, mono, icon }) => {
  const t = window.TURNEO;
  return (
    <Card padded={false} style={{ padding: 14, textAlign: 'center' }}>
      <div style={{ fontFamily: mono ? t.fontMono : t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.textP, letterSpacing: -0.5, lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {icon && <Icon name={icon} size={18} color={t.gold} />}{v}
      </div>
      <div style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textT, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 6 }}>{l}</div>
      {sub && <div style={{ fontFamily: t.fontUI, fontSize: 11, color: subC || t.textS, fontWeight: 700, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
};

// ─── Membership Screen ───
const MembershipScreen = ({ onNavigate }) => {
  const t = window.TURNEO;
  const [tier, setTier] = React.useState('plus');
  const tiers = {
    free: { name: 'Free', price: 0, color: '#888780', perks: ['Turnierteilnahme', 'Court Finder', 'Community'] },
    plus: { name: 'Plus', price: 7.99, color: t.tierPlus, perks: ['Alle Free-Vorteile', '24h Early Access', '−10% Gebühren', 'Erweiterte Stats', 'Plus Badge'] },
    club: { name: 'Club', price: 14.99, color: t.gold, perks: ['Alle Plus-Vorteile', '48h Early Access', '−20% Gebühren', 'Exklusive Events', 'Gold Badge', 'Priority Support'] },
  };
  const cur = tiers[tier];

  return (
    <Screen>
      <ScrollArea padBottom={120}>
        <div style={{ padding: '62px 20px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => onNavigate('profil')} style={navBtn(t)}><Icon name="chevronL" size={20} color={t.textP} /></button>
          <h1 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.textP, margin: 0, letterSpacing: -0.5 }}>Mitgliedschaft</h1>
        </div>

        {/* Tier toggle */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 4 }}>
            {Object.keys(tiers).map(k => (
              <button key={k} onClick={() => setTier(k)} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                background: tier === k ? (k === 'club' ? `linear-gradient(135deg, #F59E0B, #B45309)` : k === 'plus' ? `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})` : t.bgHover) : 'transparent',
                border: 'none', color: tier === k ? '#fff' : t.textS,
                fontFamily: t.fontDisplay, fontSize: 13, fontWeight: 700, letterSpacing: 0.1,
                transition: 'all .2s ease',
              }}>{tiers[k].name}</button>
            ))}
          </div>
        </div>

        {/* Tier hero */}
        <div style={{ padding: '16px 20px 0' }}>
          <Card padded={false} style={{
            padding: 22, textAlign: 'center',
            background: tier === 'club'
              ? `radial-gradient(ellipse at top, rgba(245,158,11,0.25), ${t.bgCard} 70%)`
              : tier === 'plus'
              ? `radial-gradient(ellipse at top, rgba(99,102,241,0.25), ${t.bgCard} 70%)`
              : t.bgCard,
            border: `1px solid ${tier === 'club' ? 'rgba(245,158,11,0.3)' : tier === 'plus' ? 'rgba(99,102,241,0.3)' : t.border}`,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 14px',
              background: tier === 'club' ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : tier === 'plus' ? `linear-gradient(135deg, ${t.primaryLight}, ${t.primaryDark})` : `linear-gradient(135deg, #AAA, #666)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: tier === 'club' ? '0 12px 30px -8px rgba(245,158,11,0.5)' : tier === 'plus' ? `0 12px 30px -8px ${t.primaryGlow}` : 'none',
            }}>
              <Icon name={tier === 'club' ? 'crown' : tier === 'plus' ? 'sparkle' : 'user'} size={34} color={tier === 'club' ? '#1A120B' : '#fff'} strokeWidth={2} />
            </div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 28, fontWeight: 800, color: t.textP, letterSpacing: -0.7 }}>Tourneo {cur.name}</div>
            <div style={{ fontFamily: t.fontMono, fontSize: 13, color: t.textS, marginTop: 4 }}>
              {cur.price > 0 ? <>{cur.price.toFixed(2).replace('.', ',')}€ / Monat</> : 'Kostenlos'}
            </div>

            <div style={{ marginTop: 18, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cur.perks.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: tier === 'club' ? t.goldBg : t.primaryBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><Icon name="check" size={13} color={tier === 'club' ? t.gold : t.primaryLight} strokeWidth={2.5} /></div>
                  <span style={{ fontFamily: t.fontUI, fontSize: 13.5, color: t.textP, fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Comparison table mini */}
        <div style={{ padding: '20px 20px 0' }}>
          <h3 style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: 700, color: t.textP, margin: '0 0 10px', letterSpacing: -0.2 }}>Vergleich</h3>
          <Card padded={false} style={{ padding: 0 }}>
            {[
              ['Early Access', '–', '24h', '48h'],
              ['Rabatt', '–', '10%', '20%'],
              ['Warteliste', 'Std.', 'Hoch', 'Top'],
            ].map(([k, ...vs], i) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', alignItems: 'center',
                padding: '12px 14px', borderBottom: i < 2 ? `1px solid ${t.divider}` : 'none',
              }}>
                <span style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textS, fontWeight: 600 }}>{k}</span>
                {vs.map((v, j) => (
                  <span key={j} style={{
                    fontFamily: t.fontMono, fontSize: 12, textAlign: 'center', fontWeight: 700,
                    color: j === 2 ? t.gold : j === 1 ? t.primaryLight : t.textS,
                  }}>{v}</span>
                ))}
              </div>
            ))}
          </Card>
        </div>

        <div style={{ height: 20 }} />
      </ScrollArea>

      {/* sticky CTA */}
      {tier !== 'free' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
          padding: '14px 20px 28px',
          background: `linear-gradient(to top, ${t.bg} 60%, rgba(10,10,20,0))`,
        }}>
          <Button variant={tier === 'club' ? 'gold' : 'primary'} size="lg" full icon="arrowR">
            {tier === 'club' ? 'Club starten' : 'Plus starten'} — {cur.price.toFixed(2).replace('.', ',')}€/Monat
          </Button>
        </div>
      )}
    </Screen>
  );
};

Object.assign(window, { ProfileScreen, MembershipScreen });
