(function () {
  const selectRaffle = document.getElementById("selectGame");
  fetch("./static/gameIdList.txt")
    .then((response) => response.text())
    .then((data) => {
      const raffleList = data.split(/\n/).filter(Boolean);
      for (const raffle of raffleList) {
        var option = document.createElement("option");
        option.value = raffle.split("-")[0];
        option.text = raffle.split("-").slice(1).join("-");
        selectRaffle.appendChild(option);
      }
    });
})();
const S3BucketBaseUrl = "https://ugoflipbucket.s3.eu-west-2.amazonaws.com/";
async function handleValidate() {
  const bsv = window.bsvjs;
  const e = document.getElementById("selectGame");
  const raffleId = e.options[e.selectedIndex].value;
  const pubKey = bsv.PubKey.fromPrivKey(
    bsv.PrivKey.Testnet.fromString(
      "cUdxDDDbfCsvFqZeVPaNmAzE3MkNBqB6oBfp9xfuPzyfFMFvWQnf"
    )
  );
  // fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
  //   .then((response) => {
  //     if (!response.ok) {
  //       alert("Game result have not been announced yet.");
  //       return;
  //     } else {
  // let finalizationObject = "";
  // let initObject = "";
  const initializeTxFileData = await readFile(`${raffleId}/initTx.txt`);
  const initializeTxId = initializeTxFileData.split(/\n/)[0];
  const finalizeTXFileData = await readFile(`${raffleId}/finalizeTx.txt`)
  if (!finalizeTXFileData) {
    alert("Game result have not been announced yet.");
  }
  console.log(finalizeTXFileData, 'finalizeTXFileData')
  const finalizeTXId = finalizeTXFileData.split(/\n/)[0]
  console.log(initializeTxFileData, 'initializeTxFileData', initializeTxId)
  console.log(finalizeTXFileData, 'finalizeTXFileData', finalizeTXId)
  if (initializeTxId) {
    addLoading();
    const initializationTx = await readTxBufferFromS3File(`${initializeTxId}.btx`);
    if (!initializationTx)
      console.log("Failed to find Init Tx for : " + raffleId);
    const finalizationTx = await readTxBufferFromS3File(`${finalizeTXId}.btx`);
    if (!finalizationTx)
      console.log(
        "Failed to find Finalization Tx for : " + raffleId
      );
    const ticketIds = await readFile(`${raffleId}/ticketIds.txt`).split(/\n/).filter(Boolean)
    console.log(ticketIds, 'ticketIds')
    selectWinners(
      initializationTx,
      finalizationTx,
      async (count) => {
        console.log(count, 'count+++++++')
        if (count < ticketIds.length) {
          const nextRecord = await readTxBufferFromS3File(`${ticketIds[count]}.btx`)
          return nextRecord
        }
      },
      pubKey
    )
    // const initTransaction = await readTxBufferFromS3File(`${initializeTxId}.btx`);
  }
  // fetch(`./static/txs/${raffleId}/initTx.txt`)
  //   .then((response) => response.text())
  //   .then((data) => {
  //     const initializeTxId = data.split(/\n/)[0];
  //     if (initializeTxId) {
  //       addLoading();
  //       const initTransaction = await readTxBufferFromS3File(`${initializeTxId}.btx`);
  //       initObject = validateInitTransaction(initTransaction, pubKey);
  //       const initTxid = Buffer.from(
  //         bsv.Tx.fromBuffer(buf).id(),
  //         "hex"
  //       );
  //       const finalTransaction = await readTxBufferFromS3File(`${fin}.btx`);
  //       finalizationObject = validateEndTransaction(
  //         transactionData,
  //         pubKey,
  //         realInitTxid
  //       );
  //       console.log(
  //         "Finalization transaction has been valid"
  //       );
  //       const initTransaction = await readTxBufferFromS3File(`${initializeTxId}.btx`);
  //       fetch(`${S3BucketBaseUrl}/${initializeTxId}.btx`)
  //         .then((response) => response.arrayBuffer())
  //         .then(async (transactionData) => {
  //           const buf = Buffer.alloc(transactionData.byteLength);

  //           const view = new Uint8Array(transactionData);
  //           for (let i = 0; i < buf.length; ++i) {
  //             buf[i] = view[i];
  //           }
  //           const realInitTxid = Buffer.from(
  //             bsv.Tx.fromBuffer(buf).id(),
  //             "hex"
  //           );
  //           initObject = validateInitTransaction(transactionData, pubKey);
  //           console.log("Initialization transaction has been valid");
  //           fetch(`./static/txs/${raffleId}/finalizeTx.txt`)
  //             .then((response) => response.text())
  //             .then((data) => {
  //               let finalizeTxId = data.split(/\n/)[0];
  //               fetch(`${S3BucketBaseUrl}/${finalizeTxId}.btx`)
  //                 .then((response) => response.arrayBuffer())
  //                 .then((transactionData) => {
  //                   finalizationObject = validateEndTransaction(
  //                     transactionData,
  //                     pubKey,
  //                     realInitTxid
  //                   );
  //                   console.log(
  //                     "Finalization transaction has been valid"
  //                   );
  //                 });
  //             });
  //           const response = await fetch(
  //             `./static/txs/${raffleId}/ticketIds.txt`
  //           );
  //           console.log(response, "response++++++++");
  //           const data = await response.text();
  //           console.log(data, "data++++++++++++");
  //           const ticketIds = data.split(/\n/).filter(Boolean);
  //           if (ticketIds.length !== initObject.noOfTickets) {
  //             console.log("Ticket count does not match");
  //             removeLoading();
  //             return;
  //           }
  //           const ticketIdsArray = [];
  //           let count = 0;
  //           while (ticketIdsArray.length < ticketIds.length) {
  //             const transactionResponse = await fetch(
  //               `${S3BucketBaseUrl}/${ticketIds[count]}.btx`
  //             );
  //             console.log(transactionResponse, "transactionResponse");
  //             const transactionData =
  //               await transactionResponse.arrayBuffer();
  //             console.log(transactionData, "arrayBuffer");
  //             ticketId = validateTicketSaleTransaction(
  //               realInitTxid,
  //               transactionData,
  //               pubKey
  //             );
  //             console.log(ticketId, "ticketId++++++++");
  //             for (let i = 0; i < ticketIdsArray.length; i++) {
  //               if (ticketIdsArray[i] === ticketId) {
  //                 console.log(
  //                   `Detected that Ticket Sale transaction with Ticket ID ${ticketId} is being processed more than once.`
  //                 );
  //                 return;
  //               }
  //             }
  //             ticketIdsArray.push(ticketId);
  //             console.log(ticketIdsArray, "ticketIds+++++++");
  //             count++;
  //           }
  //           if (ticketIdsArray.length !== initObject.noOfTickets) {
  //             console.log(
  //               "Ticket count does not match with expected count."
  //             );
  //             return;
  //           }
  //           const rng = new RNG(
  //             initObject.initialSeed,
  //             ...finalizationObject.additionalSeeds
  //           );
  //           const sortedRewards = initObject.rewards.sort(
  //             (a, b) => a.rank - b.rank
  //           ); // from lowest rank to highest
  //           const processedRewards = [];

  //           for (const reward of sortedRewards) {
  //             const winningTicketIds = [];
  //             for (let i = 0; i < reward.rewardCount; i++) {
  //               winningTicketIds.push(
  //                 ticketIdsArray[
  //                 rng.getNextUInt32({ max: ticketIdsArray.length })
  //                 ]
  //               );
  //             }
  //             processedRewards.push({ reward, winningTicketIds });
  //           }
  //           removeLoading();
  //           showWinnerInfo(processedRewards);
  //         });
  //     }
  //   });
  // }
  // })
  // .catch((error) => {
  //   console.log(error, "Caught error while selecting winners");
  // });
}

