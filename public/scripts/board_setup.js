export const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/players-data")
    .then((res) => res.json())
    .catch((err) => {
      console.err(err);
      return mockData;
    });
};

const renderAttackCards = (attackCardNodes, attackCards) => {
  attackCardNodes.forEach((attackCard, i) => {
    const { name, id } = attackCards[i];
    const attackCardName = attackCard.querySelector("h1");
    attackCardName.textContent = name;
    attackCard.setAttribute("data-type", `attack-${id}`);
    attackCard.setAttribute("id", `attack-${id}`);
  });
};

const renderOrgans = (organNodes, organCards) => {
  organNodes.forEach((organ, i) => {
    if (organCards[i] !== undefined) {
      const { name, id } = organCards[i];
      const image = organ.querySelector("img");
      image.setAttribute("src", `/assets/organs/${name.toLowerCase()}.png`);
      image.setAttribute("alt", name);
      organ.setAttribute("data-organ", id);
      organ.setAttribute("id", `organ-${id}`);
    } else organ.remove();
  });
};

const renderMyCards = ({ name, attackCards, organCards, isMyTurn }) => {
  const playerOrgans = document.querySelectorAll(".player-area .organ");
  const playerAttacks = document.querySelectorAll(".player-area .attack-card");

  const playerName = document.querySelector(".player-area .name");
  playerName.textContent = name;

  const avatar = document.querySelector(".player-area .player");
  if (isMyTurn) {
    avatar.classList.add("highlight-avatar");
  } else {
    avatar.classList.remove("highlight-avatar");
  }

  renderOrgans(playerOrgans, organCards);
  renderAttackCards(playerAttacks, attackCards);
};

const createOpponentFragment = (
  template,
  { name, organCards, id, isMyTurn },
) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);
  const nameElement = element.querySelector(".name");
  nameElement.textContent = name;

  const organs = element.querySelectorAll(".organ");
  renderOrgans(organs, organCards);

  const avatar = clone.querySelector(".avatar");
  if (isMyTurn) {
    avatar.classList.add("highlight-avatar");
  } else {
    avatar.classList.remove("highlight-avatar");
  }
  return element;
};

export const renderOpponents = (opponents) => {
  const template = document.querySelector(".opponent-template");
  const opponentArea = document.querySelector(".opponent-area");
  opponentArea.innerHTML = "";

  const fragments = opponents.map((opponent) =>
    createOpponentFragment(template, opponent)
  );
  opponentArea.append(...fragments);
};

export const setupGame = async () => {
  const { player, opponents } = await fetchPlayersData();
  renderOpponents(opponents);
  renderMyCards(player);
  return { player, opponents };
};
