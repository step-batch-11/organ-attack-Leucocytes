import { renderGame } from "./render_game.js";
import * as NA from "./action_handlers/non_afflictions.js";
import { displayOpponents, displayOrgans } from "./afflict-organ.js";
import { displayAttackDeckDiscardPile } from "./discard_pile.js";
import { setupEventListeners } from "./listeners/setup_event_listeners.js";
import GameState from "./game_state.js";
import {
  affliction,
  chartMixupOrByTheBook,
  commonColdOrSedate,
  contagious,
  handlePoison,
  immunityBoost,
  itsAlive,
  medicine,
  metastasis,
  narcolepsy,
  situsInversusOrCryo,
  transplant,
  vaccine,
} from "./listeners/attack_card_actions.js";
import { animateFromDeck } from "./animation.js";
import { connectRealtime, onMessage, sendRequest } from "./network.js";

import { setLastPlayedCard } from "./utils.js";
const getCardID = (attackCard) => Number(attackCard.dataset.id);

// Single dispatch table for every attack-card action — previously split
// across this file (3 keys) and listeners/setup_event_listeners.js's own
// delegated click listener (the other ~12 keys), which fired unconditionally
// on every click and threw for the 3 keys it didn't recognize.
const ACTION_HANDLERS = {
  "medical-miracle": displayOrgans,
  "clinical-audit": NA.displayOpponentsHands,
  "research": displayAttackDeckDiscardPile,
  "affliction": ({ attackCardElement }) => affliction(attackCardElement),
  "medicine": ({ attackCardElement }) => medicine(attackCardElement),
  "transplant": ({ attackCardElement }) => transplant(attackCardElement),
  "contagious": ({ attackCardElement }) => contagious(attackCardElement),
  "metastasis": ({ attackCardElement }) => metastasis(attackCardElement),
  "immunity-boost": ({ attackCardElement }) => immunityBoost(attackCardElement),
  "itsAlive": ({ attackCardElement }) => itsAlive(attackCardElement),
  "Vaccine": ({ attackCardElement }) => vaccine(attackCardElement),
  "common-cold": ({ attackCardElement }) => commonColdOrSedate(attackCardElement),
  "sedate": ({ attackCardElement }) => commonColdOrSedate(attackCardElement),
  "chart-mixup": ({ attackCardElement }) =>
    chartMixupOrByTheBook(attackCardElement),
  "by-the-book": ({ attackCardElement }) =>
    chartMixupOrByTheBook(attackCardElement),
  "situs-inversus": ({ attackCardElement }) =>
    situsInversusOrCryo(attackCardElement),
  "cryopreservation": ({ attackCardElement }) =>
    situsInversusOrCryo(attackCardElement),
  "narcolepsy": ({ attackCardElement }) => narcolepsy(attackCardElement),
};

const attachEventListener = async (
  event,
  player,
  opponents,
  isInstant = false,
  organDiscardPile,
) => {
  const gameState = window.gameState;
  const attackCardElement = event.target.closest(".attack-card");
  //  prevent double click
  attackCardElement.style.pointerEvents = "none";
  const rect = attackCardElement.getBoundingClientRect();
  console.log({ rect }, "in the listener");
  const attackCardID = getCardID(attackCardElement);
  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);
  console.log("in cards", { attackCard });
  setLastPlayedCard(attackCardElement, rect, attackCard);
  if (!(attackCard.action in ACTION_HANDLERS) || gameState.amISleeping()) {
    return;
  }
  await ACTION_HANDLERS[attackCard.action]({
    player,
    opponents,
    attackCardID,
    isInstant,
    attackCardElement,
    organDiscardPile,
  });
};

const holdsPoison = (cards) => cards.some((card) => card.type === "poison");

let prevCardIDs = [];

const manageTurn = async (gameState) => {
  const { self, players, organDiscardPile } = gameState;
  const opponents = players.filter(({ id }) => id !== self.id);

  await renderGame(self.isAlive);

  const attackCards = document.querySelectorAll(".player-area .attack-card");

  const currentCardIDs = Array.from(attackCards).map((card) =>
    Number(card.dataset.id)
  );
  const newCards = currentCardIDs.filter((id) => !prevCardIDs.includes(id));

  // 🎴 animate from deck
  newCards.forEach((id, index) => {
    const cardElement = document
      .querySelector(
        `.attack-card[data-id="${id}"]`,
      );
    setTimeout(() => {
      if (cardElement) animateFromDeck(cardElement);
    }, index * 200);
  });
  prevCardIDs = currentCardIDs;

  if (
    self.isMyTurn && !self.isSleeping && !players[0].anyBodyHasPoison
  ) {
    attackCards.forEach((card) => {
      card.onclick = (event) => {
        if (event.target.closest(".info-btn")) return;
        attachEventListener(event, self, opponents, false, organDiscardPile);
      };
    });
  } else {
    attackCards.forEach((card) => card.onclick = () => "");
  }

  const disabledCards = document.querySelectorAll(
    ".player-area .disabled-card",
  );

  disabledCards.forEach((card) => {
    card.onclick = async (event) => {
      const attackCardElement = event.target.closest(".attack-card");
      const attackCardID = getCardID(attackCardElement);
      await sendRequest("remove-card", { attackCardID, playerID: self.id });
    };
  });

  const instantCards = [...document.querySelectorAll(".attack-card")]
    .filter((card) => Number(card.getAttribute("is-instant")) === 1);

  if (self.isSleeping) {
    instantCards.forEach((card) => card.onclick = () => {});
    return;
  }

  instantCards.forEach((card) => {
    card.onclick = (event) => attachEventListener(event, self, opponents, true);
  });
};

const handleGameStateMessage = async (payload) => {
  if (window.gameState === undefined) {
    window.gameState = new GameState(payload);
    setupEventListeners();
  } else {
    window.gameState.update(payload);
  }

  if (holdsPoison(payload.self.attackCards)) handlePoison();
  await manageTurn(payload);
};

onMessage("game-state", handleGameStateMessage);

window.onload = () => {
  connectRealtime();
};
