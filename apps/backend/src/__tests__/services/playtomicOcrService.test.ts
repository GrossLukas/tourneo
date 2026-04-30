import { PlaytomicOcrService } from '../../services/playtomicOcrService';

describe('PlaytomicOcrService.parse', () => {
  it('extracts name, level and points from a typical Playtomic profile text', () => {
    const result = PlaytomicOcrService.parse(`
      Max Mustermann
      Playtomic
      Level 2.7
      Ranking Punkte 1430
    `);

    expect(result).toEqual({
      name: 'Max Mustermann',
      level: 2.7,
      points: 1430,
    });
  });

  it('handles German labels and comma decimal levels', () => {
    const result = PlaytomicOcrService.parse(`
      Spielerprofil
      Anna Becker
      Spielstärke 1,9
      Punkte: 870
    `);

    expect(result.level).toBe(1.9);
    expect(result.points).toBe(870);
    expect(result.name).toBe('Anna Becker');
  });

  it('returns null fields when OCR text is not useful', () => {
    const result = PlaytomicOcrService.parse('Playtomic ranking profile club matches');

    expect(result).toEqual({
      name: null,
      level: null,
      points: null,
    });
  });
});
