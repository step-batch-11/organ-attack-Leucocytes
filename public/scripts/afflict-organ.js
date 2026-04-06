import { getAfflictableOrgans, getRemovableOrgans, postJSON } from "./utils.js";

const createPopup = (collection) => {
  return collection.map((item) => {
    const icon = document.createElement("div");
    icon.setAttribute("class", "organ");
    icon.setAttribute("organ-id", `${item.id}`);
    icon.setAttribute("player-id", `${item.playerID}`);
    const organName = item.name;
    const image = document.createElement("img");
    image.setAttribute("src", `/assets/organs/${organName.toLowerCase()}.png`);
    icon.append(image);
    return icon;
  });
};

export const clearPopup = () => {
  const popup = document.querySelectorAll(".popup > div");
  popup.forEach((container) => container.remove());
};

const performAttack = async (
  _e,
  attackCardID,
  player,
  isInstant,
  canRemove,
  organ,
) => {
  console.log({ organ });

  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));
  console.log(organCardID, opponentID, "HERE");

  const body = {
    attackCardID,
    attackerID: player.id,
    organCardID,
    opponentID,
    isInstant,
    canRemove,
  };

  clearPopup();

  await postJSON("/attack", body);
};

const getOrgansToDisplay = (cards, attackCard, opponents) => {
  return cards[attackCard.action] ||
    getAfflictableOrgans(opponents, attackCard);
};

const createPopupFragment = (
  opponents,
  attackCard,
  attackCardID,
  player,
  isInstant,
  canRemove,
) => {
  const container = document.createElement("div");

  if (canRemove) container.setAttribute("class", "popup-removable");
  else container.setAttribute("class", "popup-afflictable");

  const organsGetter = canRemove ? getRemovableOrgans : getAfflictableOrgans;
  const organCards = organsGetter(opponents, attackCard);

  const organs = createPopup(organCards);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    const organ = e.target.closest(".organ");
    performAttack(e, attackCardID, player, isInstant, canRemove, organ);
  });
  document.querySelector(".popup").append(container);
};

export const displayOrgans = (
  { player, opponents, attackCardID, isInstant, organDiscardPile },
) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardID);
  clearPopup();

  const cards = {
    "medicine": player.organCards.filter(({ health, maxHealth }) =>
      health !== maxHealth
    ),
    "poison": player.organCards,
    "itsAlive": organDiscardPile,
  };
  console.log(attackCard);

  const organCards = getOrgansToDisplay(cards, attackCard, opponents);
  console.log(organCards, attackCard.action);
  if (attackCard.action in cards) {
    const container = document.createElement("div");
    container.setAttribute("class", "popup-afflictable");

    const organCards = cards[attackCard.action];

    const organs = createPopup(organCards);
    container.append(...organs);
    container.addEventListener("click", async (e) => {
      const organ = e.target.closest(".organ");
      performAttack(e, attackCardID, player, isInstant, false, organ);
    });
    document.querySelector(".popup").append(container);
  } else {
    createPopupFragment(
      opponents,
      attackCard,
      attackCardID,
      player,
      isInstant,
      false,
    );
    createPopupFragment(
      opponents,
      attackCard,
      attackCardID,
      player,
      isInstant,
      true,
    );
  }
};

export const displayOpponents = ({ player, opponents, attackCardID }) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardID);

  clearPopup();

  const cards = {
    "sedate": opponents,
  };
  console.log(attackCard);

  if (attackCard.action in cards) {
    const container = document.createElement("div");
    container.setAttribute("class", "popup-afflictable");

    const opponentsAvatar = cards[attackCard.action];

    const organs = createPopup(opponentsAvatar);
    container.append(...organs);
    container.addEventListener("click", async (e) => {
      const organ = e.target.closest(".organ");
      performAttack(e, organ, attackCardID, player, false, false);
    });

    document.querySelector(".popup").append(container);
  } else {
    createPopupFragment(
      opponents,
      attackCard,
      attackCardID,
      player,
      false,
      false,
    );
  }
};
