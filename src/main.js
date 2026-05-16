import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CourseScene from './scenes/CourseScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scene: [BootScene, MainMenuScene, CourseScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
};

new Phaser.Game(config);
