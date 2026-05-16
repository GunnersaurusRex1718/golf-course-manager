import { TILE_SIZE, SCALE } from '../config/GameConfig.js';

const TILES = {
  ROUGH:   { color: 0x4a7c3f, label: 'Rough' },
  FAIRWAY: { color: 0x5aaf4a, label: 'Fairway' },
  GREEN:   { color: 0x7dd96a, label: 'Green' },
  TEE:     { color: 0x8ee07a, label: 'Tee Box' },
  BUNKER:  { color: 0xe8d5a3, label: 'Bunker' },
  WATER:   { color: 0x3a7bd5, label: 'Water' },
  PATH:    { color: 0xb0a090, label: 'Cart Path' },
  TREE:    { color: 0x2d5a1b, label: 'Tree' },
};

const TILE_KEYS = Object.keys(TILES);

export default class CourseScene extends Phaser.Scene {
  constructor() {
    super('CourseScene');
    this.grid = [];
    this.selectedTile = 'FAIRWAY';
    this.isDragging = false;
  }

  init(data) {
    this.mode = data.mode || 'sandbox';
  }

  create() {
    const { width, height } = this.scale;

    this.cols = Math.floor((width) / (TILE_SIZE));
    this.rows = 30;

    // Fill grid with rough by default
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = 'ROUGH';
      }
    }

    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    this.cameras.main.setBounds(0, 0, width, this.rows * TILE_SIZE);
    this.cameras.main.setScroll(0, 0);

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', () => { this.isDragging = false; });

    // Enable camera drag with two fingers / right click
    this.input.on('pointermove', (ptr) => {
      if (ptr.isDown && ptr.rightButtonDown()) {
        this.cameras.main.scrollY -= ptr.velocity.y * 0.5;
      }
    });

    this.createToolbar();
    this.createHUD();
  }

  onPointerDown(ptr) {
    if (ptr.y > this.scale.height - 60) return; // inside toolbar
    this.isDragging = true;
    this.paintTile(ptr);
  }

  onPointerMove(ptr) {
    if (!this.isDragging || !ptr.isDown) return;
    if (ptr.y > this.scale.height - 60) return;
    this.paintTile(ptr);
  }

  paintTile(ptr) {
    const worldY = ptr.y + this.cameras.main.scrollY;
    const col = Math.floor(ptr.x / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (this.grid[row][col] === this.selectedTile) return;
    this.grid[row][col] = this.selectedTile;
    this.drawGrid();
  }

  drawGrid() {
    this.gridGraphics.clear();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const key = this.grid[r][c];
        this.gridGraphics.fillStyle(TILES[key].color, 1);
        this.gridGraphics.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  createToolbar() {
    const { width, height } = this.scale;
    const toolbarY = height - 60;
    const tileCount = TILE_KEYS.length;
    const btnW = Math.floor(width / tileCount);

    this.add.rectangle(width / 2, height - 30, width, 60, 0x1a1a1a).setScrollFactor(0);

    TILE_KEYS.forEach((key, i) => {
      const x = i * btnW + btnW / 2;
      const y = toolbarY + 30;

      const btn = this.add.rectangle(x, y, btnW - 4, 52, TILES[key].color)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedTile = key;
        this.updateToolbarSelection();
      });

      btn.setData('key', key);
      this.add.text(x, y + 14, TILES[key].label.substring(0, 4), {
        fontSize: '8px',
        fill: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0);
    });

    this.updateToolbarSelection();
  }

  updateToolbarSelection() {
    // Visual highlight handled via border — future improvement
  }

  createHUD() {
    const { width } = this.scale;
    const bg = this.add.rectangle(width / 2, 16, width, 32, 0x000000, 0.6).setScrollFactor(0);

    this.modeText = this.add.text(8, 8, this.mode === 'career' ? 'Career Mode' : 'Sandbox', {
      fontSize: '10px', fill: '#f5f0e8', fontFamily: 'monospace',
    }).setScrollFactor(0);

    this.add.text(width - 8, 8, '★★★☆☆  $12,500', {
      fontSize: '10px', fill: '#f5f0e8', fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0);
  }
}
