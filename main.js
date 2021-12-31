(function () {
  const selectRaffle = document.getElementById("selectRaffle");
  // As with JSON, use the Fetch API & ES6
  fetch("./static/gameIdList.txt")
    .then((response) => response.text())
    .then((data) => {
      console.log(data, 'data+++++++++++')
      // Do something with your data
      let raffleList = data.split(/\n/)
      for (const raffle of raffleList) {
        var option = document.createElement("option");
        option.value = raffle;
        option.text = raffle;
        selectRaffle.appendChild(option);
      }
    });

})();

function handleValidate() {
  const bsv = window.bsvjs
  const e = document.getElementById("selectRaffle");
  const raffleId = e.options[e.selectedIndex].value;
  const S3BucketBaseUrl = "https://ugoflipbucket.s3.eu-west-2.amazonaws.com"
  const pubKey = PubKey.fromPrivKey(
    PrivKey.Testnet.fromString("cUdxDDDbfCsvFqZeVPaNmAzE3MkNBqB6oBfp9xfuPzyfFMFvWQnf")
  ).toString();
  fetch(`./static/txs/${raffleId}/initTx.txt`)
    .then((response) => response.text())
    .then((data) => {
      console.log(data, 'initTransactionData')
      fetch(`${S3BucketBaseUrl}/32f8be27e43a0234bafe21ccb354b1f963ee5236bba866d10c9eb0ef2a7842cb.btx`)
        .then((response) => response.arrayBuffer())
        .then((transactionData) => {
          const {
            messageType,
            signature,
            messageParts: [messageBuf],
          } = parseTransaction(transactionData,1)
          console.log(messageParts,'messageParts+++',messageBuf)
          if (messageType !== "RAFFLE_INITIALIZATION")
            throw Error("Initialization TX message type must be RAFFLE_INITIALIZATION");

          if (!validateSignature(pubKey, signature, [messageBuf]))
            throw Error("Initialization TX Signature validation failed");

          const initObject = JSON.parse(messageBuf.toString());
          console.log(initObject,'initObject+++++')
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

          if (!initObject.additionalSeeds?.length) {
            throw new Error("Raffle must contain atleast one additional seed");
          }

          if (!initObject.additionalSeeds.every(additionalSeed => additionalSeed.description && additionalSeed.regexPattern)) {
            throw new Error("Raffle must contain valid additional seeds")
          }

          fetch(`./static/txs/${raffleId}/ticketIds.txt`)
            .then((response) => response.text())
            .then((data) => {
              const ticketIds = data.split(/\n/)
              if (ticketId.length !== initObject.noOfTickets) {
                throw new Error("Ticket count does not match")
              }
              for (ticketId of ticketIds) {
                fetch(`${S3BucketBaseUrl}/${ticketId}.btx`)
                  .then((response) => response.arrayBuffer())
                  .then((transactionData) => {
                    const {
                      messageType,
                      signature,
                      messageParts: [messageBuf],
                    } = parseTransaction(transactionData,2)

                    if (messageType !== "RAFFLE_TICKET_SALE")
                      throw Error("Finalization TX message type must be RAFFLE_TICKET_SALE");

                    if (!validateSignature(pubKey, signature, [initTxidBuf, ticketIdBuf]))
                      throw Error("Finalization TX Signature validation failed");

                    const ticketId = bsv.Base58.fromBuffer(ticketIdBuf).toString();

                    if (!initTxidBuf.equals(realInitTxid)) {
                      throw new Error(
                        `Ticket Sale transaction for ticket ${ticketId} specifies the wrong initialization TXID`
                      );
                    }
                  })
              }
            })

        })


    })

}

function parseTransaction(transactionData,expectedMessageParts) {
  const buf = Buffer.alloc(transactionData.byteLength);
  const view = new Uint8Array(transactionData);
  console.log(view, 'view+++++++')
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  console.log(buf, 'buf++++++++++')
  const data = bsv.Tx.fromBuffer((buf))
  console.log(data, 'parsedData')
  const bufferValues = data.txOuts[0].script.chunks.map((item) => item.buf);
  console.log(bufferValues, 'bufferValues+++++++')
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
  const hash = bsv.Hash.sha256(Buffer.concat(messageParts));
  return bsv.Ecdsa.verify(hash, signature, pubKey);
}