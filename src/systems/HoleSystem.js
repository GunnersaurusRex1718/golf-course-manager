export default class HoleSystem {
  constructor() {
    this.holes = [];
  }

  addHole(teeCol, teeRow, greenCol, greenRow, par) {
    const id = this.holes.length + 1;
    this.holes.push({ id, teeCol, teeRow, greenCol, greenRow, par });
    return id;
  }

  getCount() {
    return this.holes.length;
  }

  canAddMore() {
    return this.holes.length < 18;
  }
}
