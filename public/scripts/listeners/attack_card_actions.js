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

const createOpponentNodes = (opponents) => {
  const opponentElement = cloneFromTemplate("#player-template");

  const opponentNodes = opponents.map(({ id, name }) => {
    const opponentNode = opponentElement.cloneNode(true);
    opponentNode.dataset.id = id;
    console.log(opponentNode);
    opponentNode.querySelector(".name").textContent = name;
    return opponentNode;
  });
  return opponentNodes;
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

const renderOpponentNodes = (popup, opponents) => {
  if (opponents.length === 0) {
    popup.querySelector(".players").remove();
    return;
  }

  const opponentNodes = createOpponentNodes(opponents);
  const opponentsContainer = popup.querySelector(`.players`);
  opponentsContainer.append(...opponentNodes);
};

export const affliction = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;
  console.log("isMyTurn", gameState.isMyTurn());
  console.log("isInstant", gameState.isInstant(cardID), cardID);
  console.log("isCard", gameState.isCardActive(cardID));

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

export const transplant = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (
    (!gameState.isMyTurn() && !gameState.isInstant(cardID)) ||
    !gameState.isCardActive(cardID)
  ) return;

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".afflicts-organ").remove();

  popup.dataset.action = "transplant";
  popup.dataset.for = cardID;

  const removableOrgans = gameState.getAllOpponentOrgans();

  renderOrganNodes(popup, removableOrgans, ".removes-organ");

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

export const commonColdOrSedate = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (!gameState.isMyTurn() || !gameState.isCardActive(cardID)) return;

  const popup = cloneFromTemplate("#popup-players-template");

  popup.dataset.action = "common-cold";
  popup.dataset.for = cardID;

  const opponents = gameState.getOpponents();

  renderOpponentNodes(popup, opponents);

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

export const narcolepsy = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (
    (!gameState.isMyTurn() && !gameState.isInstant(cardID)) ||
    !gameState.isCardActive(cardID)
  ) return;

  const popup = cloneFromTemplate("#popup-players-template");

  popup.dataset.action = "narcolepsy";
  popup.dataset.for = cardID;

  const opponents = gameState.getOpponents();

  renderOpponentNodes(popup, opponents);

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

export const itsAlive = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (
    (!gameState.isMyTurn() && !gameState.isInstant(cardID)) ||
    !gameState.isCardActive(cardID)
  ) return;

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".afflicts-organ").remove();

  popup.dataset.action = "itsAlive";
  popup.dataset.for = cardID;

  const discardedOrgans = gameState.getDiscardedOrgans();

  renderOrganNodes(popup, discardedOrgans, ".removes-organ");
  popup.querySelector(".removes-organ p").textContent = "Bring back";

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

export const medicine = (card) => {
  const cardID = parseInt(card.dataset.id);
  const gameState = window.gameState;

  if (!gameState.isMyTurn() || !gameState.isCardActive(cardID)) return;

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".afflicts-organ").remove();

  popup.dataset.action = "itsAlive";
  popup.dataset.for = cardID;

  const afflictedOrgans = gameState.getAfflictedOrgans();

  renderOrganNodes(popup, afflictedOrgans, ".removes-organ");
  popup.querySelector(".removes-organ p").textContent = "Heal";

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

  if (!gameState.canPlayImmunityBoost()) return;
  const cardID = parseInt(card.dataset.id);

  const body = {
    attackerID: gameState.getSelfID(),
    attackCardID: cardID,
    isInstant: gameState.isInstant(cardID),
  };

  postJSON("/action", body);
};

// chart-mixup
export const chartMixupOrByTheBook = (card) => {
  const gameState = window.gameState;
  const cardID = parseInt(card.dataset.id);

  if (!gameState.isMyTurn() || !gameState.isCardActive(cardID)) return;

  const body = {
    attackerID: gameState.getSelfID(),
    attackCardID: cardID,
  };

  postJSON("/action", body);
};

// situsInversus
export const situsInversusOrCryo = (card) => {
  const gameState = window.gameState;
  const cardID = parseInt(card.dataset.id);

  if (
    (!gameState.isMyTurn() && !gameState.isInstant(cardID)) ||
    !gameState.isCardActive(cardID)
  ) return;

  const body = {
    attackerID: gameState.getSelfID(),
    attackCardID: cardID,
  };

  postJSON("/action", body);
};

// vaccine
export const vaccine = async (card) => {
  console.log("are mai yaha hu");
  const cardID = parseInt(card.dataset.id);
  console.log(cardID, card);

  const gameState = window.gameState;
  if (!gameState.isMyTurn() || !gameState.isCardActive(cardID)) return;

  const body = {
    attackerID: gameState.getSelfID(),
    attackCardID: cardID,
  };

  const { success } = await postJSON("/action", body);

  if (success) {
    const organsArea = document.querySelector(".organs");
    organsArea.dataset.vaccine = 2;
  }
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