function stringToRegex(str) {
  // Main regex
  const main = str.match(/\/(.+)\/.*/)[1];

  // Regex options
  const options = str.match(/\/.+\/(.*)/)[1];

  // Compiled regex
  return new RegExp(main, options);
}

function showWinnerInfo(winnerInfoList) {
  console.log(winnerInfoList, "winnerInfo+++++++");
  const sectionId = document.getElementById("winnerSec");
  const h3 = document.createElement("h3");
  const textNode = document.createTextNode("Winners");
  h3.appendChild(textNode);
  sectionId.insertBefore(h3, sectionId.childNodes[0]);
  const winnerInfoElement = document.getElementById("winnerInfo");
  winnerInfoElement.innerHTML = "<p>Loading........</p>";
  if (winnerInfoList && winnerInfoList.length) {
    let innerElement = "<div >";
    for (const winnerInfo of winnerInfoList) {
      if (winnerInfo.winningTicketIds.length) {
        innerElement += `<div style="text-align:center;"><span ><b> ${winnerInfo.reward.rewardTitle
          }</b></span> <br />${winnerInfo.reward.rewardPrice
          }<br />${winnerInfo.winningTicketIds.join("<br />")}</div>`;
      }
    }

    innerElement += "</ul>";
    winnerInfoElement.innerHTML = innerElement;
  } else {
    winnerInfoElement.innerHTML = "<p>No Data Found</p>";
  }
}

