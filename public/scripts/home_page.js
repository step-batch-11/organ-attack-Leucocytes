const fetchUserdata = async () => {
  return fetch("/user-details");
};

const renderUserInfo = async () => {
  const userInfo = document.querySelector("#user-info");
  const res = await fetchUserdata();
  const { username } = await res.json();
  const usernamePlaceHolder = userInfo.querySelector("#username");

  usernamePlaceHolder.textContent = username;
};

window.onload = () => {
  renderUserInfo();
};
