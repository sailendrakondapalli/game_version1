import { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import Phaser from 'phaser';
import { Socket } from 'socket.io-client';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ThreeClient } from './ThreeClient';

interface Props {
  socket: Socket;
  playerId: string;
  matchCode?: string;
}

export default function PhaserGame({ socket, playerId }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const threeRef = useRef<ThreeClient | null>(null);

  // Enable Three client by default on web unless explicitly disabled via EXPO_PUBLIC_USE_THREE='0'
  const useThree = process.env.EXPO_PUBLIC_USE_THREE === '0' ? false : true;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (useThree) {
      // initialize Three client
      if (threeRef.current) return;
      try {
        const client = new ThreeClient('phaser-game');
        threeRef.current = client;
        client.setLocalPlayerId(playerId);
        client.loadModel().then(async () => {
          console.log('Three model loaded');
          // auto-load Ready Player Me avatar if env var present
          const rpmId = process.env.EXPO_PUBLIC_RPM_ID;
          if (rpmId) {
            try {
              await client.loadReadyPlayerMeAvatar(rpmId);
            } catch (e) {
              console.warn('Auto RPM load failed, falling back to prompt');
              setTimeout(() => client.promptAndLoadReadyPlayerMe(), 2000);
            }
          } else {
            // prompt user to optionally replace with a Ready Player Me avatar
            setTimeout(() => client.promptAndLoadReadyPlayerMe(), 2000);
          }
        }).catch(() => console.log('Three model failed'));

        client.setSocket(socket);
      } catch (e) {
        console.warn('Three initialization failed', e);
      }

      return () => {
        socket.off('gameState');
        if (threeRef.current) {
          // remove renderer DOM
          const el = document.getElementById('phaser-game');
          if (el) el.innerHTML = '';
          threeRef.current = null;
        }
      };
    }

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-game',
      width: window.innerWidth,
      height: window.innerHeight,
      scene: [GameScene, GameOverScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.scene.start('GameScene', { socket, playerId });

    console.log('🎮 Starting GameScene with', socket.id, playerId);

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [socket, playerId, useThree]);

  return (
    <View style={{ flex: 1 }}>
      <div id="phaser-game" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
