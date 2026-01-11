import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Swords } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { playerStats, loading } = useAuth();
  const { socket, connected } = useSocket();

  const [searching, setSearching] = useState(false);
  const [matchInfo, setMatchInfo] = useState<any>(null);

  // ---- SOCKET STATUS LOG ----
  useEffect(() => {
    if (!socket) return;

    console.log('✅ Socket connected:', socket.id);

    socket.on('connect_error', (err) => {
      console.log('❌ Socket connect error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
    });

    return () => {
      socket.off('connect_error');
      socket.off('disconnect');
    };
  }, [socket]);

  // ---- MATCH EVENTS ----
  useEffect(() => {
    if (!socket) return;

    const onUpdate = (data: any) => setMatchInfo(data);
    const onStart = (data: any) => {
      setSearching(false);
      router.push(`/game/${data.matchCode}`);
    };
    const onError = (data: any) => {
      setSearching(false);
      alert(data.error);
    };

    socket.on('matchUpdate', onUpdate);
    socket.on('matchStart', onStart);
    socket.on('matchError', onError);

    return () => {
      socket.off('matchUpdate', onUpdate);
      socket.off('matchStart', onStart);
      socket.off('matchError', onError);
    };
  }, [socket]);

  // ---- QUICK MATCH ----
  const handleQuickMatch = () => {
    console.log('socket =', socket);
    console.log('playerStats =', playerStats);

    if (!socket || !playerStats) {
      console.log('❌ Missing socket or playerStats');
      return;
    }

    const payload = {
      playerId: playerStats.user_id ?? playerStats.id,
      username: playerStats.username,
    };

    console.log('➡️ Sending quickMatch', payload);

    setSearching(true);
    socket.emit('quickMatch', payload);
  };

  // ---- UI STATES ----
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#fff', marginTop: 12 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!playerStats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#fff' }}>Please sign in to continue</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Battle Royale</Text>
          <Text style={styles.subtitle}>
            {connected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.username}>{playerStats.username}</Text>
        </View>

        {searching && matchInfo && (
          <View style={styles.matchingCard}>
            <Text style={styles.matchingText}>Finding Match...</Text>
            <Text style={styles.matchingPlayers}>
              {matchInfo.players.length} / {matchInfo.maxPlayers} Players
            </Text>
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 16 }} />
          </View>
        )}

        <TouchableOpacity
          style={[styles.playButton, (!connected || searching) && styles.playButtonDisabled]}
          onPress={handleQuickMatch}
          disabled={!connected || searching}
        >
          <Swords size={32} color="#fff" />
          <Text style={styles.playButtonText}>
            {searching ? 'Searching...' : 'Quick Match'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---- STYLES ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  matchingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  matchingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  matchingPlayers: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
