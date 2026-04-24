// Turneo — Live Match screen + Registration flow
const LiveMatchScreen = ({ onNavigate }) => {
  const t = window.TURNEO;
  const [a, setA] = React.useState([6, 4, 3]);
  const [b, setB] = React.useState([3, 6, 2]);
  const [ga, setGa] = React.useState(40);
  const [gb, setGb] = React.useState(30);

  React.useEffect(() => {
    const id = setInterval(() => {
      setGa(x => (x >= 40 ? 0 : x + 15));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const fmt = g => g === 0 ? '0' : g === 45 ? 'Ad' : `${g}`;

  return (
    <Screen>
      <ScrollArea padBottom={40}>
        <div style={{ padding: '62px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => onNavigate('home')} style={navBtn(t)}><Icon name="chevronL" size={20} color={t.textP} /></button>
          <LivePulse />
          <button style={navBtn(t)}><Icon name="share" size={17} color={t.textP} /></button>
        </div>

        {/* Big scorecard */}
        <div style={{ padding: '14px 20px 0' }}>
          <Card padded={false} style={{
            padding: 18,
            background: `linear-gradient(135deg, rgba(255,71,87,0.12), ${t.bgCard} 60%)`,
            border: '1px solid rgba(255,71,87,0.25)',
          }}>
            <div style={{ textAlign: 'center', fontFamily: t.fontUI, fontSize: 11, color: t.textS, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              Halbfinale · Court 3 · Berlin Masters
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <LiveRow name="Kramer / Weiss" hue={340} sets={a} gameLabel={fmt(ga)} server active />
              <LiveRow name="Rahm / Torres" hue={140} sets={b} gameLabel={fmt(gb)} />
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-around' }}>
              <MicroStat l="Aufschlag" v="72%" />
              <MicroStat l="Winners" v="24" />
              <MicroStat l="Dauer" v="01:12" mono />
            </div>
          </Card>
        </div>

        {/* Upcoming matches today */}
        <Section title="Heute noch" style={{ marginTop: 22 }}>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t1: 'Park / Hoang', t2: 'Silva / Ito', time: '16:30', court: 'Court 2' },
              { t1: 'Abassi / Mu.', t2: 'Lenz / Koch', time: '18:00', court: 'Court 1' },
            ].map((m, i) => (
              <Card key={i} padded={false} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontFamily: t.fontMono, fontSize: 14, fontWeight: 700, color: t.primaryLight, width: 48 }}>{m.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: t.fontUI, fontSize: 13, color: t.textP, fontWeight: 600 }}>{m.t1} <span style={{ color: t.textT }}>vs</span> {m.t2}</div>
                  <div style={{ fontFamily: t.fontUI, fontSize: 11, color: t.textS, marginTop: 2 }}>{m.court}</div>
                </div>
                <Icon name="chevron" size={16} color={t.textT} />
              </Card>
            ))}
          </div>
        </Section>
      </ScrollArea>
    </Screen>
  );
};

const LiveRow = ({ name, hue, sets, gameLabel, server, active }) => {
  const t = window.TURNEO;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name={name} hue={hue} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: t.fontUI, fontSize: 13, color: t.textP, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {server && <span style={{ width: 6, height: 6, borderRadius: 999, background: t.coral }} />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        {sets.map((s, i) => (
          <span key={i} style={{
            fontFamily: t.fontMono, fontSize: 22, fontWeight: 700, minWidth: 20, textAlign: 'center',
            color: i === sets.length - 1 ? t.textP : t.textS,
          }}>{s}</span>
        ))}
        <span style={{
          fontFamily: t.fontMono, fontSize: 26, fontWeight: 800,
          color: active ? t.coral : t.textP, minWidth: 40, textAlign: 'center',
          marginLeft: 6, padding: '4px 10px', borderRadius: 8,
          background: active ? t.coralBg : 'transparent',
        }}>{gameLabel}</span>
      </div>
    </div>
  );
};

const MicroStat = ({ l, v, mono }) => {
  const t = window.TURNEO;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: mono ? t.fontMono : t.fontDisplay, fontSize: 17, fontWeight: 700, color: t.textP }}>{v}</div>
      <div style={{ fontFamily: t.fontUI, fontSize: 10, color: t.textT, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
    </div>
  );
};

// ─── Registration bottom sheet ───
const RegisterSheet = ({ open, onClose, onDone }) => {
  const t = window.TURNEO;
  const [step, setStep] = React.useState(0); // 0 type, 1 pay, 2 done
  const [type, setType] = React.useState('duo');

  React.useEffect(() => { if (open) setStep(0); }, [open]);

  if (!open) return null;

  const types = [
    { k: 'solo', l: 'Einzel', s: 'Allein antreten' },
    { k: 'duo', l: 'Duo', s: 'Mit Partner anmelden' },
    { k: 'team', l: 'Team', s: '4-er Team' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadein .25s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: t.bgElev, borderRadius: '28px 28px 0 0',
        padding: '12px 20px 34px',
        border: `1px solid ${t.border}`, borderBottom: 'none',
        animation: 'slideup .35s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: t.borderStr, margin: '0 auto 16px' }} />

        {step === 0 && (
          <>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 800, color: t.textP, letterSpacing: -0.5 }}>Anmeldung</div>
            <div style={{ fontFamily: t.fontUI, fontSize: 13, color: t.textS, marginTop: 4 }}>Wähle deinen Anmeldetyp</div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map(ty => (
                <button key={ty.k} onClick={() => setType(ty.k)} style={{
                  padding: 14, borderRadius: 16, textAlign: 'left', cursor: 'pointer',
                  background: type === ty.k ? t.primaryBg : t.bgCard,
                  border: `1px solid ${type === ty.k ? t.primary : t.border}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999,
                    border: `2px solid ${type === ty.k ? t.primary : t.borderStr}`,
                    background: type === ty.k ? t.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{type === ty.k && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: 700, color: t.textP, letterSpacing: -0.2 }}>{ty.l}</div>
                    <div style={{ fontFamily: t.fontUI, fontSize: 12, color: t.textS, marginTop: 1 }}>{ty.s}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: t.bgCard, border: `1px solid ${t.border}` }}>
              <Line l="Startgebühr" v="45,00 €" />
              <Line l="Plus Rabatt (−10%)" v="−4,50 €" c={t.primaryLight} />
              <div style={{ height: 1, background: t.divider, margin: '10px 0' }} />
              <Line l="Gesamt" v="40,50 €" bold />
            </div>

            <div style={{ marginTop: 16 }}>
              <Button variant="primary" size="lg" full icon="arrowR" onClick={() => setStep(1)}>Weiter zur Zahlung</Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: 800, color: t.textP, letterSpacing: -0.5 }}>Zahlung</div>
            <div style={{ fontFamily: t.fontUI, fontSize: 13, color: t.textS, marginTop: 4 }}>Stripe · SSL gesichert</div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: t.bgCard, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 26, borderRadius: 5, background: 'linear-gradient(135deg, #000, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 9, letterSpacing: 0.5 }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: t.fontUI, fontSize: 13, fontWeight: 600, color: t.textP }}>Apple Pay</div>
                <div style={{ fontFamily: t.fontMono, fontSize: 11, color: t.textS, marginTop: 1 }}>•••• 4242</div>
              </div>
              <Icon name="check" size={18} color="#10B981" />
            </div>

            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: t.primaryBg, border: `1px solid ${t.borderStr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="shield" size={14} color={t.primaryLight} />
              <span style={{ fontFamily: t.fontUI, fontSize: 11.5, color: t.textS }}>75% Rückerstattung bis 14 Tage vor Turnier</span>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button variant="primary" size="lg" full onClick={() => setStep(2)}>
                40,50 € bezahlen
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 999, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #10B981, #047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 14px 36px -10px rgba(16,185,129,0.5)',
              animation: 'pop .4s cubic-bezier(.3,1.3,.6,1)',
            }}>
              <Icon name="check" size={42} color="#fff" strokeWidth={3} />
            </div>
            <div style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 800, color: t.textP, letterSpacing: -0.5 }}>Du bist dabei!</div>
            <div style={{ fontFamily: t.fontUI, fontSize: 13.5, color: t.textS, marginTop: 6, lineHeight: 1.5 }}>
              Berlin Masters 2026 · 9. Mai<br/>Wir senden dir 24h vorher eine Erinnerung.
            </div>
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" size="lg" full onClick={onDone}>Fertig</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Line = ({ l, v, c, bold }) => {
  const t = window.TURNEO;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontFamily: t.fontUI, fontSize: 13, color: bold ? t.textP : t.textS, fontWeight: bold ? 700 : 500 }}>{l}</span>
      <span style={{ fontFamily: t.fontMono, fontSize: 13, color: c || (bold ? t.textP : t.textP), fontWeight: bold ? 800 : 600 }}>{v}</span>
    </div>
  );
};

Object.assign(window, { LiveMatchScreen, RegisterSheet });
