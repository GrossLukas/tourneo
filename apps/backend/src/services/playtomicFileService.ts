import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db, t } from '../config/database';

const TOKEN_PREFIX = 'private:playtomic/';

export class PlaytomicFileService {
  static async store(userId: number, buffer: Buffer, mimetype: string): Promise<string> {
    const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${userId}_${uuidv4()}.${ext}`;
    const dir = this.storageDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    return `${TOKEN_PREFIX}${filename}`;
  }

  static async resolveForUser(userId: number): Promise<{ filepath: string; contentType: string } | null> {
    const profile = await db(t('profiles')).where('user_id', userId).first();
    if (!profile?.playtomic_screenshot_url) return null;
    return this.resolveToken(profile.playtomic_screenshot_url);
  }

  static async purgeForUser(userId: number): Promise<void> {
    const profile = await db(t('profiles')).where('user_id', userId).first();
    const resolved = profile?.playtomic_screenshot_url
      ? this.resolveToken(profile.playtomic_screenshot_url)
      : null;
    if (resolved) {
      try {
        await fs.unlink(resolved.filepath);
      } catch {
        // Best effort: the DB state is still cleared by the caller.
      }
    }
  }

  private static resolveToken(token: string): { filepath: string; contentType: string } | null {
    if (!token.startsWith(TOKEN_PREFIX)) return null;
    const filename = token.slice(TOKEN_PREFIX.length);
    if (!/^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(filename)) return null;

    const filepath = path.join(this.storageDir(), filename);
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { filepath, contentType };
  }

  private static storageDir(): string {
    return path.resolve(process.cwd(), 'private_uploads', 'playtomic');
  }
}