function addLoading() {
  const loading = document.getElementById("loading");
  const p = document.createElement("p");
  const textNode = document.createTextNode("Validating....");
  p.appendChild(textNode);
  loading.insertBefore(p, loading.childNodes[0]);
}

function removeLoading() {
  var loading = document.getElementById("loading");
  loading.removeChild(loading.childNodes[0]);
}

async function readTxBufferFromS3File(fileName) {
  const response = await fetch(`${S3BucketBaseUrl}${fileName}`);
  const tx = await response.arrayBuffer();
  const buf = Buffer.alloc(tx.byteLength);

  const view = new Uint8Array(tx);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  console.log(buf, 'buf+++++++++++++')
  return buf;
}

async function readFile(fileName) {
  const response = await fetch(`./static/txs/${fileName}`);
  console.log(response, 'readfileresponse')
  return response && response.ok ? await response.text() : null;
}

async function loadNextTransaction(ticketId) {
  console.log(ticketId, 'ticketId++++++++')
  const transactionResponse = await readTxBufferFromS3File(`${ticketId}.btx`)
  console.log(transactionResponse, 'transactionResponsetransactionResponse')
  return transactionResponse
}

// async function selectWinners(initTransaction, finalizationTransaction, loadNextTicketSaleTransaction, pubKey) {
//   const initObject = validateInitTransaction(initTransaction, pubKey);
//   const initTxid = Buffer.from(bsv.Tx.fromBuffer(initTransaction).id(), "hex");
//   const finalizationObject = validateEndTransaction(
//     initObject,
//     initTxid,
//     finalizationTransaction,
//     pubKey
//   );
//   const ticketIds = []
//   let count = 0
//   let nextTicketTx = await loadNextTicketSaleTransaction();
//   console.log(nextTicketTx, 'nextTicketTx+++++')
//   while (nextTicketTx) {
//     const ticketId = validateTicketSaleTransaction(
//       initTxid,
//       nextTicketTx,
//       pubKey
//     );
//     console.log(ticketId, 'ticketId+++++++++')
//     for (let i = 0; i < ticketIds.length; i++) {
//       if (ticketIds[i] === ticketId) {
//         throw new Error(
//           `Detected that Ticket Sale transaction with Ticket ID ${ticketId} is being processed more than once.`
//         );
//       }
//     }

//     ticketIds.push(ticketId);

//     if (ticketIds.length > initObject.noOfTickets) {
//       break;
//     }
//     nextTicketTx = await loadNextTicketSaleTransaction();
//     count++
//   }
//   if (ticketIds.length !== initObject.noOfTickets) {
//     throw Error("Ticket count does not match with expected count.");
//   }
//   const rng = new RNG(
//     initObject.initialSeed,
//     ...finalizationObject.additionalSeeds
//   );

// }