async function selectWinners(initTransaction, finalizationTransaction, loadNextTicketSaleTransaction, pubKey) {
	console.log(initTransaction, 'initTransaction', finalizationTransaction)
	const initObject = validateInitTransaction(initTransaction, pubKey);
	const initTxid = Buffer.from(bsv.Tx.fromBuffer(initTransaction).id(), "hex");
	const finalizationObject = validateEndTransaction(
		finalizationTransaction,
		pubKey,
		initTxid
	);
	const ticketIds = []
	let count = 0
	let nextTicketTx = await loadNextTicketSaleTransaction(count);
	console.log(nextTicketTx, 'nextTicketTx+++++')
	while (nextTicketTx) {
		const ticketId = validateTicketSaleTransaction(
			initTxid,
			nextTicketTx,
			pubKey
		);
		console.log(ticketId, 'ticketId+++++++++')
		for (let i = 0; i < ticketIds.length; i++) {
			if (ticketIds[i] === ticketId) {
				throw new Error(
					`Detected that Ticket Sale transaction with Ticket ID ${ticketId} is being processed more than once.`
				);
			}
		}

		ticketIds.push(ticketId);

		if (ticketIds.length > initObject.noOfTickets) {
			break;
		}
		count++
		nextTicketTx = await loadNextTicketSaleTransaction(count);
	}

	if (ticketIds.length !== initObject.noOfTickets) {
		throw Error("Ticket count does not match with expected count.");
	}
	const rng = new RNG(
		initObject.initialSeed,
		...finalizationObject.additionalSeeds
	);
	const sortedRewards = initObject.rewards.sort(
		(a, b) => a.rank - b.rank
	); // from lowest rank to highest
	const processedRewards = [];
	console.log(sortedRewards,'sortedRewards')

	for (const reward of sortedRewards) {
		const winningTicketIds = [];
		for (let i = 0; i < reward.rewardCount; i++) {
			winningTicketIds.push(
				ticketIdsArray[
				rng.getNextUInt32({ max: ticketIdsArray.length })
				]
			);
		}
		processedRewards.push({ reward, winningTicketIds });
	}
	removeLoading();
	console.log(processedRewards,'processedRewards++++++')
	showWinnerInfo(processedRewards);
}

function validateInitTransaction(transactionData, pubKey) {
	const {
		messageType,
		signature,
		messageParts: [messageBuf],
	} = parseTransaction(transactionData, 1)
	if (messageType !== 0) {
		alert("Data are corrupted")
		console.log("Initialization TX message type must be RAFFLE_INITIALIZATION");
		removeLoading()
		return
	}
	if (!validateSignature(pubKey, signature, [messageBuf])) {
		alert("Data are corrupted")
		console.log("Initialization TX Signature validation failed");
		removeLoading()
		return

	}
	initObject = JSON.parse(messageBuf.toString());
	if (initObject.noOfTickets < 2) {
		alert("Data are corrupted")
		console.log("Game must have atleast more than 2 tickets");
		removeLoading()
		return

	}
	if (!initObject.rewards.length) {
		alert("Data are corrupted")
		console.log("Game must have atleast 1 reward");
		removeLoading()
		return

	}

	if (!initObject.rewards.every((item) => item.rewardCount >= 1 && item.rewardPrice && item.rewardTitle && item.description && item.rank > 0)) {
		alert("Data are corrupted")
		console.log("Game rewards not have valid data");
		removeLoading()
		return
	}

	if (!initObject.initialSeed) {
		alert("Data are corrupted")
		console.log("Game must contain the initial seeds")
		removeLoading()
		return

	}
	const regexExp = /^[a-f0-9]{64}$/gi;
	if (!regexExp.test(initObject.initialSeed)) {
		alert("Data are corrupted")
		console.log("Invalid initial seed")
		removeLoading()
		return

	}

	if (!initObject.additionalSeeds?.length) {
		alert("Data are corrupted")
		console.log("Game must contain at least one additional seed");
		removeLoading()
		return

	}

	if (!initObject.additionalSeeds.every(additionalSeed => additionalSeed.description && additionalSeed.regexPattern)) {
		alert("Data are corrupted")
		console.log("Game must contain valid additional seeds")
		removeLoading()
		return

	}
	return initObject
}


