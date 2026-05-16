export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x2d5a27).setOrigin(0);

    this.add.text(width / 2, height * 0.25, 'Golf Course', {
      fontSize: '28px',
      fill: '#f5f0e8',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, 'Manager Simulator', {
      fontSize: '20px',
      fill: '#c8e6c9',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.5, '⛳', {
      fontSize: '48px',
    }).setOrigin(0.5);

    this.createButton(width / 2, height * 0.65, 'Career Mode', () => {
      this.scene.start('CourseScene', { mode: 'career' });
    });

    this.createButton(width / 2, height * 0.78, 'Sandbox Mode', () => {
      this.scene.start('CourseScene', { mode: 'sandbox' });
    });
  }

  createButton(x, y, label, onClick) {
    const btn = this.add.rectangle(x, y, 200, 40, 0x1b5e20).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '16px',
      fill: '#f5f0e8',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x388e3c));
    btn.on('pointerout', () => btn.setFillStyle(0x1b5e20));
    btn.on('pointerdown', onClick);
  }
}
