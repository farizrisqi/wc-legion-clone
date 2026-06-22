import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import FactionScene from './scenes/FactionScene.js';
import GameScene from './scenes/GameScene.js';

const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.width,
  height: CONFIG.height,
  parent: 'game-container',
  backgroundColor: CONFIG.colors.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, FactionScene, GameScene]
};

// Pastikan web font sudah ter-load supaya teks tidak "pop-in".
function start() {
  new Phaser.Game(gameConfig);
}

if (document.fonts && document.fonts.load) {
  Promise.all([
    document.fonts.load('900 64px Orbitron'),
    document.fonts.load('700 24px Rajdhani')
  ]).then(start).catch(start);
} else {
  start();
}
