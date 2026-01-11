import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Plus, LogIn } from 'lucide-react-native';

export default function LobbyScreen() {
  const router = useRouter();
  const { playerStats } = useAuth();
  const { socket } = useSocket();
  const [matchCode, setMatchCode] = useState('');
  const [currentMatch, setCurrentMatch] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('matchCreated', (data) => {
      setCurrentMatch(data.match);
    });

    socket.on('matchUpdate', (data) => {
      setCurrentMatch(data);
    });

    socket.on('matchStart', (data) => {
      router.push(`/game/${data.matchCode}`);
    });

    socket.on('matchError', (data) => {
      alert(data.error);
    });

    return () => {
      socket.off('matchCreated');
      socket.off('matchUpdate');
      socket.off('matchStart');
      socket.off('matchError');
    };
  }, [socket]);

  const handleCreateMatch = () => {
    if (!socket || !playerStats) return;

    socket.emit('createMatch', {
      playerData: {
        playerId: playerStats.id,
        username: playerStats.username,
      },
    });
  };

  const handleJoinMatch = () => {
    if (!socket || !playerStats || !matchCode) return;

    socket.emit('joinMatch', {
      matchCode: matchCode.trim(),
      playerData: {
        playerId: playerStats.id,
        username: playerStats.username,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Private Matches</Text>

        {!currentMatch ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create Match</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateMatch}
              >
                <Plus size={24} color="#fff" />
                <Text style={styles.buttonText}>Create Private Match</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join Match</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Match Code"
                placeholderTextColor="#64748B"
                value={matchCode}
                onChangeText={setMatchCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.joinButton, !matchCode && styles.buttonDisabled]}
                onPress={handleJoinMatch}
                disabled={!matchCode}
              >
                <LogIn size={24} color="#fff" />
                <Text style={styles.buttonText}>Join Match</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>Match Lobby</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Match Code</Text>
              <Text style={styles.code}>{currentMatch.code}</Text>
            </View>

            <View style={styles.playersSection}>
              <Text style={styles.playersTitle}>
                Players ({currentMatch.players?.length || 0}/{currentMatch.maxPlayers})
              </Text>
              {currentMatch.players?.map((player: any, index: number) => (
                <View key={index} style={styles.playerItem}>
                  <Text style={styles.playerName}>{player.username}</Text>
                  {player.isReady && (
                    <Text style={styles.readyBadge}>Ready</Text>
                  )}
                </View>
              ))}
            </View>

            <Text style={styles.waitingText}>
              Waiting for {currentMatch.maxPlayers - (currentMatch.players?.length || 0)} more players...
            </Text>
          </View>
        )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  matchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 2,
  },
  playersSection: {
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    color: '#fff',
  },
  readyBadge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
});
