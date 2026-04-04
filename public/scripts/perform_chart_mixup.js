import { clearPopup } from "./afflict-organ.js";

export const performChartMixup = async ({ player, attackCardID }) => {
  clearPopup();
  const res = await fetch("/attack", {
    method: "post",
    body: JSON.stringify({
      attackCardID,
      attackerID: player.id,
    }),
  });
};
