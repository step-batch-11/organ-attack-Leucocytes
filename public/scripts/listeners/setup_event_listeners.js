import { postJSON } from "../utils.js";
import { affliction, immunityBoost } from "./attack_card_actions.js";
import { higlightOrgan, removeHiglightOrgan } from "./highlight.js";

export const setupEventListeners = () => {
  const attackCardArea = document.querySelector(".attack-cards");
  attackCardArea.addEventListener("click", attackCardsListener);

  const popup = document.querySelector(".popup");
  popup.addEventListener("click", popupListener);
  popup.addEventListener("mouseover", higlightOrgan);
  popup.addEventListener("mouseout", removeHiglightOrgan);
};

const attackCardsListener = (event) => {
  const attackCard = event.target.closest(".attack-card");
  const cardAction = attackCard.dataset.action;
  const cardType = attackCard.dataset.type;

  if (cardAction === "affliction" && cardType === "affliction") {
    affliction(attackCard);
  }
  if (cardAction === "immunity-boost") immunityBoost(attackCard);
};

const popupListener = (event) => {
  const state = window.gameState;
  const organ = event.target.closest(".organ");
  const popup = event.target.closest(".organs-popup");
  const organCardID = parseInt(organ.dataset.id);
  const attackCardID = parseInt(popup.dataset.for);

  const body = {
    attackCardID,
    organCardID,
    attackerID: state.getSelfID(),
    opponentID: state.getPlayerWithOrgan(organCardID),
    isInstant: state.isInstant(attackCardID),
  };

  postJSON("/action", body);
  event.target.closest(".organs-popup").remove();
};
