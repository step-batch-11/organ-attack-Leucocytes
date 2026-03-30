globalThis.onload = async () => {
  const { currentPlayerData, otherPlayersData, playerId } = await fetch(
    "/players-data",
  ).then((x) => x.json());

  const opponentTemplate = document.querySelector(".opponent-template");
  const opponentArea = document.querySelector(".opponent-area");
  let id = playerId;

  otherPlayersData.forEach((player) => {
    const clone = opponentTemplate.content.cloneNode(true);
    clone.id = `player-${id}`;
    id = ++id % 6;
    const organs = [...clone.querySelectorAll(".organ")];
    organs.forEach((organ, i) => {
      console.log(player.organCards);
      organ.textContent = player.organCards[i].name;
    });
    opponentArea.append(clone);
  });

  const currentPlayerOrgans = [
    ...document.querySelectorAll(".player-area .organ"),
  ];
  currentPlayerOrgans.forEach((organ, i) => {
    organ.textContent = currentPlayerData.organCards[i].name;
  });

  const currentPlayerAttacks = [
    ...document.querySelectorAll(".player-area .attack-card"),
  ];
  currentPlayerAttacks.forEach((attackCard, i) => {
    attackCard.textContent = currentPlayerData.attackCards[i].name;
  });
};
