import crypto from 'crypto';
import sharp from 'sharp';
import { db, t } from '../config/database';

export type PlaytomicOcrResult = {
  status: 'success' | 'failed';
  rawText: string | null;
  level: number | null;
  name: string | null;
  points: number | null;
  sha256: string;
  phash: string | null;
  duplicateUserId: number | null;
};

type ParsedPlaytomicText = {
  level: number | null;
  name: string | null;
  points: number | null;
};

export class PlaytomicOcrService {
  static async analyzeAndPersist(userId: number, buffer: Buffer): Promise<PlaytomicOcrResult> {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const phash = await this.averageHash(buffer).catch((err) => {
      console.warn('[playtomic-ocr] phash failed:', err?.message || err);
      return null;
    });

    const rawText = await this.runOcr(buffer).catch((err) => {
      console.warn('[playtomic-ocr] OCR failed:', err?.message || err);
      return null;
    });
    const parsed = rawText ? this.parse(rawText) : { level: null, name: null, points: null };
    const status: 'success' | 'failed' =
      rawText && (parsed.level !== null || parsed.name || parsed.points !== null) ? 'success' : 'failed';

    const duplicate = await this.findDuplicate(userId, sha256, phash);
    const result: PlaytomicOcrResult = {
      status,
      rawText,
      level: parsed.level,
      name: parsed.name,
      points: parsed.points,
      sha256,
      phash,
      duplicateUserId: duplicate?.user_id ? Number(duplicate.user_id) : null,
    };

    await db(t('profiles')).where('user_id', userId).update({
      playtomic_ocr_status: result.status,
      playtomic_ocr_level: result.level,
      playtomic_ocr_name: result.name,
      playtomic_ocr_points: result.points,
      playtomic_ocr_raw_text: rawText ? rawText.slice(0, 5000) : null,
      playtomic_screenshot_sha256: sha256,
      playtomic_screenshot_phash: phash,
      playtomic_duplicate_user_id: result.duplicateUserId,
      playtomic_duplicate_warning_at: result.duplicateUserId ? new Date() : null,
      ...(result.level !== null ? { playtomic_level: result.level } : {}),
      updated_at: new Date(),
    });

    return result;
  }

  static parse(rawText: string): ParsedPlaytomicText {
    const normalized = rawText
      .replace(/\r/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();
    const lower = normalized.toLowerCase();

    const level =
      this.pickNumber(lower, [
        /(?:level|niveau|nivel|rating|ranking|rang|klasse|spielst[aä]rke)\D{0,24}([0-7](?:[,.]\d)?)/i,
        /([0-7](?:[,.]\d)?)\D{0,12}(?:level|niveau|nivel|rating|ranking|rang)/i,
      ], 0, 7) ?? this.pickLikelyLevel(lower);

    const points = this.pickInteger(lower, [
      /(?:rankingpunkte|ranking-punkte|punkte|points|pts|puntos)\D{0,24}(\d{2,6})/i,
      /(\d{2,6})\D{0,12}(?:rankingpunkte|ranking-punkte|punkte|points|pts|puntos)/i,
    ]);

    return {
      level,
      points,
      name: this.pickName(normalized),
    };
  }

  private static async runOcr(buffer: Buffer): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tesseract = require('tesseract.js');
    const result = await tesseract.recognize(buffer, 'eng+deu');
    const text = result?.data?.text;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  }

  private static async averageHash(buffer: Buffer): Promise<string> {
    const pixels = await sharp(buffer)
      .rotate()
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();
    const average = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
    let bits = '';
    for (const value of pixels) bits += value >= average ? '1' : '0';
    let hex = '';
    for (let i = 0; i < bits.length; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  }

  private static async findDuplicate(userId: number, sha256: string, phash: string | null) {
    return db(t('profiles'))
      .whereNot('user_id', userId)
      .where(function () {
        this.where('playtomic_screenshot_sha256', sha256);
        if (phash) this.orWhere('playtomic_screenshot_phash', phash);
      })
      .select('user_id')
      .first();
  }

  private static pickNumber(
    source: string,
    patterns: RegExp[],
    min: number,
    max: number
  ): number | null {
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (!match?.[1]) continue;
      const value = Number(match[1].replace(',', '.'));
      if (Number.isFinite(value) && value >= min && value <= max) {
        return Math.round(value * 10) / 10;
      }
    }
    return null;
  }

  private static pickInteger(source: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (!match?.[1]) continue;
      const value = Number(match[1].replace(/[^\d]/g, ''));
      if (Number.isInteger(value) && value > 0) return value;
    }
    return null;
  }

  private static pickLikelyLevel(source: string): number | null {
    const candidates = source.match(/\b[0-7][,.]\d\b/g) || [];
    const values = candidates
      .map((candidate) => Number(candidate.replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 7);
    if (!values.length) return null;
    return Math.round(values[0] * 10) / 10;
  }

  private static pickName(rawText: string): string | null {
    const blocked = [
      'playtomic',
      'ranking',
      'rating',
      'level',
      'niveau',
      'points',
      'punkte',
      'match',
      'matches',
      'profile',
      'profil',
      'club',
    ];
    const lines = rawText
      .split('\n')
      .map((line) => line.replace(/[^\p{L}\p{M}\s.'-]/gu, '').replace(/\s+/g, ' ').trim())
      .filter((line) => line.length >= 2 && line.length <= 80);

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (blocked.some((word) => lower.includes(word))) continue;
      const wordCount = line.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 1 && /[A-Za-z\u00C0-\u017F]/.test(line)) return line;
    }
    return null;
  }
}
