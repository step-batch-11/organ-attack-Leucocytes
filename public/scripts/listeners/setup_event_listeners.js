import { sendAction } from "../utils.js";
import { highlightOrgan, removeHighlightOrgan } from "./highlight.js";

export const setupEventListeners = () => {
  const popup = document.querySelector(".popup");
  popup.addEventListener("click", popupListener);
  popup.addEventListener("mouseover", highlightOrgan);
  popup.addEventListener("mouseout", removeHighlightOrgan);
};

export const popupListenerForOpponents = (state, event, popupArea) => {
  const opponent = event.target.closest(".player");

  if (!opponent) {
    // Click landed inside the popup but missed an actual player icon —
    // treat it as a dismiss, not as a malformed action with a NaN/undefined
    // target.
    popupArea.remove();
    return;
  }

  const opponentID = parseInt(opponent.dataset.id);
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

export const popupListener = (event) => {
  const state = window.gameState;
  const popupArea = event.target.closest(".players-popup");
  if (popupArea) {
    popupListenerForOpponents(state, event, popupArea);
    return;
  }

  const popup = event.target.closest(".organs-popup");
  if (!popup) {
    // Not a click inside an organs/players popup at all — e.g. it bubbled
    // up from a self-contained popup (Medical Miracle's heal-organ picker)
    // that already handled the click with its own listener. Nothing to do.
    return;
  }

  const organ = event.target.closest(".organ");
  if (!organ) {
    // Click landed inside the popup but missed an organ icon — dismiss
    // instead of sending a malformed action with a NaN organCardID.
    popup.remove();
    return;
  }

  const organCardID = parseInt(organ.dataset.id);
  const attackCardID = parseInt(popup.dataset?.for);

  const body = {
    attackCardID,
    organCardID,
    attackerID: state.getSelfID(),
    opponentID: state.getPlayerWithOrgan(organCardID),
    isInstant: state.isInstant(attackCardID),
  };

  sendAction(body);
  popup.remove();
};
