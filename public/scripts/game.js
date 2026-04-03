import { renderGame } from "./render_game.js";
import { performChartMixup } from "./perform_chart_mixup.js";
import { getAfflictableOrgans } from "./utils.js";

const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/game-state")
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return mockData;
    });
};

const getCardId = (attackCard) => Number(attackCard.dataset.id);

const createPopupOrgans = (afflictableOrgans) => {
  return afflictableOrgans.map((afflictableOrgan) => {
    const organ = document.createElement("div");
    organ.setAttribute("class", "organ");
    organ.setAttribute("organ-id", `${afflictableOrgan.id}`);
    organ.setAttribute("player-id", `${afflictableOrgan.playerId}`);
    const organName = afflictableOrgan.name;
    const image = document.createElement("img");
    image.setAttribute("src", `/assets/organs/${organName.toLowerCase()}.png`);
    organ.append(image);
    return organ;
  });
};

const removePopup = () => {
  const popup = document.querySelector(".popup > div");
  if (popup !== null) popup.remove();
};

const afflictOrgan = async (
  e,
  attackCardID,
  player,
  isInstant,
) => {
  const organ = e.target.closest(".organ");
  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));

  const body = {
    attackCardID,
    attackerID: player.id,
    organCardID,
    opponentID,
    isInstant,
  };
  removePopup();

  await postJSON("/attack", body)
    .then(async ({ success }) => {
      if (success) {
        // const { opponents } = await fetchPlayersData();
        // renderOpponents(opponents);
      }
    });
};

const displayOrgans = (
  { player, opponents, attackCardID, isInstant },
) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardID);
  removePopup();

  const container = document.createElement("div");
  container.setAttribute("class", "popup-afflicatble-organs");
  const organCards = attackCard.action === "medicine"
    ? player.organCards.filter(({ health, maxHealth }) => health !== maxHealth)
    : getAfflictableOrgans(opponents, attackCard);

  const organs = createPopupOrgans(organCards);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    afflictOrgan(e, attackCardID, player, isInstant);
  });
  document.querySelector(".popup").append(container);
};

const postJSON = (url, body) => {
  return fetch(url, { method: "POST", body: JSON.stringify(body) })
    .then((r) => r.json());
};

const playVaccineCard = async ({ e, player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  const { success } = await postJSON("/attack", body);

  if (success) {
    const organsArea = document.querySelector(".organs");
    organsArea.classList.add("vacced");
  }
};

const ACTION_HANDLERS = {
  "chart-mixup": performChartMixup,
  affliction: displayOrgans,
  Vaccine: playVaccineCard,
  "transplant": displayOrgans,
  "medicine": displayOrgans,
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

const manageTurn = async (data) => {
  // const data = await fetchPlayersData();
  const { self, players, event } = data;
  const opponents = players.filter(({ id }) => id !== self.id);
  await renderGame({ self, players, event });
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
