import { sendAction } from "../utils.js";
import { highlightOrgan, removeHighlightOrgan } from "./highlight.js";

export const setupEventListeners = () => {
  const popup = document.querySelector(".popup");
  popup.addEventListener("click", popupListener);
  popup.addEventListener("mouseover", highlightOrgan);
  popup.addEventListener("mouseout", removeHighlightOrgan);
};

const popupListenerForOpponents = (state, event, popupArea) => {
  const opponent = event.target.closest(".player");
  const opponentID = parseInt(opponent?.dataset.id);
  const attackCardID = parseInt(popupArea.dataset?.for);

  const body = {
    attackCardID,
    attackerID: state.getSelfID(),
    opponentID: opponentID,
    isInstant: state.isInstant(attackCardID),
  };

  sendAction(body);
  popupArea.remove();
};

const popupListener = (event) => {
  const state = window.gameState;
  const popupArea = event.target.closest(".players-popup");
  if (popupArea) {
    popupListenerForOpponents(state, event, popupArea);
    return;
  }

  const organ = event.target.closest(".organ");
  const popup = event.target.closest(".organs-popup");
  const organCardID = parseInt(organ?.dataset.id);
  const attackCardID = parseInt(popup.dataset?.for);

  const body = {
    attackCardID,
    organCardID,
    attackerID: state.getSelfID(),
    opponentID: state.getPlayerWithOrgan(organCardID),
    isInstant: state.isInstant(attackCardID),
  };

  sendAction(body);
  event.target.closest(".organs-popup").remove();
};
