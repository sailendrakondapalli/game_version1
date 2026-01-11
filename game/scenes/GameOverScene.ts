import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private winner: any;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: any) {
    this.winner = data.winner;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);

    const container = this.add.container(width / 2, height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 1);
    bg.fillRoundedRect(-250, -200, 500, 400, 16);
    bg.lineStyle(4, 0x3b82f6, 1);
    bg.strokeRoundedRect(-250, -200, 500, 400, 16);
    container.add(bg);

    if (this.winner) {
      const trophy = this.add.graphics();
      trophy.fillStyle(0xfbbf24, 1);
      trophy.fillCircle(0, -120, 40);
      trophy.fillRect(-15, -100, 30, 40);
      trophy.fillRect(-30, -65, 60, 15);
      container.add(trophy);

      const titleText = this.add.text(0, -40, 'VICTORY!', {
        fontSize: '48px',
        color: '#fbbf24',
        fontStyle: 'bold',
      });
      titleText.setOrigin(0.5, 0.5);
      container.add(titleText);

      const winnerText = this.add.text(0, 20, this.winner.username, {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      winnerText.setOrigin(0.5, 0.5);
      container.add(winnerText);

      const statsText = this.add.text(
        0,
        70,
        `Kills: ${this.winner.kills}\nDamage: ${Math.floor(this.winner.damage)}`,
        {
          fontSize: '20px',
          color: '#94a3b8',
          align: 'center',
        }
      );
      statsText.setOrigin(0.5, 0.5);
      container.add(statsText);
    } else {
      const titleText = this.add.text(0, -40, 'GAME OVER', {
        fontSize: '48px',
        color: '#ef4444',
        fontStyle: 'bold',
      });
      titleText.setOrigin(0.5, 0.5);
      container.add(titleText);

      const subtitleText = this.add.text(0, 20, 'No winner', {
        fontSize: '24px',
        color: '#94a3b8',
      });
      subtitleText.setOrigin(0.5, 0.5);
      container.add(subtitleText);
    }

    const returnButton = this.add.graphics();
    returnButton.fillStyle(0x3b82f6, 1);
    returnButton.fillRoundedRect(-120, 120, 240, 50, 8);
    returnButton.setInteractive(
      new Phaser.Geom.Rectangle(-120, 120, 240, 50),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(returnButton);

    const buttonText = this.add.text(0, 145, 'Return to Lobby', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5, 0.5);
    container.add(buttonText);

    returnButton.on('pointerdown', () => {
      if (typeof window !== 'undefined' && (window as any).returnToLobby) {
        (window as any).returnToLobby();
      }
    });

    returnButton.on('pointerover', () => {
      returnButton.clear();
      returnButton.fillStyle(0x2563eb, 1);
      returnButton.fillRoundedRect(-120, 120, 240, 50, 8);
    });

    returnButton.on('pointerout', () => {
      returnButton.clear();
      returnButton.fillStyle(0x3b82f6, 1);
      returnButton.fillRoundedRect(-120, 120, 240, 50, 8);
    });

    this.tweens.add({
      targets: container,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }
}
