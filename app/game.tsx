import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import PhaserGame from '@/game/PhaserGame';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { socket } = useSocket();
  const { playerStats } = useAuth();
  const [loading, setLoading] = useState(true);

  const matchCode = typeof params.matchCode === 'string' ? params.matchCode : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).returnToLobby = () => {
        router.replace('/(tabs)/home');
      };
    }

    if (socket && playerStats) {
      setLoading(false);
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).returnToLobby;
      }
    };
  }, [socket, playerStats]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Game is only available on web platform
        </Text>
      </View>
    );
  }

  if (loading || !socket || !socket.id || !playerStats || !matchCode) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  return (
    <PhaserGame
      socket={socket}
      playerId={socket.id}
      matchCode={matchCode}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});
