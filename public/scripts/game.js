import { renderGame } from "./render_game.js";
import * as NA from "./action_handlers/non_afflictions.js";
import { fetchPlayersData } from "./utils.js";
import { displayOpponents, displayOrgans } from "./afflict-organ.js";
import { displayAttackDeckDiscardPile } from "./discard_pile.js";

const getCardID = (attackCard) => Number(attackCard.dataset.id);

const ACTION_HANDLERS = {
  "chart-mixup": NA.performChartMixup,
  "by-the-book": NA.performByTheBook,
  "Vaccine": NA.performVaccine,
  "affliction": displayOrgans,
  "remove": displayOrgans,
  "transplant": displayOrgans,
  "medicine": displayOrgans,
  "medical-miracle": displayOrgans,
  "hybrid": displayOrgans,
  "itsAlive": displayOrgans,
  "sedate": displayOpponents,
  "narcolepsy": displayOpponents,
  "common-cold": displayOpponents,
  "clinical-audit": NA.displayOpponentsHands,
  "cryopreservation": NA.performCryopreservation,
  "research": displayAttackDeckDiscardPile,
  "situs-inversus": NA.performSitusInversus,
};

const attachEventListener = async (
  event,
  player,
  opponents,
  isInstant = false,
  organDiscardPile,
) => {
  const attackCardElement = event.target.closest(".attack-card");
  const attackCardID = getCardID(attackCardElement);
  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);
  await ACTION_HANDLERS[attackCard.action]({
    player,
    opponents,
    attackCardID,
    isInstant,
    attackCardElement,
    organDiscardPile,
  });
};

const findPoisonCard = (cards) => cards.find((card) => card.type === "poison");

const manageTurn = async (gameState) => {
  const { self, players, event, organDiscardPile } = gameState;
  const opponents = players.filter(({ id }) => id !== self.id);
  await renderGame({ self, players, event });

  const poisonCard = findPoisonCard(self.attackCards);

  if (poisonCard !== undefined) {
    displayOrgans({
      player: self,
      opponents,
      attackCardID: poisonCard.id,
      isInstant: true,
    });
    return;
  }
  const attackCards = document.querySelectorAll(".player-area .attack-card");

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

  await manageTurn(players);
  poll();
};
