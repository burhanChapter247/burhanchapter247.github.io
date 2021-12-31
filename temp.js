const getWinnerInfo = (gameId = "61ce92d971d71f359ba8781f") => {
  const winnerInfoElement = document.getElementById("winnerInfo");
  winnerInfoElement.value = "Loading........";
  fetch(`https://ugoflip.herokuapp.com/v1/raffle/${gameId}/reward-info`)
    .then((response) => response.json())
    .then((responseData) => {
      if (responseData.data) {
        let innerElement = "<ul>";
        for (const reward of responseData.data) {
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
