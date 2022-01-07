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