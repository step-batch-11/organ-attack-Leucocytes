import { fetchPlayersData, renderOpponents, setupGame } from "./board_setup.js";

const getCardId = (e) =>
  Number(e.target.closest(".attack-card").id.split("-").at(-1));

const getAfflictableOrgans = (player, opponents, attackCardId) => {
  const attackCard = player.attackCards
    .find(({ id }) => id === attackCardId);
  const afflictableOrgansIds = attackCard.afflictableOrgans;
  const allOrganCards = opponents.reduce((allCards, { organCards, id }) => {
    organCards.forEach((card) => card.playerId = id);
    return allCards.concat(organCards);
  }, []);
  if (attackCard.type === "dummy") return allOrganCards;

  return allOrganCards.filter(({ id }) =>
    afflictableOrgansIds.includes(id) || id === 100
  );
};

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
  e,
  player,
  opponents,
  attackCardID,
) => {
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
    afflictOrgan(e, attackCardID, player);
  });
  document.querySelector(".popup").append(container);
};

const afflictOrgan = async (e, attackCardID, player) => {
  const organ = e.target.closest(".organ");
  const organCardID = Number(organ.getAttribute("organ-id"));
  const opponentID = Number(organ.getAttribute("player-id"));
  console.log({ opponentID, organCardID });

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

  if (player.isMyTurn) {
    attackCards.onclick = (e) => {
      const attackCardID = getCardId(e);
      displayAfflictableOrgans(e, player, opponents, attackCardID);
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
