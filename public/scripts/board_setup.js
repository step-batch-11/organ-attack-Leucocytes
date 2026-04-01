export const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/players-data")
    .then((res) => res.json())
    .catch((err) => {
      console.err(err);
      return mockData;
    });
};

const renderCards = (cardFragments, cards, idCategory) => {
  console.log(cards);
  cardFragments.forEach((cardFragment, i) => {
    if (cards[i] !== undefined) {
      const { name, id } = cards[i];
      cardFragment.textContent = name;
      cardFragment.setAttribute("data-type", `${idCategory}-${id}`);
      cardFragment.setAttribute("id", `${idCategory}-${id}`);
    } else cardFragment.remove();
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

  renderCards(playerOrgans, organCards, "organ");
  renderCards(playerAttacks, attackCards, "attack");
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
  renderCards(organs, organCards, "organ");

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
