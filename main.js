(function () {

  const selectRaffle = document.getElementById("selectRaffle");
  // As with JSON, use the Fetch API & ES6
  fetch("https://ugoflipbucket.s3.eu-west-2.amazonaws.com/1e8bf697d0fc3dad576281d8d1f2692cfdccc51f11d1759d5ffabfd4e280fe9c.btx")
    .then((response) => response.text())
    .then((data) => {
      console.log(data,'data+++++++++++')
      // Do something with your data
      let raffleList = data.split(/\n/)
      console.log(raffleList)
      for (const raffle of raffleList) {
        var option = document.createElement("option");
        option.value = raffle;
        option.text = raffle;
        selectRaffle.appendChild(option);
      }
    });
})();
