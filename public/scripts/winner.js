import { getAvatarClosure } from "./avatar.js";

const fetchPlayerData = async () => {
  return fetch("/user-details");
};

const renderProfile = (name) => {
  const getAvatarURL = getAvatarClosure();
  const avatarUrl = getAvatarURL(name);
  const avatarContainer = document.querySelector("#winner-profile");
  avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
};

const renderPlayerInfo = async () => {
  const res = await fetchPlayerData();
  const { username } = await res.json();
  const usernamePlaceHolder = document.querySelector("#winner-name");
  usernamePlaceHolder.textContent = username.toUpperCase();
  renderProfile(username);
};

const replayBtn = document.querySelector(".replay-btn");

globalThis.onload = () => {
  renderPlayerInfo();
  replayBtn.onclick = () => {
    window.location.replace("/");
  };
};
