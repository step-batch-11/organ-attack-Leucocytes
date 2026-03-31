const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/players-data")
    .then((res) => res.json())
    .catch(() => mockData);
};

const renderCards = (cardFragments, cards, idCategory) => {
  cardFragments.forEach((cardFragment, i) => {
    const { name, id } = cards[i];
    cardFragment.textContent = name;
    cardFragment.setAttribute("data-type", `${idCategory}-${id}`);
    cardFragment.setAttribute("id", `${idCategory}-${id}`);
  });
};

const renderMyCards = ({ attackCards, organCards }) => {
  const playerOrgans = document.querySelectorAll(".player-area .organ");
  const playerAttacks = document.querySelectorAll(".player-area .attack-card");

  renderCards(playerOrgans, organCards, "organ");
  renderCards(playerAttacks, attackCards, "attack");
};

const createOpponentFragment = (template, { organCards, id, hasWild }) => {
  const clone = template.content.cloneNode(true);
  const element = clone.querySelector(".opponent");
  element.setAttribute("id", `player-${id}`);

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

  const fragments = opponents.map((organs) =>
    createOpponentFragment(template, organs)
  );
  opponentArea.append(...fragments);
};

export const setupGame = async () => {
  const { player, opponents } = await fetchPlayersData();
  renderOpponents(opponents);
  renderMyCards(player);
};
