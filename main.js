(function () {
  /*  const RaffleList = ["raffle1", "raffle2", "raffle3", "raffle4", "raffle5"];

  const selectRaffle = document.getElementById("selectRaffle");
  let option = document.createElement("option");

  for (const raffle of RaffleList) {
    option.text = raffle;
    selectRaffle.add(option);
  } */
  // As with JSON, use the Fetch API & ES6
  fetch("gameIdList.txt")
    .then((response) => response.text())
    .then((data) => {
      // Do something with your data
      let raffleList = data.split("/\n/")
      console.log(raffleList)
      for (const raffle of raffleList) {
        var option = document.createElement("option");
        option.value = raffle;
        option.text = raffle;
        selectRaffle.appendChild(option);
      }
    });
})();
