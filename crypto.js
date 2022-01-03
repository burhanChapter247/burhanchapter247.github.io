var message = "café";
var key = "something";

var encrypted = CryptoJS.AES.encrypt(message, key);
//equivalent to CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(message), key);
var decrypted = CryptoJS.AES.decrypt(encrypted, key);

$("#1").text("Encrypted: " + encrypted);
$("#2").text("Decrypted: " + decrypted.toString(CryptoJS.enc.Utf8));
