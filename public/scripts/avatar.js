export const getAvatarClosure = () => {
  const base = "https://api.dicebear.com";
  const faceType = "adventurer";
  const R = 50;
  /*
  <img
    src="https://api.dicebear.com/9.x/adventurer-neutral/
    svg?
    rotate=10
    &scale=80
    &radius=50
    &backgroundColor=
    &seed=Sara"
    alt="avatar" />
  */
  const colors = {
    green: "bff199", //"#bff199",
    warmPeach: "ecad80", //"#ecad80",
    softSand: "a9bcc9", //"#a9bcc9",
    // deepBrown: "763900",//"#763900",
    burntSienna: "ffafaf", //"#ffafaf",
    iceBlue: "b6e3f4", //"#b6e3f4",
    lavenderMist: "c0aede", //"#c0aede",
    blushPink: "ffd5dc", //"#ffd5dc",
    creamApricot: "ffdfbf", //"#ffdfbf",
    periwinkleLight: "d1d4f9", //"#d1d4f9"
  };

  const [
    green,
    warmPeach,
    softSand,
    burntSienna,
    iceBlue,
    lavenderMist,
    blushPink,
    creamApricot,
    periwinkleLight,
  ] = Object.values(colors);

  const bgValues = [
    green,
    warmPeach,
    softSand,
    burntSienna,
    iceBlue,
    lavenderMist,
    blushPink,
    creamApricot,
    periwinkleLight,
  ].join(",");
  const domain = `${base}/9.x/${faceType}/svg`;
  return (player, r = R) =>
    `${domain}?radius=${r}&backgroundColor=${bgValues}&seed=${player}`;
};
