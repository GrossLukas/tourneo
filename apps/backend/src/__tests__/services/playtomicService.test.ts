import { PlaytomicService } from '../../services/playtomicService';

describe('PlaytomicService.levelToElo', () => {
  it('maps anchor points correctly', () => {
    expect(PlaytomicService.levelToElo(0)).toBe(700);
    expect(PlaytomicService.levelToElo(1)).toBe(850);
    expect(PlaytomicService.levelToElo(2)).toBe(950);
    expect(PlaytomicService.levelToElo(3)).toBe(1050);
    expect(PlaytomicService.levelToElo(4)).toBe(1150);
    expect(PlaytomicService.levelToElo(5)).toBe(1280);
    expect(PlaytomicService.levelToElo(6)).toBe(1400);
    expect(PlaytomicService.levelToElo(7)).toBe(1550);
  });

  it('interpolates between anchors', () => {
    // 1.5 should be between 850 and 950 → 900
    expect(PlaytomicService.levelToElo(1.5)).toBe(900);
    // 3.5 between 1050 and 1150 → 1100
    expect(PlaytomicService.levelToElo(3.5)).toBe(1100);
    // 4.5 between 1150 and 1280 → 1215
    expect(PlaytomicService.levelToElo(4.5)).toBe(1215);
  });

  it('clamps below 0 and above 7', () => {
    expect(PlaytomicService.levelToElo(-1)).toBe(700);
    expect(PlaytomicService.levelToElo(10)).toBe(1550);
  });

  it('monotonically increasing', () => {
    let prev = -Infinity;
    for (let lvl = 0; lvl <= 7; lvl += 0.1) {
      const elo = PlaytomicService.levelToElo(lvl);
      expect(elo).toBeGreaterThanOrEqual(prev);
      prev = elo;
    }
  });

  it('always within reasonable ELO range', () => {
    for (let lvl = 0; lvl <= 7; lvl += 0.5) {
      const elo = PlaytomicService.levelToElo(lvl);
      expect(elo).toBeGreaterThanOrEqual(400);
      expect(elo).toBeLessThanOrEqual(2000);
    }
  });
});
