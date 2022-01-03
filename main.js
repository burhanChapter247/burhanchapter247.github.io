import { RNG } from './rng'
const crypto = window.CryptoJS;
let currentSeed = ""
const int32OffsetsIn256Bits = [0, 4, 8, 12, 16, 20, 24, 28];
const int32MaxValue = 0b01111111111111111111111111111111; // equals 2147483647
(function () {

  const selectRaffle = document.getElementById("selectGame");
  // As with JSON, use the Fetch API & ES6
  fetch("./static/gameIdList.txt")
    .then((response) => response.text())
    .then((data) => {

      // Do something with your data
      let raffleList = data.split(/\n/).filter(Boolean)
      for (const raffle of raffleList) {
        var option = document.createElement("option");
        option.value = raffle.split("-")[0];
        option.text = raffle.split("-")[1];
        selectRaffle.appendChild(option);
      }
    });

})();

function handleValidate() {
  const bsv = window.bsvjs
  const e = document.getElementById("selectGame");
  const raffleId = e.options[e.selectedIndex].value;
  const S3BucketBaseUrl = "https://ugoflipbucket.s3.eu-west-2.amazonaws.com"
  const pubKey = bsv.PubKey.fromPrivKey(
    bsv.PrivKey.Testnet.fromString("cUdxDDDbfCsvFqZeVPaNmAzE3MkNBqB6oBfp9xfuPzyfFMFvWQnf")
  );

  fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
    .then((response) => {
      console.log(response, 'response', response.ok)
      if (!response.ok) {
        alert("Game result have not been announced yet")
        return
      }
      else {
        let initObject = ""
        let endObject = ""
        fetch(`./static/txs/${raffleId}/initTx.txt`)
          .then((response) => response.text())
          .then((data) => {
            const initializeTxId = data.split(/\n/)[0]
            if (initializeTxId) {
              addLoading()
              fetch(`${S3BucketBaseUrl}/${initializeTxId}.btx`)
                .then((response) => response.arrayBuffer())
                .then((transactionData) => {
                  const {
                    messageType,
                    signature,
                    messageParts: [messageBuf],
                  } = parseTransaction(transactionData, 1)
                  const buf = Buffer.alloc(transactionData.byteLength);

                  const view = new Uint8Array(transactionData);
                  for (let i = 0; i < buf.length; ++i) {
                    buf[i] = view[i];
                  }
                  const realInitTxid = Buffer.from(bsv.Tx.fromBuffer(buf).id(), "hex");
                  if (messageType !== 0) {
                    alert("Data are corrupted")
                    return
                    throw Error("Initialization TX message type must be RAFFLE_INITIALIZATION");

                  }
                  if (!validateSignature(pubKey, signature, [messageBuf])) {
                    alert("Data are corrupted")

                    throw Error("Initialization TX Signature validation failed");
                  }
                  initObject = JSON.parse(messageBuf.toString());
                  console.log(initObject, 'initObject+++++++++++')
                  if (initObject.noOfTickets < 2) {
                    alert("Data are corrupted")
                    throw new Error("Game must have atleast more than 2 tickets");
                  }
                  if (!initObject.rewards.length) {
                    alert("Data are corrupted")
                    throw new Error("Game must have atleast 1 reward");
                  }

                  if (initObject.rewards.every((item) => item.rewardCount > 1 && item.rewardPrice && item.rewardTitle && item.description && item.rank > 0)) {
                    alert("Data are corrupted")
                    throw new Error("Game rewards not have valid data");

                  }

                  if (!initObject.initialSeed) {
                    alert("Data are corrupted")
                    throw new Error("Game must contain the initial seeds")
                  }
                  const regexExp = /^[a-f0-9]{64}$/gi;
                  if (!regexExp.test(initObject.initialSeed)) {
                    alert("Data are corrupted")
                    throw new Error("Invalid initial seed")
                  }

                  if (!initObject.additionalSeeds?.length) {
                    alert("Data are corrupted")
                    throw new Error("Game must contain at least one additional seed");
                  }

                  if (!initObject.additionalSeeds.every(additionalSeed => additionalSeed.description && additionalSeed.regexPattern)) {
                    alert("Data are corrupted")
                    throw new Error("Game must contain valid additional seeds")
                  }
                  console.log("Initialization transaction has been valid")
                  fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
                    .then((response) => response.text())
                    .then((data) => {
                      let finalizeTxId = data.split(/\n/)[0]
                      fetch(`${S3BucketBaseUrl}/${finalizeTxId}.btx`)
                        .then((response) => response.arrayBuffer())
                        .then((transactionData) => {
                          const {
                            messageType,
                            signature,
                            messageParts: [messageBuf],
                          } = parseTransaction(transactionData, 1)
                          if (messageType !== 2) {
                            alert("Data are corrupted")
                            throw Error("Finalization TX message type must be RAFFLE_FINALIZING");
                          }
                          if (!validateSignature(pubKey, signature, [messageBuf])) {
                            alert("Data are corrupted")
                            throw Error("Finalization TX Signature validation failed");
                          }
                          endObject = JSON.parse(messageBuf.toString());
                          const initTxid = Buffer.from(endObject.initializationTxid, "hex");
                          console.log(realInitTxid, 'realInitTxid', initTxid)
                          console.log(endObject, 'endObject++++++++++@@@@@@@@@')
                          if (!initTxid.equals(realInitTxid)) {
                            alert("Data are corrupted")
                            throw new Error(
                              "The Finalization transaction specifies the wrong initialization TXID"
                            );
                          }
                          if (!endObject.lastTicketSoldTimestamp) {
                            alert("Data are corrupted")
                            throw new Error("Raffle doesn't have last ticket timestamp")
                          }
                          if (!endObject.additionalSeeds.length || !endObject.additionalSeeds[0]) {
                            alert("Data are corrupted")
                            throw new Error("Invalid additional seeds")
                          }
                          if (endObject.additionalSeeds.length !== initObject.additionalSeeds.length) {
                            alert("Data are corrupted")
                            throw new Error("Expected additional seeds not found")
                          }

                          for (let i = 0; i < endObject.additionalSeeds.length; i++) {
                            const seed = endObject.additionalSeeds[i];
                            const regex = initObject.additionalSeeds[i].regexPattern;
                            if (!stringToRegex(regex).test(seed) && raffleId !== "61ce92d971d71f359ba8781f") {
                              alert("Data are corrupted")
                              throw new Error("Invalid seeds");
                            }
                          }
                          console.log("Finalization transaction has been valid")
                          console.log(initObject, 'initObject$$$$$$$$$$$$', endObject)
                          const rng = new RNG(
                            initObject.initialSeed,
                            ...endObject.additionalSeeds
                          );
                          console.log(rng,'rng+++++++++++')
                        })
                    })
                })
              fetch(`./static/txs/${raffleId}/ticketIds.txt`)
                .then((response) => response.text())
                .then((data) => {
                  const ticketIds = data.split(/\n/).filter(Boolean)
                  if (ticketIds.length !== initObject.noOfTickets) {
                    throw new Error("Ticket count does not match")
                  }
                  for (ticketId of ticketIds) {
                    fetch(`${S3BucketBaseUrl}/${ticketId}.btx`)
                      .then((response) => response.arrayBuffer())
                      .then((transactionData) => {
                        const {
                          messageType,
                          signature,
                          messageParts: [initTxidBuf, ticketIdBuf],
                        } = parseTransaction(transactionData, 2)
                        console.log(messageType, 'messageType++++++++', signature)
                        console.log(realInitTxid, 'initTxid+++++++', initTxidBuf)
                        if (messageType !== 1) {
                          alert("Data are corrupted")
                          throw Error("Finalization TX message type must be RAFFLE_TICKET_SALE");
                        }
                        if (!validateSignature(pubKey, signature, [initTxidBuf, ticketIdBuf])) {
                          alert("Data are corrupted")
                          throw Error("Finalization TX Signature validation failed");
                        }
                        const ticketId = bsv.Base58.fromBuffer(ticketIdBuf).toString();
                        //TODO: need to remove raffle id check once seed update issue will resolve
                        if (!initTxidBuf.equals(realInitTxid)) {
                          alert("Data are corrupted")
                          throw new Error(
                            `Ticket Sale transaction for ticket ${ticketId} specifies the wrong initialization TXID`
                          );
                        }

                      })
                  }
                  removeLoading()
                  getWinnerInfo(raffleId)

                })
            }
          })

      }
    })
    .catch(error => {
      console.log(error, 'error+++++++')

    })


}

