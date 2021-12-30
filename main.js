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
  const e = document.getElementById("selectRaffle");
  const raffleId = e.options[e.selectedIndex].value;
  const S3BucketBaseUrl = "https://ugoflipbucket.s3.eu-west-2.amazonaws.com"
  const bsv = window.bsvjs
  var myHeaders = new Headers();
myHeaders.append('Content-Type','text/plain; charset=UTF-8');
  fetch(`./static/txs/${raffleId}/initTx.txt`)
    .then((response) => response.text())
    .then((data) => {
      console.log(data,'initTransactionData')
      fetch(`${S3BucketBaseUrl}/ba1ae83da82f3866bec05ac5b24a06a478785e054996ac899a25f31784627fc2.txt`,myHeaders)
        .then((response) => response.arrayBuffer())
        .then((transactionData) => {
          console.log(transactionData,'transactionData+++++++++')
          const decoder = new TextDecoder('iso-8859-1');
            const text = decoder.decode(transactionData);
            console.log(text,'text+++++++++++++++++');
          const data = bsv.Tx.fromBuffer((transactionData))
          console.log(data,'parsedData')
          const bufferValues = data.txOuts[0].script.chunks.map((item) => item.buf);
          console.log(bufferValues,'bufferValues+++++++')
          const messageType = bufferValues[2];
          const signature = bufferValues[3];
          const restOfChunks = bufferValues.slice(4);
          const messageParts = restOfChunks.filter((i) => i).map((i) => i);
           console.log(messageType,'messageType++++',messageParts)
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
        })
    })

}