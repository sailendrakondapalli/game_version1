import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Trophy, Target, Crosshair, Activity } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { playerStats, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  if (!playerStats) {
    return null;
  }

  const kd =
    playerStats.deaths > 0
      ? (playerStats.kills / playerStats.deaths).toFixed(2)
      : playerStats.kills.toFixed(2);

  const winRate =
    playerStats.matches_played > 0
      ? ((playerStats.wins / playerStats.matches_played) * 100).toFixed(1)
      : '0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {playerStats.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{playerStats.username}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{playerStats.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>

          <View style={styles.statCard}>
            <Target size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{playerStats.kills}</Text>
            <Text style={styles.statLabel}>Total Kills</Text>
          </View>

          <View style={styles.statCard}>
            <Crosshair size={24} color="#10B981" />
            <Text style={styles.statValue}>{kd}</Text>
            <Text style={styles.statLabel}>K/D Ratio</Text>
          </View>

          <View style={styles.statCard}>
            <Activity size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{playerStats.matches_played}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Win Rate</Text>
            <Text style={styles.detailValue}>{winRate}%</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Damage</Text>
            <Text style={styles.detailValue}>
              {playerStats.damage_dealt.toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Avg Kills/Match</Text>
            <Text style={styles.detailValue}>
              {playerStats.matches_played > 0
                ? (playerStats.kills / playerStats.matches_played).toFixed(1)
                : '0.0'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deaths</Text>
            <Text style={styles.detailValue}>{playerStats.deaths}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: {
    fontSize: 16,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
