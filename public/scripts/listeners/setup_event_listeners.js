import { postJSON } from "../utils.js";
import { highlightOrgan, removeHighlightOrgan } from "./highlight.js";
import {
  affliction,
  chartMixupOrByTheBook,
  commonCold,
  contagious,
  immunityBoost,
  itsAlive,
  metastasis,
  transplant,
  vaccine,
} from "./attack_card_actions.js";

export const setupEventListeners = () => {
  const attackCardArea = document.querySelector(".attack-cards");
  attackCardArea.addEventListener("click", attackCardsListener);

  const popup = document.querySelector(".popup");
  popup.addEventListener("click", popupListener);
  popup.addEventListener("mouseover", highlightOrgan);
  popup.addEventListener("mouseout", removeHighlightOrgan);
};

const attackCardsListener = (event) => {
  const attackCard = event.target.closest(".attack-card");
  const cardAction = attackCard.dataset.action;
  const cardType = attackCard.dataset.type;

  if (cardAction === "affliction") affliction(attackCard);
  if (cardAction === "transplant") transplant(attackCard);
  if (cardAction === "contagious") contagious(attackCard);
  if (cardAction === "metastasis") metastasis(attackCard);
  if (cardAction === "immunity-boost") immunityBoost(attackCard);
  if (cardAction === "itsAlive") itsAlive(attackCard);
  if (cardAction === "Vaccine") vaccine(attackCard);
  if (cardAction === "common-cold") commonCold(attackCard);
  if (cardAction === "chart-mixup") chartMixupOrByTheBook(attackCard);
  if (cardAction === "by-the-book") chartMixupOrByTheBook(attackCard);
  // if (cardAction === "medical-miracle") medicalMiracle(attackCard);
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

  postJSON("/action", body);
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

  postJSON("/action", body);
  event.target.closest(".organs-popup").remove();
};
