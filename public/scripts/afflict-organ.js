import { renderOpponents } from "./render_game.js";
import { fetchPlayersData, getAfflictableOrgans, postJSON } from "./utils.js";

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

  await postJSON("/attack", body);
};

export const displayOrgans = (
  { player, opponents, attackCardID, isInstant },
) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardID);
  removePopup();

  const container = document.createElement("div");
  container.setAttribute("class", "popup-afflicatble-organs");

  const cards = {
    "medicine": player.organCards.filter(({ health, maxHealth }) =>
      health !== maxHealth
    ),
    "poison": player.organCards,
  };
  const organCards = cards[attackCard.action] ||
    getAfflictableOrgans(opponents, attackCard);

  const organs = createPopupOrgans(organCards);
  container.append(...organs);
  container.addEventListener("click", async (e) => {
    afflictOrgan(e, attackCardID, player, isInstant);
  });
  document.querySelector(".popup").append(container);
};
