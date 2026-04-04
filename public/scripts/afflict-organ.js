import { renderOpponents } from "./render_game.js";
import {
  fetchPlayersData,
  getAfflictableOrgans,
  getRemovableOrgans,
  postJSON,
} from "./utils.js";

const createPopupOrgans = (organs) => {
  return organs.map((organ) => {
    const organCard = document.createElement("div");
    organCard.setAttribute("class", "organ");
    organCard.setAttribute("organ-id", `${organ.id}`);
    organCard.setAttribute("player-id", `${organ.playerId}`);
    const organName = organ.name;
    const image = document.createElement("img");
    image.setAttribute("src", `/assets/organs/${organName.toLowerCase()}.png`);
    organCard.append(image);
    return organCard;
  });
};

export const clearPopup = () => {
  const popup = document.querySelectorAll(".popup > div");
  popup.forEach((container) => container.remove());
};

const afflictOrgan = async (
  e,
  attackCardID,
  player,
  isInstant,
  canRemove,
) => {
  const organ = e.target.closest(".organ");
  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));

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

  if (canRemove) container.setAttribute("class", "popup-removable-organs");
  else container.setAttribute("class", "popup-afflictable-organs");

  const organsGetter = canRemove ? getRemovableOrgans : getAfflictableOrgans;
  const organCards = organsGetter(opponents, attackCard);

  const organs = createPopupOrgans(organCards);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    afflictOrgan(e, attackCardID, player, isInstant, canRemove);
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
  // console.log(organCards, attackCard.action);
  if (attackCard.action in cards) {
    const container = document.createElement("div");
    container.setAttribute("class", "popup-afflictable-organs");

    const organCards = cards[attackCard.action];

    const organs = createPopupOrgans(organCards);
    container.append(...organs);
    container.addEventListener("click", async (e) => {
      afflictOrgan(e, attackCardID, player, isInstant, false);
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
