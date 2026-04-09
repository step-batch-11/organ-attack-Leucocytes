const fetchUserdata = async () => {
  return fetch("/user-details");
};

const renderUserInfo = async () => {
  const userInfo = document.querySelector("#user-info");
  console.log(userInfo);
  const res = await fetchUserdata();
  const { username } = await res.json();
  console.log("RESPONSE", username);
  const usernamePlaceHolder = userInfo.querySelector("#username");

  usernamePlaceHolder.textContent = username;
};

window.onload = () => {
  renderUserInfo();
};
