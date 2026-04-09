export const highlightOrgan = (e) => {
  const sourceOrgan = e.target.closest(".organ");
  console.log(sourceOrgan);
  const targetOrgan = document.querySelector(
    `.opponent-area [data-id="${sourceOrgan.dataset.id}"]`,
  );
  targetOrgan.classList.add("highlight-organ");
  console.log(targetOrgan);
};

export const removeHighlightOrgan = (e) => {
  const sourceOrgan = e.target.closest(".organ");
  const targetOrgan = document.querySelector(
    `.opponent-area [data-id="${sourceOrgan.dataset.id}"]`,
  );
  targetOrgan.classList.remove("highlight-organ");
};
