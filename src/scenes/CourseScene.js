import { TILE_SIZE, COLS, ROWS, YARDS_PER_TILE, OVERVIEW_ZOOM } from '../config/GameConfig.js';
import HoleSystem from '../systems/HoleSystem.js';
import { generateCourse } from '../systems/ProceduralCourse.js';

const TILES = {
  ROUGH:   { color: 0x4a7c3f, label: 'Rough',    textColor: '#ffffff' },
  FAIRWAY: { color: 0x5aaf4a, label: 'Fairway',  textColor: '#1a1a1a' },
  GREEN:   { color: 0x7dd96a, label: 'Green',    textColor: '#1a1a1a' },
  TEE:     { color: 0x8ee07a, label: 'Tee Box',  textColor: '#1a1a1a' },
  BUNKER:  { color: 0xe8d5a3, label: 'Bunker',   textColor: '#1a1a1a' },
  WATER:   { color: 0x3a7bd5, label: 'Water',    textColor: '#ffffff' },
  PATH:    { color: 0xb0a090, label: 'Path',     textColor: '#1a1a1a' },
  TREE:    { color: 0x2d5a1b, label: 'Tree',     textColor: '#ffffff' },
};

const TILE_KEYS = Object.keys(TILES);

const MODE = {
  PAINT:           'paint',
  OVERVIEW_SELECT: 'overview_select', // tap to pick zone for new hole
  PLACE_TEE:       'place_tee',
  PLACE_GREEN:     'place_green',
  PICK_PAR:        'pick_par',
};

export default class CourseScene extends Phaser.Scene {
  constructor() {
    super('CourseScene');
    this.grid = [];
    this.selectedTile = 'FAIRWAY';
    this.isDragging = false;
    this.placementMode = MODE.PAINT;
    this.pendingTee = null;
    this.pendingGreen = null;
    this.isOverview = false;
    this.holeSystem = new HoleSystem();
    this.markerTexts = [];
    this.parUI = null;
  }

  init(data) {
    this.mode = data.mode || 'sandbox';
  }

  create() {
    const worldW = COLS * TILE_SIZE;
    const worldH = ROWS * TILE_SIZE;

    if (this.mode === 'career') {
      const { grid, holes } = generateCourse(COLS, ROWS, { quality: 'poor' });
      this.grid = grid;
      holes.forEach(h => this.holeSystem.holes.push(h));
    } else {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill('ROUGH'));
    }

    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    this.markerLayer = this.add.graphics();

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setScroll(0, worldH * 0.5);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', () => { this.isDragging = false; });

    this.createToolbar();
    this.createHUD();
    this.createHoleListPanel();
    this.drawMarkers();

    if (this.mode === 'career') {
      this.updateHoleList();
      this.showCareerIntro();
    }
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  onPointerDown(ptr) {
    const inToolbar = ptr.y > this.scale.height - 60;
    if (inToolbar) return;

    const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);

    // Any tap in overview zooms into that spot
    if (this.isOverview) {
      this.zoomToPoint(wp.x, wp.y);
      return;
    }

