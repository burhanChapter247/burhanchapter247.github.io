(function () {

  const selectRaffle = document.getElementById("selectRaffle");
  // As with JSON, use the Fetch API & ES6
  fetch("./static/gameIdList.txt")
    .then((response) => response.text())
    .then((data) => {

      // Do something with your data
      let raffleList = data.split(/\n/)
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

  const S3BucketBaseUrl = "https://ugoflipbucket.s3.eu-west-2.amazonaws.com"
  const pubKey = bsv.PubKey.fromPrivKey(
    bsv.PrivKey.Testnet.fromString("cUdxDDDbfCsvFqZeVPaNmAzE3MkNBqB6oBfp9xfuPzyfFMFvWQnf")
  );


  const e = document.getElementById("selectRaffle");
  const raffleId = e.options[e.selectedIndex].value;
  fetch(`./static/txs/${raffleId}/initTx.txt`)
    .then((response) => response.text())
    .then((data) => {
      let transactionId = data.split(/\n/)
      fetch(`${S3BucketBaseUrl}/${transactionId[0]}.btx`)
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

          if (messageType !== 0)
            throw Error("Initialization TX message type must be RAFFLE_INITIALIZATION");
          if (!validateSignature(pubKey, signature, [messageBuf]))
            throw Error("Initialization TX Signature validation failed");

          const initObject = JSON.parse(messageBuf.toString());
          console.log(initObject,'initObject+++++++++++')
          if (initObject.noOfTickets < 2) {
            throw new Error("Raffle must have atleast more than 2 tickets");
          }
          if (!initObject.rewards.length) {
            throw new Error("Raffle must have atleast 1 reward");
          }

          if (initObject.rewards.every((item) => item.rewardCount > 1 && item.rewardPrice && item.rewardTitle && item.description && item.rank > 0)) {
            throw new Error("Raffle rewards not have valid data");
          }

          if (!initObject.initialSeed) {
            throw new Error("Raffle must contain the initial seeds")
          }
          const regexExp = /^[a-f0-9]{64}$/gi;
          if (!regexExp.test(initObject.initialSeed)) {
            throw new Error("Invalid initial seed")
          }

          // if (!initObject.additionalSeeds?.length) {
          //   throw new Error("Raffle must contain atleast one additional seed");
          // }

          // if (!initObject.additionalSeeds.every(additionalSeed => additionalSeed.description && additionalSeed.regexPattern)) {
          //   throw new Error("Raffle must contain valid additional seeds")
          // }

          fetch(`./static/txs/${raffleId}/ticketIds.txt`)
            .then((response) => response.text())
            .then((data) => {
              const ticketIds = data.split(/\n/)
              console.log(ticketIds.length,'ticketIds.length',initObject.noOfTickets)
              // if (ticketIds.length !== initObject.noOfTickets) {
              //   throw new Error("Ticket count does not match")
              // }
              for (ticketId of ticketIds) {
                fetch(`${S3BucketBaseUrl}/${ticketId}.btx`)
                  .then((response) => response.arrayBuffer())
                  .then((transactionData) => {
                    console.log(transactionData, 'transactionData++++++++++')
                    const {
                      messageType,
                      signature,
                      messageParts: [initTxidBuf, ticketIdBuf],
                    } = parseTransaction(transactionData, 2)
                    console.log(messageType, 'messageType++++++++', signature)
                    console.log(realInitTxid, 'initTxid+++++++', initTxidBuf)
                    if (messageType !== 1)
                      throw Error("Finalization TX message type must be RAFFLE_TICKET_SALE");

                    if (!validateSignature(pubKey, signature, [initTxidBuf, ticketIdBuf]))
                      throw Error("Finalization TX Signature validation failed");

                    const ticketId = bsv.Base58.fromBuffer(ticketIdBuf).toString();
                    console.log(ticketId, 'ticketId', initTxidBuf)
                    if (!initTxidBuf.equals(realInitTxid)) {
                      throw new Error(
                        `Ticket Sale transaction for ticket ${ticketId} specifies the wrong initialization TXID`
                      );
                    }
                  })
              }
            })
          fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
            .then((response) => response.text())
            .then((data) => {
              let finalizeTxId=data.split(/\n/)
              fetch(`${S3BucketBaseUrl}/${finalizeTxId[0]}.btx`)
                .then((response) => response.arrayBuffer())
                .then((transactionData) => {
                  const {
                    messageType,
                    signature,
                    messageParts: [messageBuf],
                  } = parseTransaction(transactionData, 1)
                  if (messageType !== 2)
                    throw Error("Finalization TX message type must be RAFFLE_FINALIZING");

                  if (!validateSignature(pubKey, signature, [messageBuf]))
                    throw Error("Finalization TX Signature validation failed");

                  const endObject = JSON.parse(messageBuf.toString());
                  const initTxid = Buffer.from(endObject.initializationTxid, "hex");
                  console.log(realInitTxid, 'realInitTxid', initTxid)
                  console.log(endObject, 'endObject++++++++++@@@@@@@@@')

                  // if (!initTxid.equals(realInitTxid))
                  //   throw new Error(
                  //     "The Finalization transaction specifies the wrong initialization TXID"
                  //   );
                  if (!endObject.lastTicketSoldTimestamp) {
                    throw new Error("Raffle doesn't have last ticket timestamp")
                  }
                  if (!endObject.additionalSeeds.length || !endObject.additionalSeeds[0]) {
                    throw new Error("Invalid additional seeds")
                  }
                  if (endObject.additionalSeeds.length !== initObject.additionalSeeds.length) {
                    throw new Error("Expected additional seeds not found")
                  }

                  for (let i = 0; i < endObject.additionalSeeds.length; i++) {
                    const seed = endObject.additionalSeeds[i];
                    const regex = initObject.additionalSeeds[i].regexPattern;
                    if (!stringToRegex(regex).test(seed)) {
                      throw new Error("Invalid seeds");
                    }
                  }

                })
            })
        })


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