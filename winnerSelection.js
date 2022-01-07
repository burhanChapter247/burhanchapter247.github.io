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

	if (!initObject.rewards.every((item) => item.rewardCount > 1 && item.rewardPrice && item.rewardTitle && item.description && item.rank > 0)) {
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
	console.log(endObject, 'wineerslection')
	return endObject
}