/**
 * NotificationsScreen – Full notification center.
 * Lists all notifications grouped by type with swipe-to-dismiss and mark-all-read.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/providers/ThemeProvider';
import { THeader, TEmptyState } from '../src/components/common';
import { useNotificationStore, type AppNotification } from '../src/store/notificationStore';
import { spacing, fontSize, fontWeight, radius } from '../src/theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function getNotificationIcon(type: AppNotification['type']): { name: IoniconsName; color: string } {
  // Night Court palette
  switch (type) {
    case 'event_reminder': return { name: 'alarm-outline', color: '#FF4757' };
    case 'registration_confirmed': return { name: 'checkmark-circle-outline', color: '#10B981' };
    case 'waitlist_promoted': return { name: 'arrow-up-circle-outline', color: '#818CF8' };
    case 'match_result': return { name: 'trophy-outline', color: '#F59E0B' };
    case 'match_upcoming': return { name: 'time-outline', color: '#FF4757' };
    case 'bracket_published': return { name: 'git-network-outline', color: '#6366F1' };
    case 'friend_request': return { name: 'person-add-outline', color: '#818CF8' };
    case 'team_invite': return { name: 'people-outline', color: '#6366F1' };
    case 'payment_confirmed': return { name: 'card-outline', color: '#10B981' };
    case 'payment_refunded': return { name: 'arrow-undo-outline', color: '#F59E0B' };
    case 'membership_expiring': return { name: 'warning-outline', color: '#FF4757' };
    case 'system_announcement': return { name: 'megaphone-outline', color: 'rgba(255,255,255,0.4)' };
    default: return { name: 'notifications-outline', color: 'rgba(255,255,255,0.4)' };
  }
}

function getTypeLabel(type: AppNotification['type'], t: ReturnType<typeof useTranslation>['t']): string {
  const key = `notifications.${type.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`;
  const result = t(key);
  return result !== key ? result : type.replace(/_/g, ' ');
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  return new Date(dateStr).toLocaleDateString('de');
}

interface NotificationItemProps {
  notification: AppNotification;
  colors: ReturnType<typeof useTheme>['colors'];
  t: ReturnType<typeof useTranslation>['t'];
  onPress: () => void;
  onDelete: () => void;
}

function NotificationItem({ notification, colors, t, onPress, onDelete }: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={() => {
        Alert.alert(
          t('notifications.deleteConfirm'),
          '',
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: onDelete },
          ]
        );
      }}
      style={[
        styles.notifItem,
        notification.read
          ? { backgroundColor: '#0A0A14', borderLeftWidth: 0, borderColor: 'rgba(255,255,255,0.06)' }
          : { backgroundColor: 'rgba(99,102,241,0.06)', borderLeftWidth: 2, borderLeftColor: '#6366F1', borderColor: 'rgba(99,102,241,0.15)' },
      ]}
    >
      <View style={[styles.notifIcon, { backgroundColor: `${icon.color}15` }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifType, { color: colors.textTertiary }]}>
            {getTypeLabel(notification.type, t)}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        <Text style={[styles.notifTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    notifications, unreadCount, loading,
    fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchNotifications();
  }, []);

  const handleNotificationPress = useCallback((notif: AppNotification) => {
    if (!notif.read) markAsRead(notif.id);

    // Navigate based on notification data
    if (notif.data?.event_id) {
      router.push(`/event/${notif.data.event_id}`);
    } else if (notif.data?.match_id) {
      router.push(`/event/bracket/${notif.data.event_id || ''}`);
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      colors={colors}
      t={t}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => deleteNotification(item.id)}
    />
  ), [colors, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <THeader title={t('notifications.title')} showBack onBack={() => router.back()} />

      {/* Actions bar */}
      {notifications.length > 0 && (
        <View style={[styles.actionsBar, { borderColor: colors.divider }]}>
          <Text style={[styles.countText, { color: colors.textTertiary }]}>
            {unreadCount > 0 ? `${unreadCount} ungelesen` : t('notifications.emptyDesc')}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={[styles.actionText, { color: colors.primary as string }]}>
                {t('notifications.markAllRead')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <TEmptyState
            icon="notifications-off-outline"
            title={t('notifications.empty')}
            message={t('notifications.emptyDesc')}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  actionsBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countText: { fontSize: fontSize.sm },
  actionText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },

  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.sm,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  notifType: { fontSize: fontSize.xxs, fontWeight: fontWeight.semibold as any, textTransform: 'uppercase', letterSpacing: 0.3 },
  notifTime: { fontSize: fontSize.xxs },
  notifTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any, marginBottom: 2 },
  notifBody: { fontSize: fontSize.xs, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginLeft: spacing.xs },
});