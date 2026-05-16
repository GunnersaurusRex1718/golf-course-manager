import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CourseScene from './scenes/CourseScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scene: [BootScene, MainMenuScene, CourseScene],
  scale: {
    mode: Phaser.Scale.NONE,
  },
};

new Phaser.Game(config);
