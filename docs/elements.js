export const form = document.querySelector("form");
/** @type {HTMLInputElement} */
export const tournamentInput = document.getElementById("tournament_id");
export const submitButton = form.querySelector("button");
submitButton.dataset.label = submitButton.textContent;
export const tournamentStatusBlock =
  document.getElementById("tournament-status");
export const responseBlock = document.getElementById("response");
export const roundsBlock = document.getElementById("rounds");
export const pairsBlock = document.getElementById("pairs");
/** @type {HTMLTemplateElement} */
export const rowTemplate = document.getElementById("row-template");
/** @type {HTMLInputElement} */
export const selectAllCheckbox = document.getElementById("select-all");
export const selectedGamesCounter = document.getElementById("counter");
/** @type {HTMLButtonElement} */
export const pgnButton = document.getElementById("pgn-button");
pgnButton.dataset.label = pgnButton.textContent;
export const pgnStatusBlock = document.getElementById("pgn-status");
