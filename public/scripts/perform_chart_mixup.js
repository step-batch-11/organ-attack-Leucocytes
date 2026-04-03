export const performChartMixup = async ({ player, attackCardID }) => {
  const res = await fetch("/attack", {
    method: "post",
    body: JSON.stringify({
      attackCardID,
      attackerID: player.id,
    }),
  });
};
