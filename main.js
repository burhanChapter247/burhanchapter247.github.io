

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

async function handleValidate() {
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
        let endObject = ""
        let initObject = ""
        fetch(`./static/txs/${raffleId}/initTx.txt`)
          .then((response) => response.text())
          .then((data) => {
            const initializeTxId = data.split(/\n/)[0]
            if (initializeTxId) {
              addLoading()
              fetch(`${S3BucketBaseUrl}/${initializeTxId}.btx`)
                .then((response) => response.arrayBuffer())
                .then(async (transactionData) => {
                  // const {
                  //   messageType,
                  //   signature,
                  //   messageParts: [messageBuf],
                  // } = parseTransaction(transactionData, 1)
                  const buf = Buffer.alloc(transactionData.byteLength);

                  const view = new Uint8Array(transactionData);
                  for (let i = 0; i < buf.length; ++i) {
                    buf[i] = view[i];
                  }
                  const realInitTxid = Buffer.from(bsv.Tx.fromBuffer(buf).id(), "hex");
                  initObject = validateInitTransaction(transactionData, pubKey)
                  console.log(initObject, 'initObject+++++++')
                  console.log("Initialization transaction has been valid")
                  fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
                    .then((response) => response.text())
                    .then((data) => {
                      let finalizeTxId = data.split(/\n/)[0]
                      fetch(`${S3BucketBaseUrl}/${finalizeTxId}.btx`)
                        .then((response) => response.arrayBuffer())
                        .then((transactionData) => {
                          endObject = validateEndTransaction(transactionData, pubKey, realInitTxid)
                          console.log(endObject, 'endObject+++++')
                          console.log("Finalization transaction has been valid")
                        })
                    })
                  const response = await fetch(`./static/txs/${raffleId}/ticketIds.txt`)
                  console.log(response, 'response++++++++')
                  const data = await response.text()
                  console.log(data, 'data++++++++++++')
                  const ticketIds = data.split(/\n/).filter(Boolean)
                  if (ticketIds.length !== initObject.noOfTickets) {
                    console.log("Ticket count does not match")
                    removeLoading()
                    return
                  }
                  const ticketIdsArray = []
                  let count = 0
                  while (ticketIdsArray.length < ticketIds.length) {
                    console.log(ticketIds[count], 'ticketIds[count]', count)
                    const transactionResponse = await fetch(`${S3BucketBaseUrl}/${ticketIds[count]}.btx`)
                    console.log(transactionResponse, 'transactionResponse')
                    const transactionData = await transactionResponse.arrayBuffer()
                    console.log(transactionData, 'arrayBuffer')
                    ticketId = validateTicketSaleTransaction(realInitTxid, transactionData, pubKey)
                    console.log(ticketId, 'ticketId++++++++')
                    for (let i = 0; i < ticketIdsArray.length; i++) {
                      if (ticketIdsArray[i] === ticketId) {
                        console.log(
                          `Detected that Ticket Sale transaction with Ticket ID ${ticketId} is being processed more than once.`
                        );
                        return
                      }
                    }
                    ticketIdsArray.push(ticketId);
                    console.log(ticketIdsArray, 'ticketIds+++++++')
                    count++
                  }
                  if (ticketIdsArray.length !== initObject.noOfTickets) {
                    console.log("Ticket count does not match with expected count.");
                    return
                  }
                  const rng = new RNG(
                    initObject.initialSeed,
                    ...endObject.additionalSeeds
                  );
                  const sortedRewards = initObject.rewards.sort((a, b) => a.rank - b.rank); // from lowest rank to highest
                  const processedRewards = [];

                  for (const reward of sortedRewards) {
                    const winningTicketIds = [];
                    for (let i = 0; i < reward.rewardCount; i++) {
                      winningTicketIds.push(
                        ticketIdsArray[rng.getNextUInt32({ max: ticketIdsArray.length })]
                      );
                    }
                    processedRewards.push({ reward, winningTicketIds });
                  }
                  removeLoading()
                  showWinnerInfo(processedRewards)
                })
            }
          })

      }
    })
    .catch(error => {
      console.log(error, 'error+++++++')

    })
}
function showWinnerInfo(winnerInfoList) {
  console.log(winnerInfoList, 'winnerInfo+++++++')
  const sectionId = document.getElementById("winnerSec")
  const h3 = document.createElement("h3")
  const textNode = document.createTextNode("Winners");
  h3.appendChild(textNode);
  sectionId.insertBefore(h3, sectionId.childNodes[0]);
  const winnerInfoElement = document.getElementById("winnerInfo");
  winnerInfoElement.innerHTML = "<p>Loading........</p>";
  if (winnerInfoList && winnerInfoList.length) {
    let innerElement = "<div >"
    for (const winnerInfo of winnerInfoList) {
      if (winnerInfo.winningTicketIds.length) {
        innerElement += `<div style="text-align:center;"><span ><b> ${winnerInfo.reward.rewardTitle}</b></span> <br />${winnerInfo.reward.rewardPrice
          }<br />${winnerInfo.winningTicketIds.join("<br />")}</div>`;
      }
    }

    innerElement += "</ul>";
    winnerInfoElement.innerHTML = innerElement;
  } else {
    winnerInfoElement.innerHTML = "<p>No Data Found</p>";
  }

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


