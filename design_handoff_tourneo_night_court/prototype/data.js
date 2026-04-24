// Turneo — sample data for the prototype
window.TURNEO_DATA = {
  user: {
    name: 'Lukas Groß',
    handle: '@lukasg',
    tier: 'plus',
    elo: 1842,
    eloDelta: +24,
    rank: 'A',
    wins: 34, losses: 18, wr: 65,
    streak: 4,
  },
  eloHistory: [1620, 1648, 1605, 1670, 1712, 1689, 1735, 1768, 1742, 1790, 1815, 1842],

  liveMatches: [
    { id: 'm1', court: 'Court 3', round: 'Halbfinale', score: [6, 4, 3], scoreB: [3, 6, 2], p1: 'M. Kramer / J. Weiss', p2: 'T. Rahm / A. Torres', set: 3, gameScore: '40-30', server: 0 },
    { id: 'm2', court: 'Court 1', round: 'Finale', score: [6, 7], scoreB: [4, 5], p1: 'S. Neumann / R. Feldt', p2: 'L. Groß / C. Berger', set: 2, gameScore: '30-15', server: 1 },
  ],

  heroEvent: {
    id: 'e1', title: 'Berlin Masters 2026', sub: 'Padel Open · Intermediate',
    city: 'Berlin', venue: 'Padel Republic Kreuzberg',
    date: '2026-05-09', dateLabel: 'Sa, 9. Mai',
    fee: 45, feePlus: 40.5,
    prize: 3500, currency: '€',
    spots: 32, filled: 28,
    organiser: 'Padel Republic',
  },

  tournaments: [
    { id: 'e1', title: 'Berlin Masters 2026', city: 'Berlin', date: '9. Mai', level: 'Intermediate', prize: 3500, fee: 45, filled: 28, spots: 32, sport: 'padel', tag: 'FEATURED' },
    { id: 'e2', title: 'Münchner Frühlingscup', city: 'München', date: '14. Mai', level: 'Advanced', prize: 2200, fee: 35, filled: 24, spots: 32, sport: 'padel' },
    { id: 'e3', title: 'Hamburg Hafen Duos', city: 'Hamburg', date: '22. Mai', level: 'Beginner', prize: 900, fee: 20, filled: 10, spots: 24, sport: 'padel', tag: 'NEW' },
    { id: 'e4', title: 'Köln Night League', city: 'Köln', date: '30. Mai', level: 'Pro', prize: 5000, fee: 65, filled: 30, spots: 32, sport: 'padel', tag: 'CLUB+' },
    { id: 'e5', title: 'Frankfurt Mixed Open', city: 'Frankfurt', date: '6. Juni', level: 'Intermediate', prize: 1600, fee: 30, filled: 16, spots: 32, sport: 'padel' },
  ],

  upcoming: [
    { id: 'r1', event: 'Berlin Masters 2026', partner: 'M. Kramer', date: '9. Mai', time: '10:00', court: 'Padel Republic', d: 9, m: 'Mai' },
    { id: 'r2', event: 'Saturday Social', partner: 'Solo', date: '3. Mai', time: '18:30', court: 'Pad-X Mitte', d: 3, m: 'Mai' },
  ],

  friends: [
    { name: 'Maya Kramer', hue: 340, elo: 1920, online: true },
    { name: 'Jonas Weiss', hue: 200, elo: 1755, online: true },
    { name: 'Tobi Rahm', hue: 140, elo: 1690, online: false },
    { name: 'Anja Torres', hue: 30, elo: 1810, online: true },
    { name: 'Rafa Feldt', hue: 280, elo: 1602, online: false },
  ],

  achievements: [
    { icon: 'crown', label: 'First Trophy', hue: 45 },
    { icon: 'flame', label: '5-Win Streak', hue: 15 },
    { icon: 'bolt', label: 'Quick Draw', hue: 260 },
    { icon: 'shield', label: 'Unbeaten Week', hue: 180 },
  ],
};
