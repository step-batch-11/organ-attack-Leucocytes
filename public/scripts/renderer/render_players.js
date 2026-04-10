import { getAvatarClosure } from "../avatar.js";

const renderPlayerProfile = (name, avatarContainer) => {
  const getAvatarURL = getAvatarClosure();
  const avatarUrl = getAvatarURL(name);
  avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
};

const renderPlayerInfo = (template, myID, playerCount, players) => {
  return (player) => {
    const playerDetail = document.importNode(template.content, true);
    const detailContainer = playerDetail.querySelector("li");
    const nameField = playerDetail.querySelector(".player-name");
    const indication = playerDetail.querySelector("#indication");
    const avatarContainer = playerDetail.querySelector(".player-profile");

    console.log(avatarContainer);
    renderPlayerProfile(player.name, avatarContainer);

    if (player.id === myID) {
      indication.textContent = "(YOU)";
    }

    playerCount.textContent = players.length;
    detailContainer.id = player.id;
    nameField.textContent = player.name;

    return detailContainer;
  };
};

export const renderPlayers = (players, myID, roomID) => {
  const playerCount = document.querySelector("#players-count #number");
  const template = document.querySelector("#player-row");
  const joinedPlayers = document.querySelector("#waiting-members ul");
  const roomIDField = document.querySelector("#room-number");
  roomIDField.textContent = roomID;

  const lobbyDetails = players
    .map(renderPlayerInfo(template, myID, playerCount, players));

  joinedPlayers.replaceChildren(...lobbyDetails);
};
