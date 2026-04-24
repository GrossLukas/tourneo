// Turneo — Home screen
const HomeScreen = ({ onNavigate }) => {
  const t = window.TURNEO;
  const d = window.TURNEO_DATA;
  const hero = d.heroEvent;
  const fill = (hero.filled / hero.spots) * 100;

  return (
    <Screen>
      <TopBar greeting="Guten Morgen" name={d.user.name} badge={3} />

      <ScrollArea>
        {/* ─── ELO summary + rank ─── */}
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <Card padded={false} style={{
            padding: '18px 18px 16px',
            background: `linear-gradient(135deg, ${t.bgCard} 0%, rgba(79,70,229,0.15) 100%)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: t.fontUI, fontSize: 11, color: t.textS, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Deine Wertung</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: t.fontMono, fontSize: 38, fontWeight: 700, color: t.textP, letterSpacing: -1.5, lineHeight: 1 }}>{d.user.elo}</span>
                  <span style={{ fontFamily: t.fontUI, fontSize: 13, fontWeight: 700, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <Icon name="arrowU" size={12} color="#10B981" strokeWidth={2.5} />+{d.user.eloDelta}
                  </span>
                </div>
              </div>
              <div style={{
                padding: '6px 10px', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="crown" size={14} color={t.gold} />
                <span style={{ fontFamily: t.fontDisplay, fontSize: 13, fontWeight: 700, color: t.gold }}>Rang {d.user.rank}</span>
              </div>
            </div>

            {/* sparkline */}
            <Sparkline data={d.eloHistory} width={310} height={50} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
              <Stat v={d.user.wins} l="Siege" c="#10B981" />
              <Stat v={d.user.losses} l="Niederlagen" />
              <Stat v={`${d.user.wr}%`} l="Winrate" c={t.primaryLight} />
              <Stat v={d.user.streak} l="Streak" c={t.gold} fireIcon />
            </div>
          </Card>
        </div>

        {/* ─── LIVE matches ─── */}
        {d.liveMatches.length > 0 && (
          <Section title="Live jetzt" action={() => {}}>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px', scrollbarWidth: 'none' }}>
              {d.liveMatches.map(m => <LiveMatchCard key={m.id} m={m} />)}
            </div>
          </Section>
        )}

        {/* ─── Hero tournament ─── */}
        <Section title="Nächstes Turnier" action={() => onNavigate('event')}>
          <div style={{ padding: '0 20px' }}>
            <Card padded={false} glow onClick={() => onNavigate('event')} style={{ cursor: 'pointer' }}>
              {/* image placeholder */}
              <div style={{
                height: 160, position: 'relative', overflow: 'hidden',
                background: `
                  radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.45), transparent 55%),
                  radial-gradient(ellipse at 80% 70%, rgba(245,158,11,0.3), transparent 55%),
                  linear-gradient(135deg, #1A1A3D 0%, #0D0D1A 100%)`,
              }}>
                {/* court diagram accent */}
                <svg width="100%" height="100%" viewBox="0 0 360 160" style={{ position: 'absolute', inset: 0, opacity: 0.22 }}>
                  <rect x="40" y="24" width="280" height="112" rx="4" stroke="#818CF8" strokeWidth="1.2" fill="none"/>
                  <line x1="180" y1="24" x2="180" y2="136" stroke="#818CF8" strokeWidth="1.2"/>
                  <line x1="40" y1="80" x2="320" y2="80" stroke="#818CF8" strokeWidth="1.2"/>
                  <line x1="100" y1="24" x2="100" y2="136" stroke="#818CF8" strokeWidth="0.6"/>
                  <line x1="260" y1="24" x2="260" y2="136" stroke="#818CF8" strokeWidth="0.6"/>
                </svg>
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
                  <Pill color="#fff" bg="rgba(99,102,241,0.9)" style={{ backdropFilter: 'blur(8px)' }}>NÄCHSTES TURNIER</Pill>
                  <Pill color="#FCD34D" bg="rgba(245,158,11,0.18)" dot>MEMBER −10%</Pill>
                </div>
                <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
                  <div style={{
                    fontFamily: t.fontMono, fontSize: 10, fontWeight: 700, color: t.gold,
                    letterSpacing: 1, textAlign: 'right',
                  }}>GARANTIERT</div>
                  <div style={{ fontFamily: t.fontDisplay, fontSize: 24, fontWeight: 800, color: t.gold, lineHeight: 1, letterSpacing: -0.5 }}>
                    {hero.prize.toLocaleString('de')}€
                  </div>
                </div>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 700, color: t.textP, letterSpacing: -0.4, lineHeight: 1.15 }}>{hero.title}</div>
                <div style={{ fontFamily: t.fontUI, fontSize: 13, color: t.textS, marginTop: 4 }}>{hero.sub}</div>

                <div style={{ display: 'flex', gap: 14, marginTop: 14, fontFamily: t.fontUI, fontSize: 12.5, color: t.textS }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={14} color={t.textS} />{hero.dateLabel}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={14} color={t.textS} />{hero.venue}</span>
                </div>

                {/* progress */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: t.fontUI, fontSize: 11, color: t.textT, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Plätze</span>
                    <span style={{ fontFamily: t.fontMono, fontSize: 11.5, color: t.textP, fontWeight: 700 }}>{hero.filled}/{hero.spots}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: t.bgInput, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${fill}%`, borderRadius: 999,
                      background: fill > 85 ? `linear-gradient(90deg, ${t.coral}, #FFA57A)` : `linear-gradient(90deg, ${t.primary}, ${t.primaryLight})`,
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Gebühr</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 700, color: t.textP }}>{hero.feePlus}€</span>
                      <span style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textT, textDecoration: 'line-through' }}>{hero.fee}€</span>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" size="md" icon="arrowR" onClick={e => { e.stopPropagation?.(); onNavigate('event'); }}>Anmelden</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        {/* ─── Upcoming (your fixtures) ─── */}
        <Section title="Deine Termine" action={() => {}}>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {d.upcoming.map(r => (
              <Card key={r.id} padded={false} style={{ display: 'flex', alignItems: 'center', padding: 12, gap: 14 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: t.primaryBg, border: `1px solid ${t.borderStr}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.primaryLight, lineHeight: 1 }}>{r.d}</span>
                  <span style={{ fontFamily: t.fontUI, fontSize: 9, color: t.primaryLight, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{r.m}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: 600, color: t.textP, letterSpacing: -0.2 }}>{r.event}</div>
                  <div style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textS, marginTop: 2, display: 'flex', gap: 10 }}>
                    <span>⏱ {r.time}</span>
                    <span>· Partner: {r.partner}</span>
                  </div>
                </div>
                <Icon name="chevron" size={16} color={t.textT} />
              </Card>
            ))}
          </div>
        </Section>

        {/* ─── Quick actions ─── */}
        <Section title="Schnellzugriff">
          <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <QuickTile icon="bolt" label="Matchmaking" sub="Finde einen Gegner" hue={260} onClick={() => onNavigate('match')} />
            <QuickTile icon="users" label="Team suchen" sub="Padel Duo" hue={140} />
            <QuickTile icon="pin" label="Courts" sub="Venues in Berlin" hue={200} />
            <QuickTile icon="medal" label="Leaderboard" sub="Top 100" hue={40} />
          </div>
        </Section>

        <div style={{ height: 20 }} />
      </ScrollArea>
    </Screen>
  );
};

// ─── Mini components ───
const Stat = ({ v, l, c, fireIcon }) => {
  const t = window.TURNEO;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ fontFamily: t.fontMono, fontSize: 17, fontWeight: 700, color: c || t.textP, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
        {fireIcon && <Icon name="flame" size={14} color={c || t.gold} />}{v}
      </span>
      <span style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textT, fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase', marginTop: 4 }}>{l}</span>
    </div>
  );
};

const Sparkline = ({ data, width = 310, height = 50 }) => {
  const t = window.TURNEO;
  const min = Math.min(...data), max = Math.max(...data);
  const pad = 4;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / (max - min)) * (height - pad * 2);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width - pad},${height} L${pad},${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.primary} stopOpacity="0.35" />
          <stop offset="100%" stopColor={t.primary} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={t.primaryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={t.primaryLight} stroke={t.bg} strokeWidth="2" />
      <circle cx={last[0]} cy={last[1]} r="9" fill={t.primary} opacity="0.2">
        <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

const LiveMatchCard = ({ m }) => {
  const t = window.TURNEO;
  return (
    <Card padded={false} style={{ width: 280, padding: 14, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <LivePulse />
        <span style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textS, fontWeight: 600, letterSpacing: 0.5 }}>{m.round.toUpperCase()} · {m.court}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MatchRow name={m.p1} scores={m.score} active={m.server === 0} />
        <MatchRow name={m.p2} scores={m.scoreB} active={m.server === 1} />
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: t.fontUI, fontSize: 11, color: t.textS, fontWeight: 500 }}>Satz {m.set} · aktuell</span>
        <span style={{ fontFamily: t.fontMono, fontSize: 14, fontWeight: 700, color: t.coral }}>{m.gameScore}</span>
      </div>
    </Card>
  );
};

const MatchRow = ({ name, scores, active }) => {
  const t = window.TURNEO;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: active ? t.coral : 'transparent' }} />
      <span style={{ flex: 1, fontFamily: t.fontUI, fontSize: 13, color: active ? t.textP : t.textS, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {scores.map((s, i) => (
          <span key={i} style={{
            fontFamily: t.fontMono, fontSize: 15, fontWeight: 700,
            minWidth: 16, textAlign: 'center',
            color: i === scores.length - 1 && active ? t.textP : t.textS,
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
};

const QuickTile = ({ icon, label, sub, hue, onClick }) => {
  const t = window.TURNEO;
  return (
    <button onClick={onClick} style={{
      background: t.bgCard, border: `1px solid ${t.border}`,
      borderRadius: 18, padding: 14, textAlign: 'left', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 10, minHeight: 94,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `linear-gradient(135deg, oklch(0.6 0.17 ${hue}), oklch(0.4 0.15 ${hue - 20}))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: 700, color: t.textP, letterSpacing: -0.2 }}>{label}</div>
        <div style={{ fontFamily: t.fontUI, fontSize: 11.5, color: t.textS, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
};

Object.assign(window, { HomeScreen });
