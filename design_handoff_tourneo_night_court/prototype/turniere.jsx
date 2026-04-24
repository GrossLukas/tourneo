// Turneo — Tournaments (Turniere) discovery screen
const TurniereScreen = ({ onNavigate }) => {
  const t = window.TURNEO;
  const d = window.TURNEO_DATA;
  const [filter, setFilter] = React.useState('Alle');
  const [search, setSearch] = React.useState('');

  const levels = ['Alle', 'Beginner', 'Intermediate', 'Advanced', 'Pro'];

  const filtered = d.tournaments.filter(e =>
    (filter === 'Alle' || e.level === filter) &&
    (search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Screen>
      {/* Header */}
      <div style={{ padding: '62px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textT, fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase' }}>Entdecke</div>
            <h1 style={{ fontFamily: t.fontDisplay, fontSize: 30, fontWeight: 800, color: t.textP, margin: '2px 0 0', letterSpacing: -0.8 }}>Turniere</h1>
          </div>
          <button style={{
            width: 42, height: 42, borderRadius: 999,
            background: t.bgCard, border: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="filter" size={19} color={t.textP} />
          </button>
        </div>

        {/* search */}
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', gap: 10,
          background: t.bgInput, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: '12px 14px',
        }}>
          <Icon name="search" size={17} color={t.textT} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Turnier oder Stadt suchen…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: t.textP, fontFamily: t.fontUI, fontSize: 14,
            }}
          />
        </div>
      </div>

      <ScrollArea>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {levels.map(l => (
            <button key={l} onClick={() => setFilter(l)} style={{
              padding: '8px 14px', borderRadius: 999, flexShrink: 0, cursor: 'pointer',
              background: filter === l ? t.primary : t.bgCard,
              border: `1px solid ${filter === l ? t.primary : t.border}`,
              color: filter === l ? '#fff' : t.textS,
              fontFamily: t.fontUI, fontSize: 12.5, fontWeight: 600, letterSpacing: -0.1,
            }}>{l}</button>
          ))}
        </div>

        {/* Tournaments list */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(e => <TournamentCard key={e.id} e={e} onClick={() => onNavigate('event')} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: t.textS, padding: 40, fontFamily: t.fontUI }}>Keine Turniere gefunden</div>
          )}
        </div>

        <div style={{ height: 20 }} />
      </ScrollArea>
    </Screen>
  );
};

const TournamentCard = ({ e, onClick }) => {
  const t = window.TURNEO;
  const fill = (e.filled / e.spots) * 100;
  const tagColor = e.tag === 'FEATURED' ? { c: '#fff', bg: t.primary } :
                   e.tag === 'NEW' ? { c: '#10B981', bg: 'rgba(16,185,129,0.15)' } :
                   e.tag === 'CLUB+' ? { c: t.gold, bg: t.goldBg } : null;
  const levelHue = e.level === 'Beginner' ? 140 : e.level === 'Intermediate' ? 200 : e.level === 'Advanced' ? 280 : 15;
  return (
    <Card padded={false} onClick={onClick} style={{ padding: 14, cursor: 'pointer' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {/* left visual */}
        <div style={{
          width: 72, flexShrink: 0, borderRadius: 14,
          background: `linear-gradient(160deg, oklch(0.4 0.14 ${levelHue}) 0%, oklch(0.22 0.1 ${levelHue}) 100%)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontFamily: t.fontUI, fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>{e.date.split(' ')[1]?.toUpperCase()}</div>
          <div style={{ fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.8, lineHeight: 1 }}>{e.date.split(' ')[0].replace('.', '')}</div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            fontFamily: t.fontUI, fontSize: 8.5, color: 'rgba(255,255,255,0.55)',
            fontWeight: 700, letterSpacing: 0.7, textAlign: 'center', padding: '3px 0 4px',
            background: 'rgba(0,0,0,0.3)',
          }}>{e.level.toUpperCase()}</div>
        </div>
        {/* content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            {e.tag && tagColor && <Pill color={tagColor.c} bg={tagColor.bg}>{e.tag}</Pill>}
          </div>
          <div style={{ fontFamily: t.fontDisplay, fontSize: 15.5, fontWeight: 700, color: t.textP, letterSpacing: -0.3, lineHeight: 1.2 }}>{e.title}</div>
          <div style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textS, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={12} color={t.textT} />{e.city}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: t.bgInput, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${fill}%`, borderRadius: 999,
                  background: fill > 85 ? t.coral : t.primary,
                }} />
              </div>
              <div style={{ fontFamily: t.fontMono, fontSize: 10, color: t.textS, fontWeight: 600, marginTop: 4 }}>{e.filled}/{e.spots} Plätze</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: t.fontUI, fontSize: 9.5, color: t.textT, fontWeight: 600, letterSpacing: 0.6 }}>PRIZE</div>
              <div style={{ fontFamily: t.fontDisplay, fontSize: 17, fontWeight: 800, color: t.gold, letterSpacing: -0.3, lineHeight: 1 }}>{e.prize.toLocaleString('de')}€</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

Object.assign(window, { TurniereScreen, TournamentCard });
