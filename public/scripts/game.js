import { renderGame } from "./render_game.js";
import * as NA from "./action_handlers/non_afflictions.js";
import { fetchPlayersData } from "./utils.js";
import { displayOpponents, displayOrgans } from "./afflict-organ.js";

const getCardID = (attackCard) => Number(attackCard.dataset.id);

const ACTION_HANDLERS = {
  "chart-mixup": NA.performChartMixup,
  "by-the-book": NA.performByTheBook,
  "Vaccine": NA.performVaccine,
  "affliction": displayOrgans,
  "remove": displayOrgans,
  "transplant": displayOrgans,
  "medicine": displayOrgans,
  "hybrid": displayOrgans,
  "itsAlive": displayOrgans,
  "sedate": displayOpponents,
};

const attachEventListener = (
  e,
  player,
  opponents,
  isInstant = false,
  organDiscardPile,
) => {
  const attackCardElement = e.target.closest(".attack-card");
  const attackCardID = getCardID(attackCardElement);

  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);
  ACTION_HANDLERS[attackCard.action]({
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

  if (self.isMyTurn) {
    attackCards.forEach((card) => {
      card.onclick = (e) => {
        if (e.target.closest(".info-btn") || e.target.closest(".flip-btn")) {
          return;
        }

        attachEventListener(e, self, opponents, false, organDiscardPile);
      };
    });
  } else {
    attackCards.forEach((card) => card.onclick = () => "");
  }

  const instantCards = [...document.querySelectorAll(".attack-card")]
    .filter((card) => Number(card.getAttribute("is-instant")) === 1);

  instantCards.forEach((card) => {
    card.onclick = (e) => attachEventListener(e, self, opponents, true);
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
  //redirect because there is no room so for safeguarding
  // it to redirect to the main page for login;
  poll();
};
