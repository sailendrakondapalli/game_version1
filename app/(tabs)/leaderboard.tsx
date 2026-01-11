import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase, PlayerStats } from '@/lib/supabase';
import { Trophy, Target, Crosshair } from 'lucide-react-native';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .order('wins', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Trophy size={32} color="#F59E0B" />
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <ScrollView style={styles.list}>
        {leaderboard.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerCard,
              index < 3 && styles[`top${index + 1}` as 'top1'],
            ]}
          >
            <View style={styles.rank}>
              <Text
                style={[
                  styles.rankText,
                  index < 3 && styles.rankTextTop,
                ]}
              >
                {index + 1}
              </Text>
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.username}>{player.username}</Text>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Trophy size={14} color="#F59E0B" />
                  <Text style={styles.statText}>{player.wins} wins</Text>
                </View>
                <View style={styles.statItem}>
                  <Target size={14} color="#3B82F6" />
                  <Text style={styles.statText}>{player.kills} kills</Text>
                </View>
                <View style={styles.statItem}>
                  <Crosshair size={14} color="#10B981" />
                  <Text style={styles.statText}>
                    {player.matches_played > 0
                      ? (player.kills / player.matches_played).toFixed(1)
                      : '0.0'}{' '}
                    K/M
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 20,
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  top1: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E1B16',
  },
  top2: {
    borderColor: '#94A3B8',
    backgroundColor: '#1A1D23',
  },
  top3: {
    borderColor: '#CD7F32',
    backgroundColor: '#1C1715',
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
  },
  rankTextTop: {
    color: '#F59E0B',
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
