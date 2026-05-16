import { TILE_SIZE } from '../config/GameConfig.js';
import HoleSystem from '../systems/HoleSystem.js';

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

// Placement state machine
const MODE = {
  PAINT:      'paint',
  PLACE_TEE:  'place_tee',
  PLACE_GREEN:'place_green',
  PICK_PAR:   'pick_par',
};

export default class CourseScene extends Phaser.Scene {
  constructor() {
    super('CourseScene');
    this.grid = [];
    this.selectedTile = 'FAIRWAY';
    this.isDragging = false;
    this.placementMode = MODE.PAINT;
    this.pendingTee = null;
    this.holeSystem = new HoleSystem();
    this.markerLayer = null;
    this.parUI = null;
  }

  init(data) {
    this.mode = data.mode || 'sandbox';
  }

  create() {
    const { width, height } = this.scale;

    this.cols = Math.floor(width / TILE_SIZE);
    this.rows = 30;

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = 'ROUGH';
      }
    }

    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    this.markerLayer = this.add.graphics();
    this.markerTexts = [];

    this.cameras.main.setBounds(0, 0, width, this.rows * TILE_SIZE);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', () => { this.isDragging = false; });

    this.createToolbar();
    this.createHUD();
    this.createHoleListPanel();
  }

  // --- Input ---

  onPointerDown(ptr) {
    const inToolbar = ptr.y > this.scale.height - 60;
    if (inToolbar) return;

    if (this.placementMode === MODE.PLACE_TEE) {
      this.placeTee(ptr);
      return;
    }
    if (this.placementMode === MODE.PLACE_GREEN) {
      this.placeGreen(ptr);
      return;
    }
    if (this.placementMode === MODE.PAINT) {
      this.isDragging = true;
      this.paintTile(ptr);
    }
  }

  onPointerMove(ptr) {
    if (!this.isDragging || !ptr.isDown) return;
    if (ptr.y > this.scale.height - 60) return;
    if (this.placementMode !== MODE.PAINT) return;
    this.paintTile(ptr);
  }

  // --- Tile Painting ---

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

  // --- Hole Placement ---

  placeTee(ptr) {
    const worldY = ptr.y + this.cameras.main.scrollY;
    const col = Math.floor(ptr.x / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

    this.pendingTee = { col, row };
    this.drawMarkers();
    this.placementMode = MODE.PLACE_GREEN;
    this.updateStatusText('Now tap to place the Green');
  }

  placeGreen(ptr) {
    const worldY = ptr.y + this.cameras.main.scrollY;
    const col = Math.floor(ptr.x / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

    this.pendingGreen = { col, row };
    this.drawMarkers();
    this.placementMode = MODE.PICK_PAR;
    this.showParPicker();
  }

  confirmHole(par) {
    const { col: tCol, row: tRow } = this.pendingTee;
    const { col: gCol, row: gRow } = this.pendingGreen;

    this.holeSystem.addHole(tCol, tRow, gCol, gRow, par);
    this.pendingTee = null;
    this.pendingGreen = null;
    this.placementMode = MODE.PAINT;

    this.hideParPicker();
    this.drawMarkers();
    this.updateHoleList();
    this.updateStatusText('');
    this.updateNewHoleButton();
  }

  cancelHolePlacement() {
    this.pendingTee = null;
    this.pendingGreen = null;
    this.placementMode = MODE.PAINT;
    this.hideParPicker();
    this.drawMarkers();
    this.updateStatusText('');
    this.updateNewHoleButton();
  }

  // --- Markers ---

  drawMarkers() {
    this.markerLayer.clear();
    this.markerTexts.forEach(t => t.destroy());
    this.markerTexts = [];

    // Draw confirmed holes
    this.holeSystem.holes.forEach(hole => {
      this.drawTeeMarker(hole.teeCol, hole.teeRow, hole.id, 0xffffff);
      this.drawFlagMarker(hole.greenCol, hole.greenRow, hole.id, 0xff4444);
    });

    // Draw pending tee (yellow)
    if (this.pendingTee) {
      this.drawTeeMarker(this.pendingTee.col, this.pendingTee.row, '?', 0xffdd00);
    }

    // Draw pending green (yellow)
    if (this.pendingGreen) {
      this.drawFlagMarker(this.pendingGreen.col, this.pendingGreen.row, '?', 0xffdd00);
    }
  }

  drawTeeMarker(col, row, label, color) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    this.markerLayer.fillStyle(color, 1);
    this.markerLayer.fillCircle(x, y, 7);
    this.markerLayer.lineStyle(1, 0x000000, 1);
    this.markerLayer.strokeCircle(x, y, 7);

    const t = this.add.text(x, y, String(label), {
      fontSize: '7px', fill: '#000000', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.markerTexts.push(t);
  }

  drawFlagMarker(col, row, label, color) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;

    // Flag pole
    this.markerLayer.lineStyle(2, 0x333333, 1);
    this.markerLayer.lineBetween(x, y - 8, x, y + 6);

    // Flag
    this.markerLayer.fillStyle(color, 1);
    this.markerLayer.fillTriangle(x, y - 8, x + 8, y - 4, x, y);

    const t = this.add.text(x + 2, y + 2, String(label), {
      fontSize: '6px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.markerTexts.push(t);
  }

  // --- UI: Toolbar ---

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
        this.placementMode = MODE.PAINT;
        this.selectedTile = key;
        this.cancelHolePlacement();
      });

      this.add.text(x, y + 14, TILES[key].label.substring(0, 4), {
        fontSize: '8px', fill: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0);
    });
  }

  // --- UI: HUD ---

  createHUD() {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 16, width, 32, 0x000000, 0.7).setScrollFactor(0);

    this.statusText = this.add.text(width / 2, 16, '', {
      fontSize: '9px', fill: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    this.add.text(width - 8, 8, '★★★☆☆  $12,500', {
      fontSize: '10px', fill: '#f5f0e8', fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0);

    // New Hole button
    this.newHoleBtn = this.add.rectangle(48, 16, 80, 22, 0x1b5e20)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    this.newHoleBtnText = this.add.text(48, 16, '+ New Hole', {
      fontSize: '9px', fill: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    this.newHoleBtn.on('pointerover', () => this.newHoleBtn.setFillStyle(0x388e3c));
    this.newHoleBtn.on('pointerout', () => this.newHoleBtn.setFillStyle(0x1b5e20));
    this.newHoleBtn.on('pointerdown', () => this.startHolePlacement());
  }

  updateStatusText(msg) {
    this.statusText.setText(msg);
  }

  updateNewHoleButton() {
    const canAdd = this.holeSystem.canAddMore();
    this.newHoleBtn.setVisible(canAdd);
    this.newHoleBtnText.setVisible(canAdd);
  }

  startHolePlacement() {
    if (!this.holeSystem.canAddMore()) return;
    this.placementMode = MODE.PLACE_TEE;
    this.updateStatusText('Tap to place the Tee Box');
  }

  // --- UI: Par Picker ---

  showParPicker() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.parUI = this.add.container(cx, cy).setScrollFactor(0).setDepth(20);

    const bg = this.add.rectangle(0, 0, 200, 100, 0x1a1a1a, 0.95);
    const title = this.add.text(0, -34, 'Select Par', {
      fontSize: '13px', fill: '#f5f0e8', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const parOptions = [3, 4, 5];
    const parButtons = parOptions.map((par, i) => {
      const bx = (i - 1) * 58;
      const btn = this.add.rectangle(bx, 10, 48, 36, 0x2d5a1b).setInteractive({ useHandCursor: true });
      const txt = this.add.text(bx, 10, String(par), {
        fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(0x388e3c));
      btn.on('pointerout', () => btn.setFillStyle(0x2d5a1b));
      btn.on('pointerdown', () => this.confirmHole(par));
      return [btn, txt];
    });

    const cancelBtn = this.add.rectangle(0, 38, 80, 20, 0x5a1b1b).setInteractive({ useHandCursor: true });
    const cancelTxt = this.add.text(0, 38, 'Cancel', {
      fontSize: '9px', fill: '#ffaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);
    cancelBtn.on('pointerdown', () => this.cancelHolePlacement());

    this.parUI.add([bg, title, cancelBtn, cancelTxt, ...parButtons.flat()]);
  }

  hideParPicker() {
    if (this.parUI) {
      this.parUI.destroy();
      this.parUI = null;
    }
  }

  // --- UI: Hole List Panel ---

  createHoleListPanel() {
    const { width } = this.scale;
    this.holeListContainer = this.add.container(width - 4, 36).setScrollFactor(0).setDepth(10);
    this.updateHoleList();
  }

  updateHoleList() {
    this.holeListContainer.removeAll(true);

    if (this.holeSystem.getCount() === 0) return;

    const lineH = 13;
    const panelH = this.holeSystem.getCount() * lineH + 10;
    const panelW = 90;

    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.7).setOrigin(1, 0);
    this.holeListContainer.add(bg);

    this.holeSystem.holes.forEach((hole, i) => {
      const y = i * lineH + 8;
      const txt = this.add.text(-4, y, `#${hole.id}  Par ${hole.par}`, {
        fontSize: '9px', fill: '#c8e6c9', fontFamily: 'monospace',
      }).setOrigin(1, 0);
      this.holeListContainer.add(txt);
    });
  }
}
