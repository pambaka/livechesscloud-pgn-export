import {
  form,
  tournamentInput,
  responseBlock,
  roundsBlock,
  pairsBlock,
  rowTemplate,
  selectAllCheckbox,
  selectedGamesCounter,
  pgnButton,
  submitButton,
} from "./elements.js";

import { ApiError, fetchPgn, fetchRounds } from "./api.js";
import { pgnStatus, tournamentStatus } from "./status.js";
import { pgnList } from "./pgn-list.js";

let loadedTournamentId = "";
let roundsData = null;
const selectedGames = new Set();

selectAllCheckbox.addEventListener("change", () => {
  const checkboxes = pairsBlock.querySelectorAll("input[type=checkbox]");
  const isAllChecked = selectAllCheckbox.checked;
  for (const checkbox of checkboxes) {
    checkbox.checked = isAllChecked;
    checkbox.dispatchEvent(new Event("change"));
  }
});

pgnButton.addEventListener("click", async () => {
  pgnStatus.clear();
  pgnList.clear();
  setButtonLoading(pgnButton, true);
  const keys = [...selectedGames];
  const [roundNum, boardNum] = keys[0].split("-");
  try {
    const text = await fetchPgn(loadedTournamentId, roundNum, boardNum);
    pgnList.addPgn(roundNum, boardNum, roundsData[roundNum][boardNum], text);
    pgnList.scrollTo();
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404)
        pgnStatus.showError(
          `Game not found: round ${roundNum}, board ${boardNum}`,
        );
      else if (error.status === 429)
        pgnStatus.showError("Too many requests, try in a minute");
      else if (error.status === 502)
        pgnStatus.showError("Service is unavailable");
      else {
        pgnStatus.showError("Something went wrong");
        console.error(error);
      }
      pgnStatus.scrollTo();
    } else console.error(error);
  } finally {
    setButtonLoading(pgnButton, false);
    updateSelectionState();
  }
});

form.addEventListener("submit", handleSubmit);
/** @param {SubmitEvent} event */
async function handleSubmit(event) {
  event.preventDefault();
  resetTournament();
  tournamentStatus.clear();
  pgnStatus.clear();
  setButtonLoading(submitButton, true);
  const id = tournamentInput.value.trim();
  const slowTimer = setTimeout(() => {
    tournamentStatus.showInfo(
      "Waking up the server, this may take up to a minute",
    );
  }, 3000);
  try {
    roundsData = await fetchRounds(id);
    loadedTournamentId = id;
    tournamentStatus.clear();
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422)
        tournamentStatus.showError("Incorrect tournament ID format");
      else if (error.status === 502)
        tournamentStatus.showError(
          "Tournament not found or Service is unavailable",
        );
      else if (error.status === 429)
        tournamentStatus.showError("Too many requests, try in a minute");
      else {
        tournamentStatus.showError("Something went wrong");
        console.error(error);
      }
    } else console.error(error);
    return;
  } finally {
    setButtonLoading(submitButton, false);
    clearTimeout(slowTimer);
  }
  responseBlock.hidden = false;

  for (const [roundNum, roundPairings] of Object.entries(roundsData)) {
    const tab = document.createElement("button");
    tab.classList.add("round-tab");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.addEventListener("click", (event) =>
      handleTabClick(event, roundPairings),
    );
    tab.textContent = roundNum;
    tab.dataset.round = roundNum;
    roundsBlock.appendChild(tab);
  }
  const firstRound = roundsBlock.firstElementChild;
  if (firstRound) {
    firstRound.click();
  }
}
/**
 * @param {PointerEvent} event
 * @param {Record<string, {white: string, black: string}>} pairings
 */
function handleTabClick(event, pairings) {
  const tab = /** @type {HTMLButtonElement}*/ (event.currentTarget);
  if (tab.getAttribute("aria-selected") === "true") return;
  pairsBlock.replaceChildren();
  const currentTab = roundsBlock.querySelector("[aria-selected='true']");
  currentTab?.setAttribute("aria-selected", "false");
  tab.setAttribute("aria-selected", "true");
  for (const [boardNum, pairing] of Object.entries(pairings)) {
    const row = createTableRow(tab.dataset.round, boardNum, pairing);
    pairsBlock.append(row);
  }
  updateSelectAllCheckbox();
  updateSelectionState();
}

function createTableRow(roundNum, boardNum, pairing) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector("th").textContent = boardNum;
  row.querySelector(".white").textContent = pairing["white"];
  row.querySelector(".black").textContent = pairing["black"];
  const checkbox = row.querySelector("input");
  checkbox.checked = selectedGames.has(getGameKey(roundNum, boardNum));
  checkbox.addEventListener("change", () => {
    updateSelectedGames(roundNum, boardNum, checkbox.checked);
    updateSelectAllCheckbox();
    updateSelectionState();
  });
  row.addEventListener("click", (event) => {
    if (event.target === checkbox) return;
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("change"));
  });
  return row;
}

function updateSelectAllCheckbox() {
  const all = pairsBlock.querySelectorAll("input[type=checkbox]");
  const checked = pairsBlock.querySelectorAll("input[type=checkbox]:checked");
  selectAllCheckbox.checked = all.length > 0 && all.length === checked.length;
}

function updateSelectedGames(roundNum, boardNum, isChecked) {
  const gameKey = getGameKey(roundNum, boardNum);
  if (isChecked) selectedGames.add(gameKey);
  else selectedGames.delete(gameKey);
}

function getGameKey(roundNum, boardNum) {
  return `${roundNum}-${boardNum}`;
}

function updateSelectionState() {
  pgnButton.disabled = selectedGames.size === 0;
  selectedGamesCounter.textContent = selectedGames.size;
}

function resetTournament() {
  responseBlock.hidden = true;
  roundsBlock.replaceChildren();
  pairsBlock.replaceChildren();
  selectedGames.clear();
  loadedTournamentId = "";
  roundsData = null;
  updateSelectionState();
  pgnList.clear();
}

/**@param {HTMLButtonElement} button */
function setButtonLoading(button, isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? "Loading..." : button.dataset.label;
}
