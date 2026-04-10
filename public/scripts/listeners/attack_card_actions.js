import { cloneFromTemplate, postJSON, setOrganImage } from "../utils.js";

const createOrganNodes = (afflictableOrgans) => {
  const organElement = cloneFromTemplate("#organ-card-template");

  const organNodes = afflictableOrgans.map(({ id, name }) => {
    const organNode = organElement.cloneNode(true);
    organNode.dataset.id = id;
    setOrganImage(organNode, name, id);
    return organNode;
  });
  return organNodes;
};

const renderOrganNodes = (popup, organs, query) => {
  if (organs.length === 0) {
    popup.querySelector(query).remove();
    return;
  }

  const organNodes = createOrganNodes(organs);
  const organsContainer = popup.querySelector(`${query} .target-organs`);
  organsContainer.append(...organNodes);
};

export const affliction = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (
    (!gameState.isMyTurn() && !gameState.isInstant(cardID)) ||
    !gameState.isCardActive(cardID)
  ) return;

  const popup = cloneFromTemplate("#popup-organs-template");

  popup.dataset.action = "affliction";
  popup.dataset.for = cardID;

  const removableOrgans = gameState.getRemovableOrgans(cardID);
  const afflictableOrgans = gameState.getAfflictableOrgans(cardID);

  renderOrganNodes(popup, afflictableOrgans, ".afflicts-organ");
  renderOrganNodes(popup, removableOrgans, ".removes-organ");

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

// poison
export const handlePoison = () => {
  const gameState = window.gameState;

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".afflicts-organ").remove();

  popup.dataset.action = "poison";
  popup.dataset.for = gameState.getPoisonID();

  const removableOrgans = gameState.getPlayerOrgans(gameState.getSelfID());
  renderOrganNodes(popup, removableOrgans, ".removes-organ");
  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

// immunity boost
export const immunityBoost = (card) => {
  const gameState = window.gameState;
  const cardID = parseInt(card.dataset.id);

  const body = {
    attackerID: gameState.getSelfID(),
    attackCardID: cardID,
    isInstant: gameState.isInstant(cardID),
  };

  postJSON("/action", body);
};

// contagious

export const contagious = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (!gameState.canPlayContagious()) return;

  const opponentID = gameState.getOpponentID();

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".removes-organ").remove();

  popup.dataset.action = "contagious";
  popup.dataset.for = cardID;

  const afflictableOrgans = gameState.getPlayerOrgans(opponentID);

  renderOrganNodes(popup, afflictableOrgans, ".afflicts-organ");

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

export const metastasis = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (!gameState.canPlayMetastasis()) return;

  const opponentID = gameState.getAttackedPlayerID();
  const currentDamagedOrgan = gameState.getCurrentDamagedOrgan();

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".removes-organ").remove();

  popup.dataset.action = "metastasis";
  popup.dataset.for = cardID;

  const afflictableOrgans = gameState
    .getUnharmedOrgan(opponentID, currentDamagedOrgan);

  renderOrganNodes(popup, afflictableOrgans, ".afflicts-organ");

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};
