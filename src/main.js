import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import CourseScene from './scenes/CourseScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scene: [BootScene, MainMenuScene, CourseScene],
  scale: {
    mode: Phaser.Scale.NONE,
  },
};

new Phaser.Game(config);