function validateEndTransaction(transactionData, pubKey, realInitTxid) {
	const {
		messageType,
		signature,
		messageParts: [messageBuf],
	} = parseTransaction(transactionData, 1)
	if (messageType !== 2) {
		alert("Data are corrupted")
		console.log("Finalization TX message type must be RAFFLE_FINALIZING");
		removeLoading()
	}
	if (!validateSignature(pubKey, signature, [messageBuf])) {
		alert("Data are corrupted")
		console.log("Finalization TX Signature validation failed");
	}
	endObject = JSON.parse(messageBuf.toString());
	const initTxid = Buffer.from(endObject.initializationTxid, "hex");
	console.log(realInitTxid, 'realInitTxid', initTxid)
	if (!initTxid.equals(realInitTxid)) {
		alert("Data are corrupted")
		console.log(
			"The Finalization transaction specifies the wrong initialization TXID"
		);
		removeLoading()
		return

	}
	if (!endObject.lastTicketSoldTimestamp) {
		alert("Data are corrupted")
		console.log("Raffle doesn't have last ticket timestamp")
		removeLoading()
		return

	}
	if (!endObject.additionalSeeds.length || !endObject.additionalSeeds[0]) {
		alert("Data are corrupted")
		console.log("Invalid additional seeds")
		removeLoading()
		return

	}
	if (endObject.additionalSeeds.length !== initObject.additionalSeeds.length) {
		alert("Data are corrupted")
		console.log("Expected additional seeds not found")
		removeLoading()
		return

	}

	for (let i = 0; i < endObject.additionalSeeds.length; i++) {
		const seed = endObject.additionalSeeds[i];
		const regex = initObject.additionalSeeds[i].regexPattern;
		if (!stringToRegex(regex).test(seed)) {
			alert("Data are corrupted")
			console.log("Invalid seeds");
			removeLoading()
			return

		}
	}
	return endObject
}

function validateTicketSaleTransaction(realInitTxid, transactionData, pubKey) {
	const {
		messageType,
		signature,
		messageParts: [initTxidBuf, ticketIdBuf],
	} = parseTransaction(transactionData, 2)
	console.log(messageType, 'messageType++++++++', signature)
	console.log(realInitTxid, 'initTxid+++++++', initTxidBuf)
	if (messageType !== 1) {
		alert("Data are corrupted")
		console.log("Finalization TX message type must be RAFFLE_TICKET_SALE");
		removeLoading()

		return

	}
	if (!validateSignature(pubKey, signature, [initTxidBuf, ticketIdBuf])) {
		alert("Data are corrupted")
		console.log("Finalization TX Signature validation failed");
		removeLoading()
		return
	} const ticketId = bsv.Base58.fromBuffer(ticketIdBuf).toString();
	//TODO: need to remove raffle id check once seed update issue will resolve
	if (!initTxidBuf.equals(realInitTxid)) {
		alert("Data are corrupted")
		console.log(
			`Ticket Sale transaction for ticket ${ticketId} specifies the wrong initialization TXID`
		);
		removeLoading()
		return
	}

	return ticketId
}

function parseTransaction(txBuffer, expectedMessageParts) {
	// const bsv = window.bsvjs

	// const buf = Buffer.alloc(transactionData.byteLength);
	// const view = new Uint8Array(transactionData);
	// for (let i = 0; i < buf.length; ++i) {
	// 	buf[i] = view[i];
	// }
	console.log(txBuffer, 'txBuffertxBuffer')
	const data = bsv.Tx.fromBuffer(txBuffer)
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