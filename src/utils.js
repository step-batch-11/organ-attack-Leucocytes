export const counter = () => {
  let i = 0;
  return () => ++i;
};