    if (this.placementMode === MODE.OVERVIEW_SELECT) {
      this.zoomToPoint(wp.x, wp.y);
      return;
    }
    if (this.placementMode === MODE.PLACE_TEE) {
      this.placeTee(wp);
      return;
    }
    if (this.placementMode === MODE.PLACE_GREEN) {
      this.placeGreen(wp);
      return;
    }
    if (this.placementMode === MODE.PAINT) {
      this.isDragging = true;
      this.paintTile(wp);
    }
  }

  onPointerMove(ptr) {
    const wp = this.cameras.main.getWorldPoint(ptr.x, ptr.y);

    if (this.placementMode === MODE.PLACE_GREEN && this.pendingTee) {
      const col = Math.floor(wp.x / TILE_SIZE);
      const row = Math.floor(wp.y / TILE_SIZE);
      const dx = col - this.pendingTee.col;
      const dy = row - this.pendingTee.row;
      const yards = Math.round(Math.sqrt(dx*dx + dy*dy) * YARDS_PER_TILE);
      this.updateStatusText(`Tap to place the Pin  •  ${yards} yds`);
    }

    if (!this.isDragging || !ptr.isDown) return;
    if (ptr.y > this.scale.height - 60) return;
    if (this.placementMode !== MODE.PAINT) return;
    this.paintTile(wp);
  }

  // ─── Tile Painting ───────────────────────────────────────────────────────

  paintTile(wp) {
    const col = Math.floor(wp.x / TILE_SIZE);
    const row = Math.floor(wp.y / TILE_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    if (this.grid[row][col] === this.selectedTile) return;
    this.grid[row][col] = this.selectedTile;
    this.drawGrid();
  }

  drawGrid() {
    this.gridGraphics.clear();

    // Tiles — full size, no gap (fixes the bold/normal pixel pattern)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.gridGraphics.fillStyle(TILES[this.grid[r][c]].color, 1);
        this.gridGraphics.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Subtle grid lines every 5 tiles
    this.gridGraphics.lineStyle(0.5, 0x000000, 0.12);
    for (let c = 0; c <= COLS; c += 5) {
      this.gridGraphics.lineBetween(c * TILE_SIZE, 0, c * TILE_SIZE, ROWS * TILE_SIZE);
    }
    for (let r = 0; r <= ROWS; r += 5) {
      this.gridGraphics.lineBetween(0, r * TILE_SIZE, COLS * TILE_SIZE, r * TILE_SIZE);
    }
  }

  // ─── Camera ──────────────────────────────────────────────────────────────

  toggleOverview() {
    this.isOverview = !this.isOverview;
    if (this.isOverview) {
      // Remove bounds so the camera can freely pan to the world centre at low zoom
      this.cameras.main.removeBounds();
      const worldCX = (COLS * TILE_SIZE) / 2;
      const worldCY = (ROWS * TILE_SIZE) / 2;
      this.cameras.main.pan(worldCX, worldCY, 300, 'Power2');
      this.cameras.main.zoomTo(OVERVIEW_ZOOM, 300, 'Power2');
      this.overviewBtnText.setText('Close Map');
    } else {
      this.cameras.main.setBounds(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);
      this.cameras.main.zoomTo(1.0, 300, 'Power2');
      this.overviewBtnText.setText('Overview');
      if (this.placementMode === MODE.OVERVIEW_SELECT) {
        this.placementMode = MODE.PAINT;
        this.updateStatusText('');
      }
    }
  }

  zoomToPoint(worldX, worldY) {
    // Restore bounds before zooming back in
    this.cameras.main.setBounds(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);
    this.cameras.main.pan(worldX, worldY, 350, 'Power2');
    this.cameras.main.zoomTo(1.0, 350, 'Power2', true, (cam, progress) => {
      if (progress === 1) {
        this.isOverview = false;
        this.overviewBtnText.setText('Overview');
        if (this.placementMode === MODE.OVERVIEW_SELECT) {
          this.placementMode = MODE.PLACE_TEE;
          this.updateStatusText('Tap to place the Tee Box');
        }
      }
    });
  }

  // ─── Hole Placement ──────────────────────────────────────────────────────

  startHolePlacement() {
    if (!this.holeSystem.canAddMore()) return;
    this.placementMode = MODE.OVERVIEW_SELECT;
    if (!this.isOverview) this.toggleOverview();
    this.updateStatusText('Tap where you want to design this hole');
  }

  placeTee(wp) {
    const col = Math.floor(wp.x / TILE_SIZE);
    const row = Math.floor(wp.y / TILE_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    this.pendingTee = { col, row };
    this.drawMarkers();
    this.placementMode = MODE.PLACE_GREEN;
    this.updateStatusText(`Tap to place the Pin  •  0 yds`);
  }

  placeGreen(wp) {
    const col = Math.floor(wp.x / TILE_SIZE);
    const row = Math.floor(wp.y / TILE_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    this.pendingGreen = { col, row };
    this.drawMarkers();
    this.placementMode = MODE.PICK_PAR;
    this.updateStatusText('');
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
    if (this.isOverview) this.toggleOverview();
  }

  // ─── Markers ─────────────────────────────────────────────────────────────

  drawMarkers() {
    this.markerLayer.clear();
    this.markerTexts.forEach(t => t.destroy());
    this.markerTexts = [];

    this.holeSystem.holes.forEach(h => {
      this.drawTeeMarker(h.teeCol, h.teeRow, h.id, 0xffffff);
      this.drawFlagMarker(h.greenCol, h.greenRow, h.id, 0xff4444);
    });

    if (this.pendingTee) this.drawTeeMarker(this.pendingTee.col, this.pendingTee.row, '?', 0xffdd00);
    if (this.pendingGreen) this.drawFlagMarker(this.pendingGreen.col, this.pendingGreen.row, '?', 0xffdd00);
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
    this.markerLayer.lineStyle(2, 0x222222, 1);
    this.markerLayer.lineBetween(x, y - 8, x, y + 6);
    this.markerLayer.fillStyle(color, 1);
    this.markerLayer.fillTriangle(x, y - 8, x + 8, y - 4, x, y);
    const t = this.add.text(x + 2, y + 2, String(label), {
      fontSize: '6px', fill: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.markerTexts.push(t);
  }

  // ─── UI: Toolbar ─────────────────────────────────────────────────────────

  createToolbar() {
    const { width, height } = this.scale;
    const btnW = Math.floor(width / TILE_KEYS.length);

    this.add.rectangle(width / 2, height - 30, width, 60, 0x1a1a1a).setScrollFactor(0);

    TILE_KEYS.forEach((key, i) => {
      const x = i * btnW + btnW / 2;
      const y = height - 30;
      const tile = TILES[key];

      const btn = this.add.rectangle(x, y, btnW - 4, 52, tile.color)
        .setScrollFactor(0).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedTile = key;
        this.cancelHolePlacement();
        this.placementMode = MODE.PAINT;
      });

      this.add.text(x, y + 14, tile.label.substring(0, 4), {
        fontSize: '8px', fill: tile.textColor, fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0);
    });
  }

  // ─── UI: HUD ─────────────────────────────────────────────────────────────

  createHUD() {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 16, width, 32, 0x000000, 0.75).setScrollFactor(0).setDepth(10);

    this.statusText = this.add.text(width / 2, 16, '', {
      fontSize: '9px', fill: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

    this.add.text(width - 6, 8, '★★★☆☆  $12,500', {
      fontSize: '10px', fill: '#f5f0e8', fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(11);

    // Overview button
    const ovBtn = this.add.rectangle(34, 16, 60, 22, 0x333333)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(10);
    this.overviewBtnText = this.add.text(34, 16, 'Overview', {
      fontSize: '8px', fill: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
    ovBtn.on('pointerover', () => ovBtn.setFillStyle(0x555555));
    ovBtn.on('pointerout', () => ovBtn.setFillStyle(0x333333));
    ovBtn.on('pointerdown', () => this.toggleOverview());

    // New Hole button (sandbox only — career holes are procedural)
    if (this.mode === 'sandbox') {
      this.newHoleBtn = this.add.rectangle(110, 16, 80, 22, 0x1b5e20)
        .setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(10);
      this.newHoleBtnText = this.add.text(110, 16, '+ New Hole', {
        fontSize: '9px', fill: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
      this.newHoleBtn.on('pointerover', () => this.newHoleBtn.setFillStyle(0x388e3c));
      this.newHoleBtn.on('pointerout', () => this.newHoleBtn.setFillStyle(0x1b5e20));
      this.newHoleBtn.on('pointerdown', () => this.startHolePlacement());
    }
  }

  updateStatusText(msg) {
    this.statusText.setText(msg);
  }

  updateNewHoleButton() {
    if (!this.newHoleBtn) return;
    const canAdd = this.holeSystem.canAddMore();
    this.newHoleBtn.setVisible(canAdd);
    this.newHoleBtnText.setVisible(canAdd);
  }

  // ─── UI: Par Picker ──────────────────────────────────────────────────────

  showParPicker() {
    const { width, height } = this.scale;
    this.parUI = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(20);

    const bg = this.add.rectangle(0, 0, 200, 100, 0x1a1a1a, 0.95);
    const title = this.add.text(0, -34, 'Select Par', {
      fontSize: '13px', fill: '#f5f0e8', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const parBtns = [3, 4, 5].map((par, i) => {
      const bx = (i - 1) * 58;
      const btn = this.add.rectangle(bx, 8, 48, 36, 0x2d5a1b).setInteractive({ useHandCursor: true });
      const txt = this.add.text(bx, 8, String(par), {
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

    this.parUI.add([bg, title, cancelBtn, cancelTxt, ...parBtns.flat()]);
  }

  hideParPicker() {
    if (this.parUI) { this.parUI.destroy(); this.parUI = null; }
  }

  // ─── UI: Hole List ───────────────────────────────────────────────────────

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
    this.holeListContainer.add(this.add.rectangle(0, 0, 90, panelH, 0x000000, 0.7).setOrigin(1, 0));

    this.holeSystem.holes.forEach((h, i) => {
      const txt = this.add.text(-4, i * lineH + 8, `#${h.id}  Par ${h.par}`, {
        fontSize: '9px', fill: '#c8e6c9', fontFamily: 'monospace',
      }).setOrigin(1, 0);
      this.holeListContainer.add(txt);
    });
  }

  // ─── Career Intro ────────────────────────────────────────────────────────

  showCareerIntro() {
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(30);

    const bg = this.add.rectangle(0, 0, 300, 160, 0x1a1a1a, 0.95);
    const title = this.add.text(0, -58, "You've Inherited a Course", {
      fontSize: '12px', fill: '#f5d76e', fontFamily: 'monospace', fontStyle: 'bold',
      wordWrap: { width: 260 }, align: 'center',
    }).setOrigin(0.5);
    const body = this.add.text(0, -10,
      "Your distant relative left you\nSunset Pines Golf Club.\nIt's a mess — but it's yours.",
      { fontSize: '10px', fill: '#c8e6c9', fontFamily: 'monospace', align: 'center' }
    ).setOrigin(0.5);
    const sub = this.add.text(0, 46,
      "9 holes. Poor condition.\nRepair it. Grow it.",
      { fontSize: '9px', fill: '#888888', fontFamily: 'monospace', align: 'center' }
    ).setOrigin(0.5);

    const okBtn = this.add.rectangle(0, 68, 100, 26, 0x2d5a1b).setInteractive({ useHandCursor: true });
    const okTxt = this.add.text(0, 68, "Let's get to work", {
      fontSize: '9px', fill: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    okBtn.on('pointerdown', () => panel.destroy());

    panel.add([bg, title, body, sub, okBtn, okTxt]);
  }
}
