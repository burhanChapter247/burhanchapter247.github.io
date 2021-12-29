(function () {
  /*  const RaffleList = ["raffle1", "raffle2", "raffle3", "raffle4", "raffle5"];

  const selectRaffle = document.getElementById("selectRaffle");
  let option = document.createElement("option");

  for (const raffle of RaffleList) {
    option.text = raffle;
    selectRaffle.add(option);
  } */
  // As with JSON, use the Fetch API & ES6
  fetch("txId.txt")
    .then((response) => response.text())
    .then((data) => {
      // Do something with your data
      console.log(data);
    });
})();
