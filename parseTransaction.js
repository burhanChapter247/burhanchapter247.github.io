function parseTransaction(transactionData, expectedMessageParts) {
    console.log(transactionData,'transactionData',expectedMessageParts)
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
      console.log(
        "Transaction was expected to end with Message Part variables and nothing else"
      );
    if (!messageType) {
      console.log("Transaction without a Message Type variable was detected");
      return
    }
    if (messageType.length !== 1) {
      console.log("Transaction Message Type must be exactly 8 bits");
      return
    }
    if (!signature) {
      console.log("Transaction without a Signature variable was detected");
      return
  
    }
    if (signature.length < 50) {
      console.log("Transaction Signature variable is too small");
      return
    }
    if (messageParts.length !== expectedMessageParts) {
      console.log(
        `Transaction was expected to have exactly ${expectedMessageParts} Message Variables, but was ${messageParts.length}`
      );
      return
  
    }
    return {
      messageType: messageType?.readInt8(),
      signature: bsv.Sig.fromBuffer(signature),
      messageParts,
    };
  }