const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/players-data")
    .then((res) => res.json())
    .catch((err) => {
      console.err(err);
      return mockData;
    });
};

const renderCards = (cardFragments, cards, idCategory) => {
  cardFragments.forEach((cardFragment, i) => {
    const { name, id } = cards[i];
    cardFragment.textContent = name;
    cardFragment.setAttribute("data-type", `${idCategory}-${id}`);
    cardFragment.setAttribute("id", `${idCategory}-${id}`);
  });
};

const renderMyCards = ({ name, attackCards, organCards }) => {
  const playerOrgans = document.querySelectorAll(".player-area .organ");
  const playerAttacks = document.querySelectorAll(".player-area .attack-card");
  const playerName = document.querySelector(".player-area .name");
  playerName.textContent = name;

  renderCards(playerOrgans, organCards, "organ");
  renderCards(playerAttacks, attackCards, "attack");
};

const createOpponentFragment = (
  template,
  { name, organCards, id, hasWild },
) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);
  const nameElement = element.querySelector(".name");
  nameElement.textContent = name;

  const organs = element.querySelectorAll(".organ");
  renderCards(organs, organCards, "organ");

  if (hasWild) {
    const avatar = clone.querySelector(".avatar");
    avatar.classList.add("highlight-avatar");
  }
  return element;
};

const renderOpponents = (opponents) => {
  const template = document.querySelector(".opponent-template");
  const opponentArea = document.querySelector(".opponent-area");

  const fragments = opponents.map((opponent) =>
    createOpponentFragment(template, opponent)
  );
  opponentArea.append(...fragments);
};

export const setupGame = async () => {
  const { player, opponents } = await fetchPlayersData();
  renderOpponents(opponents);
  renderMyCards(player);
};
