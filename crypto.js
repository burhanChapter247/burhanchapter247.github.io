class RNG {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }

  getVal() {
    return this.height + this.width;
  }
}

const p = new RNG(5, 5);
console.log("getValgetValgetValgetVal", p.getVal());
