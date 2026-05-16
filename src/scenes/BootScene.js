export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Assets will be loaded here as the game grows
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
