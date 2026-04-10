import { getAvatarClosure } from "./avatar.js";

const fetchUserdata = async () => {
  return fetch("/user-details");
};

const renderUserProfile = (avatarUrl) => {
  const avatarContainer = document.querySelector("#avatar");
  console.log(avatarContainer);
  avatarContainer.style.backgroundImage = `url(${avatarUrl})`;
};

const renderUserInfo = async () => {
  const userInfo = document.querySelector("#user-info");
  const res = await fetchUserdata();
  const { username } = await res.json();
  const usernamePlaceHolder = userInfo.querySelector("#username");
  usernamePlaceHolder.textContent = username.toUpperCase();
  const getAvatarURL = getAvatarClosure();

  const avatarUrl = getAvatarURL(username);
  localStorage.setItem("profile", avatarUrl);
  renderUserProfile(avatarUrl);
};

window.onload = () => {
  renderUserInfo();
};
