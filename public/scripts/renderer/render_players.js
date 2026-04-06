const renderPlayerInfo = (template, myID, playerCount, players) => {
  return (player) => {
    const playerDetail = document.importNode(template.content, true);
    const detailContainer = playerDetail.querySelector("li");
    const nameField = playerDetail.querySelector(".player-name");
    const indication = playerDetail.querySelector("#indication");

    if (player.id === myID) {
      indication.textContent = "(YOU)";
    }

    playerCount.textContent = players.length;
    detailContainer.id = player.id;
    nameField.textContent = player.name;

    return detailContainer;
  };
};

export const renderPlayers = (players, myID, roomID) => {
  const playerCount = document.querySelector("#players-count #number");
  const template = document.querySelector("#player-row");
  const joinedPlayers = document.querySelector("#waiting-members ul");
  const roomIDField = document.querySelector("#room-number");
  roomIDField.textContent = roomID;

  const lobbyDetails = players
    .map(renderPlayerInfo(template, myID, playerCount, players));

  joinedPlayers.replaceChildren(...lobbyDetails);
};
