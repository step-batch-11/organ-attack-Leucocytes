import { renderGame, renderOpponents } from "./render_game.js";
import { performChartMixup } from "./perform_chart_mixup.js";
import { getAfflictableOrgans } from "./utils.js";

const fetchPlayersData = () => {
  const mockData = { player: [], opponents: [], playerId: null };

  return fetch("/players-data")
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

const displayAfflictableOrgans = (
  { player, opponents, attackCardID, isInstant, attackCardElement: card },
) => {
  console.log({ isInstant });
  removePopup();
  const container = document.createElement("div");
  container.setAttribute("class", "popup-afflicatble-organs");
  const afflictableOrgans = getAfflictableOrgans(
    player,
    opponents,
    attackCardID,
  );
  const organs = createPopupOrgans(afflictableOrgans);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    afflictOrgan(e, attackCardID, player, isInstant, card);
  });
  document.querySelector(".popup").append(container);
};

const afflictOrgan = async (
  e,
  attackCardID,
  player,
  isInstant,
  card,
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

  await postJSON("/attack", body)
    .then(async ({ success }) => {
      if (success) {
        const { opponents } = await fetchPlayersData();
        renderOpponents(opponents);
      }
    });

  removePopup();
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
  affliction: displayAfflictableOrgans,
  Vaccine: playVaccineCard,
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

const manageTurn = async () => {
  const data = await fetchPlayersData();
  const { player, opponents, event } = data;
  await renderGame({ player, opponents, event });
  const attackCards = document.querySelectorAll(".player-area .attack-card");

  console.log({ player, opponents });
  if (player.isMyTurn) {
    [...attackCards].forEach((card) => {
      card.onclick = (e) => attachEventListener(e, player, opponents);
    });
  } else {
    attackCards.forEach((card) => card.onclick = () => "");
  }

  const instantCards = [...document.querySelectorAll(".attack-card")].filter(
    (card) => Number(card.getAttribute("isInstant")) === 1,
  );
  instantCards.forEach((card) => {
    card.onclick = (e) => attachEventListener(e, player, opponents, true);
  });
};

const poll = async () => {
  await fetch("/wait-for-affliction");
  await manageTurn();
  poll();
};

window.onload = async () => {
  await manageTurn();
  poll();
};