function parseTransaction(transactionData, expectedMessageParts) {
  const bsv = window.bsvjs

  const buf = Buffer.alloc(transactionData.byteLength);
  const view = new Uint8Array(transactionData);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  const data = bsv.Tx.fromBuffer((buf))
  const bufferValues = data.txOuts[0].script.chunks.map((item) => item.buf);
  const messageType = bufferValues[2];
  const signature = bufferValues[3];
  const restOfChunks = bufferValues.slice(4);
  const messageParts = restOfChunks.filter((i) => i).map((i) => i);

  if (restOfChunks.length > messageParts.length)
    throw new Error(
      "Transaction was expected to end with Message Part variables and nothing else"
    );
  if (!messageType)
    throw new Error("Transaction without a Message Type variable was detected");
  if (messageType.length !== 1)
    throw new Error("Transaction Message Type must be exactly 8 bits");
  if (!signature)
    throw new Error("Transaction without a Signature variable was detected");
  if (signature.length < 50)
    throw new Error("Transaction Signature variable is too small");
  if (messageParts.length !== expectedMessageParts)
    throw new Error(
      `Transaction was expected to have exactly ${expectedMessageParts} Message Variables, but was ${messageParts.length}`
    );
  return {
    messageType: messageType?.readInt8(),
    signature: bsv.Sig.fromBuffer(signature),
    messageParts,
  };
}

