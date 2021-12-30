(function () {

    const bsv = require("bsv");
  
    //const privateKey = new bsv.PrivateKey.fromWIF('pL3yyzZEc96qU8PUyAtk3TBzyosTVGhA1eMWc6icZzS2ZKTnHGuAh');
    const privateKey = bsv.PrivateKey.fromWIF('L3yyzZEc96qU8PUyAtk3TBzyosTVGhA1eMWc6icZzS2ZKTnHGuAh');
    
    const utxo = new bsv.Transaction.UnspentOutput({
      "txId" : "600fee0e6eca8eb19c40f5bfae5871446e617d44c39a3ad44782c571dbf59650",
      "outputIndex" : 1,
      "address" : "12cyVmfJVwkBA4MUSUDarUL2jXiM98JEoe",
      "script" : "76a91411c5d84f5eca47921b0b92042de543f209c301a188ac",
      "satoshis" : 6691
    });
    
    const transaction = new bsv.Transaction()
    .from(utxo)
    .to('1PM2zxJArgHFxqYkrFqN7aKQV8nfnEGA56', 5000)
    .change('1PM2zxJArgHFxqYkrFqN7aKQV8nfnEGA56')
    .sign(privateKey);
    
    console.log(transaction.toString());
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
    const RaffleList = ["raffle1", "raffle2", "raffle3", "raffle4", "raffle5"];
    // fetch('test.txt')
    // .then(response => response.text())
    // .then(text => console.log(text))
    var rawFile = new XMLHttpRequest(); // XMLHttpRequest (often abbreviated as XHR) is a browser object accessible in JavaScript that provides data in XML, JSON, but also HTML format, or even a simple text using HTTP requests.
    // fetch("file:///mnt/3ed671e8-ae78-42a3-a4d1-e988c757df07/burhanchapter247.github.io/test1.txt")
      // .then((response) => {
    //   console.log(response,'response+++++++++++')
    // 		return response.text();
      // })
      // .then((text) => {
    // 		console.log(text);
      // });
  
    // var fs = require('fs');
    // fs.writeFile('/Input.txt', 'Cool, I can do this in the browser!', function(err) {
    //   console.log(err,'err++++++++++++')
    //   fs.readFile('/index.html', function(err, contents) {
    //     console.log(contents,'contente++++++',err);
    //   });
    // });
  
    
    // rawFile.open("GET", "test.txt", true); // open with method GET the file with the link file ,  false (synchronous)
    // console.log(rawFile,'rawFile++++++')
    // rawFile.onreadystatechange = function () {
    //   if (rawFile.readyState === 4) // readyState = 4: request finished and response is ready
    //   {
  
    //     if (rawFile.status === 200) // status 200: "OK"
    //     {
    //       var allText = rawFile.responseText; //  Returns the response data as a string
    //       console.log(allText); // display text on the console
    //     }
    //   }
    // }
    // rawFile.send("null")
    const selectRaffle = document.getElementById("selectRaffle");
  
    for (const raffle of RaffleList) {
      var option = document.createElement("option");
      option.value = "" + raffle;
      option.text = raffle;
      selectRaffle.appendChild(option);
    }
  })();
  