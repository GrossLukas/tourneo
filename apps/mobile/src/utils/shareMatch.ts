import { Linking, Share } from 'react-native';
import { deepLinks } from './deepLinks';

/**
 * shareMatchResult — emits a formatted share sheet with a rich text snippet
 * describing a completed match. Consumers pass the relevant details; the
 * format adapts to available fields (score, winner, venue, delta).
 */
export interface ShareMatchPayload {
  winnerName: string;
  loserName: string;
  sets?: Array<{ p1: number; p2: number }>;
  eventTitle?: string;
  venueName?: string;
  sport?: 'padel' | 'fifa';
  eloDelta?: number;
  matchUrl?: string;
}

export async function shareMatchResult(p: ShareMatchPayload): Promise<boolean> {
  const sportIcon = p.sport === 'fifa' ? '🎮' : '🏸';
  const scoreLine = p.sets?.length
    ? p.sets.map((s) => `${s.p1}-${s.p2}`).join(' · ')
    : '';
  const deltaLine = p.eloDelta ? `ELO ${p.eloDelta > 0 ? '+' : ''}${p.eloDelta}` : '';

  const lines = [
    `${sportIcon} ${p.winnerName} schlägt ${p.loserName}`,
    scoreLine,
    p.eventTitle ?? '',
    p.venueName ? `📍 ${p.venueName}` : '',
    deltaLine,
    p.matchUrl ?? '',
    '#tourneo',
  ].filter(Boolean);

  try {
    await Share.share({
      message: lines.join('\n'),
      url: p.matchUrl,
      title: `${p.winnerName} vs ${p.loserName}`,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * shareTournamentInvite — share a deep-link to join a tournament.
 */
export async function shareTournamentInvite(eventId: number, title: string, startDate?: string): Promise<boolean> {
  const url = deepLinks.event(eventId);
  const lines = [
    `🏆 Komm zu ${title}!`,
    startDate ? `📅 ${new Date(startDate).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}` : '',
    'Melde dich jetzt auf Tourneo an:',
    url,
  ].filter(Boolean);

  try {
    await Share.share({
      message: lines.join('\n'),
      url,
      title,
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareTournamentWhatsApp(eventId: number, title: string, startDate?: string): Promise<boolean> {
  const url = deepLinks.event(eventId);
  const message = [
    `Komm zu ${title}!`,
    startDate ? new Date(startDate).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) : '',
    url,
  ].filter(Boolean).join('\n');

  try {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return true;
    }
    await Share.share({ message, url, title });
    return true;
  } catch {
    return false;
  }
}
