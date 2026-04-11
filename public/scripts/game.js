import { renderGame } from "./render_game.js";
import * as NA from "./action_handlers/non_afflictions.js";
import { fetchPlayersData } from "./utils.js";
import { displayOpponents, displayOrgans } from "./afflict-organ.js";
import { displayAttackDeckDiscardPile } from "./discard_pile.js";
import { setupEventListeners } from "./listeners/setup_event_listeners.js";
import GameState from "./game_state.js";
import { handlePoison } from "./listeners/attack_card_actions.js";
import { animateFromDeck } from "./animation.js";

import { setLastPlayedCard } from "./utils.js";
const getCardID = (attackCard) => Number(attackCard.dataset.id);

const ACTION_HANDLERS = {
  "medicine": displayOrgans,
  "medical-miracle": displayOrgans,
  "sedate": displayOpponents,
  "clinical-audit": NA.displayOpponentsHands,
  "research": displayAttackDeckDiscardPile,
};

const attachEventListener = async (
  event,
  player,
  opponents,
  isInstant = false,
  organDiscardPile,
) => {
  const attackCardElement = event.target.closest(".attack-card");
  //  prevent double click
  attackCardElement.style.pointerEvents = "none";
  const rect = attackCardElement.getBoundingClientRect();
  console.log({ rect }, "in the listener");
  const attackCardID = getCardID(attackCardElement);
  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);
  console.log("in cards", { attackCard });
  setLastPlayedCard(attackCardElement, rect, attackCard);

  if (!(attackCard.action in ACTION_HANDLERS)) return;
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
    const cardElement = document.querySelector(
      `.attack-card[data-id="${id}"]`,
    );
    setTimeout(() => {
      if (cardElement) animateFromDeck(cardElement);
    }, index * 200);
  });
  prevCardIDs = currentCardIDs;

  if (self.isMyTurn && !self.isSleeping) {
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
      await fetch("/remove-card", {
        method: "post",
        body: JSON.stringify({ attackCardID, playerID: self.id }),
      });

      const players = await fetchPlayersData();
      if (players.status === false) {
        window.location.href = "/";
        return;
      }

      window.gameState = new GameState(players);
      setupEventListeners();

      await manageTurn(players);
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

const poll = async () => {
  const res = await fetch("/poll");
  if (res.status === 200) {
    const gameState = await res.json();
    window.gameState.update(gameState);
    if (holdsPoison(gameState.self.attackCards)) handlePoison();
    await manageTurn(gameState);
  }
  poll();
};

window.onload = async () => {
  const players = await fetchPlayersData();
  if (players.status === false) {
    window.location.href = "/";
    return;
  }

  window.gameState = new GameState(players);

  if (holdsPoison(players.self.attackCards)) handlePoison();

  setupEventListeners();

  await manageTurn(players);
  poll();
};
