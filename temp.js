const getWinnerInfo = (gameId = "61ce92d971d71f359ba8781f") => {
  const winnerInfoElement = document.getElementById("winnerInfo");
  winnerInfoElement.value = "Loading........";
  fetch(`https://ugoflip.herokuapp.com/v1/raffle/${gameId}/reward-info`)
    .then((response) => response.json())
    .then((rewards) => {
      if (rewards) {
        let innerElement = "<ul>";
        for (const reward of rewards) {
          if (reward.winningTicketIds.length) {
            innerElement = `<li>Reward: ${reward.rewardTitle}, Price: ${
              reward.rewardPrice
            }, Winning Ticket Ids: ${reward.winningTicketIds.join(",")}</li>`;
          }
        }

        innerElement = "</ul>";
        winnerInfoElement.value = innerElement;
      } else {
        winnerInfoElement.value = "No Data Found";
      }
    });
};