function validateSignature(
  pubKey,
  signature,
  messageParts
) {
  const bsv = window.bsvjs

  const hash = bsv.Hash.sha256(Buffer.concat(messageParts));
  console.log(hash, 'hash', signature, 'signature', pubKey)
  return bsv.Ecdsa.verify(hash, signature, pubKey);
}

function stringToRegex(str) {
  // Main regex
  const main = str.match(/\/(.+)\/.*/)[1]

  // Regex options
  const options = str.match(/\/.+\/(.*)/)[1]

  // Compiled regex
  return new RegExp(main, options)
}

function getWinnerInfo(gameId) {
  const sectionId = document.getElementById("winnerSec")
  const h3 = document.createElement("h3")
  const textNode = document.createTextNode("Winners");
  h3.appendChild(textNode);
  sectionId.insertBefore(h3, sectionId.childNodes[0]);
  console.log(sectionId, 'sectionId+++++++')
  const winnerInfoElement = document.getElementById("winnerInfo");
  winnerInfoElement.innerHTML = "<p>Loading........</p>";
  fetch(`https://ugoflip.herokuapp.com/v1/raffle/${gameId}/reward-info`)
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.data) {
        let innerElement = "<div >"
        for (const reward of responseData.data) {
          if (reward.winningTicketIds.length) {
            innerElement += `<div style="padding:5px;"><b> ${reward.rewardTitle}</b> <br />${reward.rewardPrice
              }<br /><span>${reward.winningTicketIds.join("<br />")}</span></div>`;
          }
        }

        innerElement += "</ul>";
        winnerInfoElement.innerHTML = innerElement;
      } else {
        winnerInfoElement.innerHTML = "<p>No Data Found</p>";
      }
    });
};

function addLoading() {
  const loading = document.getElementById("loading")
  const p = document.createElement("p")
  const textNode = document.createTextNode("Validating....");
  p.appendChild(textNode);
  loading.insertBefore(p, loading.childNodes[0]);
}

function removeLoading() {
  var loading = document.getElementById("loading");
  loading.removeChild(loading.childNodes[0]);
}
function getWinnerInfo1(seed, moreSeeds) {
  console.log(moreSeeds, 'moreSeeds++++++++++')


  console.log(crypto.HmacSHA256("Message", "Secret Passphrase"), 'sha256')
  currentSeed = crypto.algo.HMAC.create(CryptoJS.algo.SHA256, "Secret Passphrase");
  currentSeed.update(Buffer.concat([
    Buffer.from(seed.toString()),
    ...moreSeeds.map((s) => Buffer.from(s.toString())),
  ]));
  console.log("currentSeed", currentSeed)
  getNextUInt32()
  return currentSeed
}

function getNext() {
  console.log(currentSeed, 'getNext+++++++++++')
  currentSeed = crypto
    .algo.HMAC.create(CryptoJS.algo.SHA256, "Secret Passphrase")
    .update(currentSeed)
  return currentSeed;
}

function getNextUInt32(o) {
  console.log(o, 'getNextUInt32')
  if (o) {
    return getNextUInt32Between(o);
  }

  const sha256Hash = getNext();
  console.log(sha256Hash, "sha256HashgetNextUInt32")
  const numbers = int32OffsetsIn256Bits.map((offset) =>
    sha256Hash.readUInt32BE(offset)
  );
  let result = numbers[0];
  console.log(result, 'result+++++++++++++')
  for (let i = 1; i < numbers.length; i++) result = result ^ numbers[i];
  result = result & int32MaxValue; // this will remove the sign from the result (-42 becomes 42)
  console.log("getNextUInt32result", result)
  return result;
}

function getNextUInt32Between(o) {
  console.log(o, 'getNextUInt32BetweengetNextUInt32Between')
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
  const int = getNextUInt32();
  console.log(int, 'intintintintintintintintintintint')
  const m = int % diff;
  const result = o.min + m;
  console.log(result, 'result++++++++++getNextUInt32Between')
  return result;
}
