import { clearPopup } from "./afflict-organ.js";
import { postJSON } from "./utils.js";

export const performChartMixup = async ({ player, attackCardID }) => {
  clearPopup();
  const body = { attackerID: player.id, attackCardID };
  await postJSON("/attack", body);
};

export const performVaccine = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  const { success } = await postJSON("/attack", body);

  if (success) {
    const organsArea = document.querySelector(".organs");
    organsArea.dataset.vaccine = 2;
  }
};

export const performByTheBook = async ({ player, attackCardID }) => {
  const body = { attackerID: player.id, attackCardID };
  await postJSON("/attack", body);
};
