// Turneo — Event Detail
const EventScreen = ({ onNavigate, onRegister }) => {
  const t = window.TURNEO;
  const d = window.TURNEO_DATA;
  const e = d.heroEvent;
  const fill = (e.filled / e.spots) * 100;

  return (
    <Screen>
      <ScrollArea padBottom={120}>
        {/* Hero banner */}
        <div style={{
          height: 340, position: 'relative', overflow: 'hidden',
          background: `
            radial-gradient(ellipse at 25% 25%, rgba(99,102,241,0.55), transparent 55%),
            radial-gradient(ellipse at 80% 75%, rgba(245,158,11,0.35), transparent 50%),
            linear-gradient(160deg, #1A1A3D 0%, #0D0D1A 100%)`,
        }}>
          {/* court diagram */}
          <svg width="100%" height="100%" viewBox="0 0 400 340" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
            <rect x="40" y="60" width="320" height="220" rx="4" stroke="#A5B4FC" strokeWidth="1.5" fill="none"/>
            <line x1="200" y1="60" x2="200" y2="280" stroke="#A5B4FC" strokeWidth="1.5"/>
            <line x1="40" y1="170" x2="360" y2="170" stroke="#A5B4FC" strokeWidth="1.5"/>
            <line x1="110" y1="60" x2="110" y2="280" stroke="#A5B4FC" strokeWidth="0.8"/>
            <line x1="290" y1="60" x2="290" y2="280" stroke="#A5B4FC" strokeWidth="0.8"/>
          </svg>

          {/* nav */}
          <div style={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
            <button onClick={() => onNavigate('home')} style={navBtn(t)}><Icon name="chevronL" size={20} color={t.textP} /></button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={navBtn(t)}><Icon name="share" size={17} color={t.textP} /></button>
              <button style={navBtn(t)}><Icon name="heart" size={17} color={t.textP} /></button>
            </div>
          </div>

          {/* big prize */}
          <div style={{ position: 'absolute', bottom: 30, left: 20, right: 20 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <Pill color="#fff" bg={t.primary}>PADEL · INTERMEDIATE</Pill>
              <Pill color={t.gold} bg={t.goldBg}>GARANTIERT</Pill>
            </div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 30, fontWeight: 800, color: t.textP, letterSpacing: -0.8, lineHeight: 1.05 }}>{e.title}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: t.fontUI, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={14} />{e.dateLabel}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={14} />{e.venue}</span>
            </div>
          </div>
        </div>

        {/* Prize pool breakdown */}
        <div style={{ padding: '20px 20px 0' }}>
          <Card padded={false} style={{
            padding: 18,
            background: `linear-gradient(135deg, rgba(245,158,11,0.14) 0%, ${t.bgCard} 60%)`,
            border: `1px solid rgba(245,158,11,0.25)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: t.fontUI, fontSize: 11, color: t.gold, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Prize Pool</div>
                <div style={{ fontFamily: t.fontDisplay, fontSize: 30, fontWeight: 800, color: t.gold, letterSpacing: -0.8, lineHeight: 1 }}>{e.prize.toLocaleString('de')}€</div>
              </div>
              <Icon name="trophy" size={38} color={t.gold} strokeWidth={1.6} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <PrizeRow rank="1" amt="1.750€" color={t.gold} />
              <PrizeRow rank="2" amt="1.050€" color="#CBD5E1" />
              <PrizeRow rank="3" amt="700€" color="#D97706" />
            </div>
          </Card>
        </div>

        {/* Spots + Stats */}
        <div style={{ padding: '16px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <InfoTile label="Plätze" value={`${e.filled}/${e.spots}`} sub={`${(e.spots - e.filled)} frei`} progress={fill} />
          <InfoTile label="Format" value="Single Elim." sub="3 Sätze · Best of" />
        </div>

        {/* Bracket preview */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontFamily: t.fontDisplay, fontSize: 16, fontWeight: 700, color: t.textP, margin: 0, letterSpacing: -0.3 }}>Turnierbaum Vorschau</h3>
            <span style={{ fontFamily: t.fontUI, fontSize: 11, color: t.primaryLight, fontWeight: 600 }}>Single Elim.</span>
          </div>
          <Card padded={false} style={{ padding: 14, overflowX: 'auto' }}>
            <BracketSVG />
          </Card>
        </div>

        {/* About */}
        <div style={{ padding: '20px 20px 0' }}>
          <h3 style={{ fontFamily: t.fontDisplay, fontSize: 16, fontWeight: 700, color: t.textP, margin: '0 0 10px', letterSpacing: -0.3 }}>Über das Turnier</h3>
          <p style={{ fontFamily: t.fontUI, fontSize: 13.5, color: t.textS, lineHeight: 1.55, margin: 0 }}>
            Dreitägiges Padel-Turnier im Padel Republic Kreuzberg. Duo-Format, Single-Elimination Bracket mit Seeding. Check-in 60 min vor Startzeit. Prize money direkt via Stripe ausbezahlt.
          </p>
        </div>

        {/* Organiser */}
        <div style={{ padding: '20px 20px 0' }}>
          <Card padded={false} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Padel Republic" hue={220} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: 700, color: t.textP, letterSpacing: -0.2 }}>Padel Republic</div>
              <div style={{ fontFamily: t.fontUI, fontSize: 11.5, color: t.textS, marginTop: 2 }}>Verifizierter Veranstalter · 24 Turniere</div>
            </div>
            <Button variant="ghost" size="sm">Folgen</Button>
          </Card>
        </div>

        <div style={{ height: 20 }} />
      </ScrollArea>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
        padding: '14px 20px 28px',
        background: `linear-gradient(to top, ${t.bg} 60%, rgba(10,10,20,0))`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Plus-Preis</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.textP, letterSpacing: -0.5 }}>{e.feePlus}€</span>
            <span style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textT, textDecoration: 'line-through' }}>{e.fee}€</span>
          </div>
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <Button variant="primary" size="lg" full icon="arrowR" onClick={onRegister}>Anmelden</Button>
        </div>
      </div>
    </Screen>
  );
};

const navBtn = t => ({
  width: 40, height: 40, borderRadius: 999,
  background: 'rgba(10,10,20,0.55)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${t.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

const PrizeRow = ({ rank, amt, color }) => {
  const t = window.TURNEO;
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12,
      padding: '10px 12px', border: `1px solid ${t.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <Icon name="medal" size={13} color={color} strokeWidth={2} />
        <span style={{ fontFamily: t.fontDisplay, fontSize: 11, color, fontWeight: 700, letterSpacing: 0.2 }}>#{rank}</span>
      </div>
      <div style={{ fontFamily: t.fontDisplay, fontSize: 15, fontWeight: 800, color: t.textP, letterSpacing: -0.3 }}>{amt}</div>
    </div>
  );
};

const InfoTile = ({ label, value, sub, progress }) => {
  const t = window.TURNEO;
  return (
    <Card padded={false} style={{ padding: 14 }}>
      <div style={{ fontFamily: t.fontUI, fontSize: 10.5, color: t.textT, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 700, color: t.textP, letterSpacing: -0.4, marginTop: 4 }}>{value}</div>
      <div style={{ fontFamily: t.fontUI, fontSize: 11.5, color: t.textS, marginTop: 2 }}>{sub}</div>
      {progress != null && (
        <div style={{ height: 4, borderRadius: 999, background: t.bgInput, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${t.primary}, ${t.primaryLight})` }} />
        </div>
      )}
    </Card>
  );
};

const BracketSVG = () => {
  const t = window.TURNEO;
  // 4 QF matches -> 2 SF -> 1 F
  const matches = [
    { p1: 'Kramer/Weiss', p2: 'Rahm/Torres', w: 0, x: 0 },
    { p1: 'Neumann/Feldt', p2: 'Groß/Berger', w: 1, x: 0 },
    { p1: 'Park/Hoang', p2: 'Silva/Ito', w: 0, x: 0 },
    { p1: 'Abassi/Mu.', p2: 'Lenz/Koch', w: 1, x: 0 },
  ];
  const W = 540, H = 240;
  return (
    <svg width={W} height={H} style={{ display: 'block', minWidth: W }}>
      {/* round labels */}
      {['QF', 'SF', 'F'].map((r, i) => (
        <text key={r} x={50 + i * 180} y={14} fontFamily={t.fontUI} fontSize="10" fontWeight="700" fill={t.textT} letterSpacing="1">{r}</text>
      ))}
      {/* QF */}
      {matches.map((m, i) => {
        const y = 28 + i * 48;
        return (
          <g key={i}>
            <rect x="10" y={y} width="140" height="36" rx="8" fill={t.bgInput} stroke={t.border} />
            <text x="18" y={y + 15} fontFamily={t.fontUI} fontSize="10" fontWeight={m.w === 0 ? 700 : 500} fill={m.w === 0 ? t.textP : t.textS}>{m.p1}</text>
            <text x="18" y={y + 29} fontFamily={t.fontUI} fontSize="10" fontWeight={m.w === 1 ? 700 : 500} fill={m.w === 1 ? t.textP : t.textS}>{m.p2}</text>
            {/* connector */}
            <path d={`M150 ${y + 18} H175 V ${76 + Math.floor(i / 2) * 96} H 190`} stroke={t.border} fill="none" />
          </g>
        );
      })}
      {/* SF */}
      {[0, 1].map(i => {
        const y = 58 + i * 96;
        const winners = i === 0 ? ['Kramer/Weiss', 'Groß/Berger'] : ['Silva/Ito', 'Lenz/Koch'];
        return (
          <g key={i}>
            <rect x="190" y={y} width="140" height="36" rx="8" fill={t.bgInput} stroke={t.primary} strokeWidth="1" />
            <text x="198" y={y + 15} fontFamily={t.fontUI} fontSize="10" fontWeight="600" fill={t.textP}>{winners[0]}</text>
            <text x="198" y={y + 29} fontFamily={t.fontUI} fontSize="10" fontWeight="600" fill={t.textS}>{winners[1]}</text>
            <path d={`M330 ${y + 18} H360 V 120 H 375`} stroke={t.border} fill="none" />
          </g>
        );
      })}
      {/* Final */}
      <rect x="375" y="102" width="150" height="40" rx="10" fill="url(#finalg)" stroke={t.gold} strokeWidth="1.5" />
      <defs>
        <linearGradient id="finalg" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(245,158,11,0.2)" />
          <stop offset="1" stopColor="rgba(99,102,241,0.15)" />
        </linearGradient>
      </defs>
      <text x="385" y="119" fontFamily={t.fontUI} fontSize="10.5" fontWeight="700" fill={t.textP}>Groß/Berger</text>
      <text x="385" y="134" fontFamily={t.fontUI} fontSize="10.5" fontWeight="700" fill={t.textS}>TBD</text>
      <g transform="translate(495, 115)">
        <circle r="12" fill={t.gold} fillOpacity="0.18" />
        <g transform="translate(-6, -6)">
          <path d="M4 2h4v2a2 2 0 11-4 0V2z" fill={t.gold} />
        </g>
      </g>
    </svg>
  );
};

Object.assign(window, { EventScreen });
