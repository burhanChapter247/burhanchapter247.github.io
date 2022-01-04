
const crypto = window.CryptoJS;
const int32OffsetsIn256Bits = [0, 4, 8, 12, 16, 20, 24, 28];
const int32MaxValue = 0b01111111111111111111111111111111; // equals 2147483647
export class RNG {

    constructor(seed, moreSeeds) {
        this.currentSeed = seed
        // this.currentSeed = crypto.algo.HMAC.create(CryptoJS.algo.SHA256, "Secret Passphrase");
        // currentSeed.update(Buffer.concat([
        //     Buffer.from(seed.toString()),
        //     ...moreSeeds.map((s) => Buffer.from(s.toString())),
        // ]));
    }
    test1() {
        console.log(this.currentSeed, 'currestsseed+++++++++++++')
    }
    // getNext() {
    //     console.log(currentSeed, 'getNext+++++++++++')
    //     this.currentSeed = crypto
    //         .algo.HMAC.create(CryptoJS.algo.SHA256, "Secret Passphrase")
    //         .update(this.currentSeed)
    //     return currentSeed;
    // }

    // getNextUInt32(o) {
    //     console.log(o, 'getNextUInt32')
    //     if (o) {
    //         return getNextUInt32Between(o);
    //     }

    //     const sha256Hash = getNext();
    //     console.log(sha256Hash, "sha256HashgetNextUInt32")
    //     const numbers = int32OffsetsIn256Bits.map((offset) =>
    //         sha256Hash.readUInt32BE(offset)
    //     );
    //     let result = numbers[0];
    //     console.log(result, 'result+++++++++++++')
    //     for (let i = 1; i < numbers.length; i++) result = result ^ numbers[i];
    //     result = result & int32MaxValue; // this will remove the sign from the result (-42 becomes 42)
    //     console.log("getNextUInt32result", result)
    //     return result;
    // }

    // getNextUInt32Between(o) {
    //     console.log(o, 'getNextUInt32BetweengetNextUInt32Between')
    //     if (!o) throw new Error("no integer limits provided");
    //     if (!o.max) throw new Error("no integer max limit provided");
    //     if (!o.min) o.min = 0;
    //     o.min = Math.floor(o.min);
    //     o.max = Math.floor(o.max);
    //     if (o.min < 0) throw new Error(`min limit cannot be smaller than 0`);
    //     if (o.min >= o.max)
    //         throw new Error(
    //             `max limit (${o.max}) must be greater than min limit (${o.min})`
    //         );

    //     const diff = o.max - o.min;
    //     const int = getNextUInt32();
    //     console.log(int, 'intintintintintintintintintintint')
    //     const m = int % diff;
    //     const result = o.min + m;
    //     console.log(result, 'result++++++++++getNextUInt32Between')
    //     return result;
    // }
}

// function test() {
//     alert("hello")
// }

// module.exports = RNG