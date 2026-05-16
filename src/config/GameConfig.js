export const TILE_SIZE = 16;
export const YARDS_PER_TILE = 7;

// World is exactly 2x the screen so overview at 0.5 zoom fills the screen cleanly
const HUD_TOOLBAR_H = 94; // HUD (34px) + toolbar (60px)
export const COLS = Math.ceil(2 * window.innerWidth / TILE_SIZE);
export const ROWS = Math.ceil(2 * (window.innerHeight - HUD_TOOLBAR_H) / TILE_SIZE);
export const OVERVIEW_ZOOM = 0.47; // slightly under 0.5 for a small border

export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;
