import { renderGame } from "./render_game.js";
import { performChartMixup } from "./perform_chart_mixup.js";
import { fetchPlayersData, postJSON } from "./utils.js";
import { displayOrgans } from "./afflict-organ.js";

const getCardId = (attackCard) => Number(attackCard.dataset.id);

const playVaccineCard = async ({ e, player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  const { success } = await postJSON("/attack", body);

  if (success) {
    const organsArea = document.querySelector(".organs");
    organsArea.classList.add("vacced");
  }
};

const performBythebook = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  const { success } = await postJSON("/attack", body);
};

const ACTION_HANDLERS = {
  "chart-mixup": performChartMixup,
  affliction: displayOrgans,
  Vaccine: playVaccineCard,
  "transplant": displayOrgans,
  "medicine": displayOrgans,
  "by-the-book": performBythebook,
};

const attachEventListener = (e, player, opponents, isInstant = false) => {
  const attackCardElement = e.target.closest(".attack-card");
  const attackCardID = getCardId(attackCardElement);
  const attackCard = player.attackCards.find(({ id }) => id === attackCardID);
  ACTION_HANDLERS[attackCard.action]({
    player,
    opponents,
    attackCardID,
    isInstant,
    attackCardElement,
  });
};

const findPoisonCard = (cards) => cards.find((card) => card.type === "poison");

const manageTurn = async (data) => {
  // const data = await fetchPlayersData();
  const { self, players, event } = data;
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
    [...attackCards].forEach((card) => {
      card.onclick = (e) => attachEventListener(e, self, opponents);
    });
  } else {
    attackCards.forEach((card) => card.onclick = () => "");
  }

  const instantCards = [...document.querySelectorAll(".attack-card")].filter(
    (card) => Number(card.getAttribute("is-instant")) === 1,
  );
  instantCards.forEach((card) => {
    card.onclick = (e) => attachEventListener(e, self, opponents, true);
  });
};

const poll = async () => {
  const res = await fetch("/poll");
  if (res.status === 200) {
    const gameState = await res.json();
    console.log({ gameState });

    await manageTurn(gameState);
  }
  poll();
};

window.onload = async () => {
  const playerData = await fetchPlayersData();
  await manageTurn(playerData);
  poll();
};
