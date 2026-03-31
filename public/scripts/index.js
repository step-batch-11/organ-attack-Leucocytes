const makeGETReq = (url) => {
  return fetch(url).then((r) => r.json());
};

const renderPlayers = (players, myId, roomId) => {
  const playersLength = document.querySelector("#players-count #number");
  const template = document.querySelector("#player-row");
  const list = document.querySelector("#waiting-members ul");
  playersLength.textContent = players.length;
  const roomIdElement = document.querySelector("#room-number");
  roomIdElement.textContent = roomId;

  const elements = players.map((player) => {
    const templateClone = document.importNode(template.content, true);
    const li = templateClone.querySelector("li");
    const nameElement = templateClone.querySelector(".player-name");
    const indication = templateClone.querySelector("#indication");

    if (player.id === myId) {
      indication.textContent = "(YOU)";
    }

    li.id = player.id;
    nameElement.textContent = player.name;

    return li;
  });
  list.replaceChildren(...elements);
};
const amIHost = (players, myId) => {
  return players.find((player) => player.id === myId).type === "host";
};

const main = async () => {
  const body = await makeGETReq("/get-players").catch((_) => {});
  const { players, myId, roomID } = body;
  if (body.status === 302) {
    if (amIHost(players, myId)) {
      await fetch("/setup-room", {
        method: "POST",
        body: JSON.stringify({ roomID }),
      });
    }
    const { redirectPath } = body;
    globalThis.location.href = redirectPath;
  }

  renderPlayers(players, myId, roomID);
};

globalThis.onload = () => {
  setInterval(() => {
    main();
  }, 300);
};
