import { fetchPlayersData, renderOpponents, setupGame } from "./board_setup.js";

const getCardId = (e) => Number(e.target.id.split("-").at(-1));

const getAfflictableOrgans = (player, opponents, attackCardId) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardId);
  const afflictableOrgansIds = attackCard.afflictableOrgans;
  const allOrganCards = opponents.reduce((allCards, { organCards, id }) => {
    organCards.forEach((card) => card.playerId = id);
    return allCards.concat(organCards);
  }, []);
  return allOrganCards.filter(({ id }) => afflictableOrgansIds.includes(id));
};

const createPopupOrgans = (afflictableOrgans) => {
  return afflictableOrgans.map((afflictableOrgan) => {
    const organ = document.createElement("div");
    organ.setAttribute("class", "organ");
    organ.setAttribute("organ-id", `${afflictableOrgan.id}`);
    organ.setAttribute("player-id", `${afflictableOrgan.playerId}`);
    organ.textContent = afflictableOrgan.name;
    return organ;
  });
};

const removePopup = () => {
  const popup = document.querySelector(".popup");
  if (popup !== null) popup.remove();
};

const displayAfflicatbleOrgans = (
  e,
  player,
  opponents,
  attackCardID,
) => {
  removePopup();
  const popup = document.createElement("div");
  popup.setAttribute("class", "popup");
  const afflictableOrgans = getAfflictableOrgans(
    player,
    opponents,
    attackCardID,
  );
  const organs = createPopupOrgans(afflictableOrgans);
  popup.append(...organs);
  popup.addEventListener("click", async (e) => {
    afflictOrgan(e, attackCardID, player);
  });
  document.querySelector(".player-area").append(popup);
};

const afflictOrgan = async (e, attackCardID, player) => {
  const organ = e.target;
  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));
  const res = await fetch("/attack", {
    method: "post",
    body: JSON.stringify({
      attackCardID,
      attackerID: player.id,
      organCardID,
      opponentID,
    }),
  })
    .then((res) => res.json())
    .then(async ({ success }) => {
      if (success) {
        const { opponents } = await fetchPlayersData();
        renderOpponents(opponents);
      }
    });
  removePopup();
};

const initGame = async () => {
  const { player, opponents } = await setupGame();
  const attackCards = document.querySelector(".player-area .attack-cards");

  console.log(player.isMyTurn);
  if (player.isMyTurn) {
    attackCards.onclick = (e) => {
      const attackCardID = getCardId(e);
      displayAfflicatbleOrgans(e, player, opponents, attackCardID);
    };
  } else {
    attackCards.onclick = () => "";
  }

  poll();
};

window.onload = initGame;

/////

const poll = async () => {
  await fetch("/wait-for-affliction");
  await initGame();
  // poll();
};
