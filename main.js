(function () {
  const RaffleList = ["raffle1", "raffle2", "raffle3", "raffle4", "raffle5"];

  const selectRaffle = document.getElementById("selectRaffle");
  let option = document.createElement("option");

  for (const raffle of RaffleList) {
    option.text = raffle;
    selectRaffle.add(option);
  }
})();
