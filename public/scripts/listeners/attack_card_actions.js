import { cloneFromTemplate, postJSON, setOrganImage } from "../utils.js";

export const affliction = (card) => {
  const gameState = window.gameState;
  if (!gameState.isMyTurn()) return;

  const popup = cloneFromTemplate("#popup-organs-template");
  popup.querySelector(".removes-organ").remove();
  const cardID = parseInt(card.dataset.id);

  popup.dataset.action = "affliction";
  popup.dataset.for = cardID;

  const afflictableOrgans = gameState.getAfflictableOrgans(cardID);
  const organNodes = createOrganNodes(afflictableOrgans);

  const afflictableOrgansContainer = popup.querySelector(
    ".afflicts-organ .target-organs",
  );
  afflictableOrgansContainer.append(...organNodes);

  const popupContainer = document.querySelector(".popup");

  popupContainer.replaceChildren(popup);
};

const createOrganNodes = (afflictableOrgans) => {
  const organElement = cloneFromTemplate("#organ-card-template");

  const organNodes = afflictableOrgans.map(({ id, name }) => {
    const organNode = organElement.cloneNode(true);
    organNode.dataset.id = id;
    setOrganImage(organNode, name);
    return organNode;
  });
  return organNodes;
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
