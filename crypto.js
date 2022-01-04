var crypto = require("crypto-js/core");
CryptoJS.AES = require("crypto-js/aes");

const int32OffsetsIn256Bits = [0, 4, 8, 12, 16, 20, 24, 28];
const int32MaxValue = 0b01111111111111111111111111111111; // equals 2147483647
class RNG {
  constructor(seed, ...moreSeeds) {
    this.currentSeed = crypto
      .createHash("sha256")
      .update(
        Buffer.concat([
          Buffer.from(seed.toString()),
          ...moreSeeds.map((s) => Buffer.from(s.toString())),
        ])
      )
      .digest();
  }

  getNext() {
    this.currentSeed = crypto
      .createHash("sha256")
      .update(this.currentSeed)
      .digest();
    return this.currentSeed;
  }

  getNextUInt32(o) {
    if (o) {
      return this.getNextUInt32Between(o);
    }

    const sha256Hash = this.getNext();
    const numbers = int32OffsetsIn256Bits.map((offset) =>
      sha256Hash.readUInt32BE(offset)
    );
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) result = result ^ numbers[i];
    result = result & int32MaxValue; // this will remove the sign from the result (-42 becomes 42)
    return result;
  }

  getNextUInt32Between(o) {
    if (!o) throw new Error("no integer limits provided");
    if (!o.max) throw new Error("no integer max limit provided");
    if (!o.min) o.min = 0;
    o.min = Math.floor(o.min);
    o.max = Math.floor(o.max);
    if (o.min < 0) throw new Error(`min limit cannot be smaller than 0`);
    if (o.min >= o.max)
      throw new Error(
        `max limit (${o.max}) must be greater than min limit (${o.min})`
      );

    const diff = o.max - o.min;
    const int = this.getNextUInt32();
    const m = int % diff;
    const result = o.min + m;
    return result;
  }
}
