import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '../../src/hooks/useColorScheme';
import {
  TCard, TBadge, TAvatar, TEmptyState, TLoadingScreen,
  TChip, TButton, TSearchBar, TDivider,
} from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { useCommunityStore } from '../../src/store/communityStore';
import { spacing, fontSize, fontWeight } from '../../src/theme/spacing';

type Tab = 'friends' | 'teams' | 'search';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppColors();
  const { user } = useAuthStore();
  const {
    friends, teams, pendingRequests, searchResults,
    loading, fetchFriends, fetchMyTeams, fetchPendingRequests,
    searchUsers, clearSearch, sendFriendRequest,
    acceptFriendRequest, declineFriendRequest,
    createTeam,
  } = useCommunityStore();

  const [tab, setTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchMyTeams();
      fetchPendingRequests();
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchMyTeams(), fetchPendingRequests()]);
    setRefreshing(false);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery.trim());
      setTab('search');
    }
  };

  const handleCreateTeam = () => {
    Alert.prompt(
      'Neues Team erstellen',
      'Gib einen Namen für dein Team ein:',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Erstellen',
          onPress: async (name) => {
            if (name && name.trim()) {
              try {
                await createTeam({ name: name.trim() });
                Alert.alert('Erfolg', `Team "${name.trim()}" wurde erstellt!`);
              } catch (e: any) {
                Alert.alert('Fehler', e.message);
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
        <View style={[styles.header, { backgroundColor: colors.neutral[50], borderBottomColor: colors.neutral[200] }]}>
          <Text style={[styles.title, { color: colors.neutral[900] }]}>Community</Text>
        </View>
        <TEmptyState
          icon="👥"
          title="Community entdecken"
          message="Melde dich an, um Freunde zu finden und Teams zu gründen."
          actionLabel="Jetzt anmelden"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[100] }]}>
      <View style={[styles.header, { backgroundColor: colors.neutral[50], borderBottomColor: colors.neutral[200] }]}>
        <Text style={[styles.title, { color: colors.neutral[900] }]}>
          {t('community.title')}
        </Text>
      </View>

      <TSearchBar
        placeholder="Spieler suchen..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearch}
        onClear={() => { clearSearch(); setTab('friends'); }}
      />

      <View style={styles.tabs}>
        <TChip label={`Freunde (${friends.length})`} selected={tab === 'friends'} onPress={() => setTab('friends')} />
        <TChip label={`Teams (${teams.length})`} selected={tab === 'teams'} onPress={() => setTab('teams')} />
        {searchResults.length > 0 && (
          <TChip label={`Suche (${searchResults.length})`} selected={tab === 'search'} onPress={() => setTab('search')} />
        )}
      </View>

      {/* Pending Requests */}
      {tab === 'friends' && pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.neutral[900] }]}>
            Freundschaftsanfragen ({pendingRequests.length})
          </Text>
          {pendingRequests.map((req) => (
            <TCard key={req.id} variant="outlined" style={styles.requestCard}>
              <View style={styles.requestRow}>
                <TAvatar name={req.display_name} uri={req.avatar_url} size="sm" />
                <Text style={[styles.requestName, { color: colors.neutral[900] }]}>{req.display_name}</Text>
                <TouchableOpacity
                  onPress={() => acceptFriendRequest(req.id)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary[500] }]}
                >
                  <Text style={styles.actionBtnText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => declineFriendRequest(req.id)}
                  style={[styles.actionBtn, { backgroundColor: colors.neutral[300] }]}
                >
                  <Text style={[styles.actionBtnText, { color: colors.neutral[700] }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </TCard>
          ))}
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Friends Tab */}
        {tab === 'friends' && (
          friends.length === 0 ? (
            <TEmptyState
              icon="🤝"
              title="Noch keine Freunde"
              message="Suche nach Spielern und sende Freundschaftsanfragen!"
            />
          ) : (
            friends.map((friend) => (
              <TCard key={friend.id} variant="default" style={styles.friendCard}>
                <View style={styles.friendRow}>
                  <TAvatar name={friend.display_name} uri={friend.avatar_url} size="md" />
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: colors.neutral[900] }]}>{friend.display_name}</Text>
                    {friend.skill_level && (
                      <TBadge label={friend.skill_level} variant="info" size="sm" />
                    )}
                  </View>
                </View>
              </TCard>
            ))
          )
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <View>
            <TouchableOpacity onPress={handleCreateTeam} style={[styles.createTeamBtn, { borderColor: colors.primary[500] }]}>
              <Text style={[styles.createTeamText, { color: colors.primary[500] }]}>+ Neues Team erstellen</Text>
            </TouchableOpacity>
            {teams.length === 0 ? (
              <TEmptyState
                icon="⚡"
                title="Noch keine Teams"
                message="Erstelle ein Team und lade Spieler ein!"
              />
            ) : (
              teams.map((team) => (
                <TCard key={team.id} variant="default" style={styles.teamCard}>
                  <View style={styles.teamRow}>
                    <TAvatar name={team.name} size="md" />
                    <View style={styles.teamInfo}>
                      <Text style={[styles.teamName, { color: colors.neutral[900] }]}>{team.name}</Text>
                      <Text style={[styles.teamMembers, { color: colors.neutral[500] }]}>
                        {team.member_count} Mitglieder
                      </Text>
                    </View>
                    <TBadge label="Team" variant="info" />
                  </View>
                </TCard>
              ))
            )}
          </View>
        )}

        {/* Search Results Tab */}
        {tab === 'search' && (
          searchResults.length === 0 ? (
            <TEmptyState
              icon="🔍"
              title="Keine Ergebnisse"
              message="Versuche einen anderen Suchbegriff."
            />
          ) : (
            searchResults.map((result) => (
              <TCard key={result.id} variant="default" style={styles.friendCard}>
                <View style={styles.friendRow}>
                  <TAvatar name={result.display_name} uri={result.avatar_url} size="md" />
                  <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, { color: colors.neutral[900] }]}>{result.display_name}</Text>
                    {result.skill_level && <TBadge label={result.skill_level} variant="info" size="sm" />}
                  </View>
                  {result.is_friend ? (
                    <TBadge label="Freund" variant="success" />
                  ) : result.friendship_status === 'pending' ? (
                    <TBadge label="Angefragt" variant="warning" />
                  ) : (
                    <TouchableOpacity
                      onPress={() => sendFriendRequest(result.id)}
                      style={[styles.addBtn, { backgroundColor: colors.primary[500] }]}
                    >
                      <Text style={styles.addBtnText}>+ Hinzufügen</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TCard>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold as any },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any, marginBottom: spacing.sm },
  requestCard: { marginBottom: spacing.xs },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  requestName: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium as any },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: fontWeight.bold as any },
  friendCard: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  friendRow: { flexDirection: 'row', alignItems: 'center' },
  friendInfo: { flex: 1, marginLeft: spacing.md },
  friendName: { fontSize: fontSize.md, fontWeight: fontWeight.medium as any, marginBottom: 2 },
  teamCard: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamInfo: { flex: 1, marginLeft: spacing.md },
  teamName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  teamMembers: { fontSize: fontSize.sm, marginTop: 2 },
  createTeamBtn: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  createTeamText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold as any },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20 },
  addBtnText: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
});