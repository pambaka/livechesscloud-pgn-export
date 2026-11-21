import {
  form,
  tournamentInput,
  responseBlock,
  roundsBlock,
  pairsBlock,
  rowTemplate,
  selectAllCheckbox,
  selectedGamesCounter,
  searchBar,
  searchInput,
} from "./elements.js";

import { ApiError, fetchPgns, fetchRounds } from "./api.js";
import { pgnStatus, tournamentStatus } from "./status.js";
import { pgnList } from "./pgn-list.js";
import { pgnButton, submitButton } from "./stateful-button.js";

let loadedTournamentId = "";
let roundsData = null;
const selectedGames = new Set();
const filters = {
  round: null,
  query: "",
};

selectAllCheckbox.addEventListener("change", () => {
  const checkboxes = pairsBlock.querySelectorAll("input[type=checkbox]");
  const isAllChecked = selectAllCheckbox.checked;
  for (const checkbox of checkboxes) {
    checkbox.checked = isAllChecked;
    checkbox.dispatchEvent(new Event("change"));
  }
});

pgnButton.onClick(async () => {
  pgnStatus.clear();
  pgnList.clear();
  pgnButton.setLoading(true);
  const sortedGames = [...selectedGames].sort((game1, game2) => {
    const [round1, board1] = game1.split("-").map(Number);
    const [round2, board2] = game2.split("-").map(Number);
    return round1 - round2 || board1 - board2;
  });
  try {
    const { games, missing } = await fetchPgns(loadedTournamentId, sortedGames);
    for (const game of games) {
      pgnList.addPgn(game.round, game.board, game.pairing, game.pgn);
    }
    if (missing.length) {
      pgnStatus.showError(
        `Some games are missing (round-board): ${missing.join(", ")}`,
      );
    } else pgnList.scrollTo();
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404)
        pgnStatus.showError(
          `Games not found (round-board): ${sortedGames.join(", ")}`,
        );
      else if (error.status === 429)
        pgnStatus.showError("Too many requests, try in a minute");
      else if (error.status === 502)
        pgnStatus.showError("Service is unavailable");
      else {
        pgnStatus.showError("Something went wrong");
        console.error(error);
      }
    } else console.error(error);
  } finally {
    pgnButton.setLoading(false);
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
  submitButton.setLoading(true);
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
    submitButton.setLoading(false);
    clearTimeout(slowTimer);
  }
  responseBlock.hidden = false;

  for (const round in roundsData) {
    const tab = document.createElement("button");
    tab.classList.add("round-tab");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.addEventListener("click", handleTabClick);
    tab.textContent = round;
    tab.dataset.round = round;
    roundsBlock.appendChild(tab);
  }
  const firstRound = roundsBlock.firstElementChild;
  if (firstRound) {
    firstRound.click();
  }
}
/** @param {PointerEvent} event */
function handleTabClick(event) {
  const tab = /** @type {HTMLButtonElement}*/ (event.currentTarget);
  if (filters.round === null) {
    filters.query = "";
    selectedGames.clear();
  }
  updateSearch();
  const round = tab.dataset.round;
  if (round === filters.round) return;
  filters.round = round;
  updateTabs();
  renderTable();
  updateSelectAllCheckbox();
  updateSelectionState();
}

function createTableRow(round, board, pairing) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector("th").textContent = board;
  row.querySelector(".white").textContent = pairing["white"];
  row.querySelector(".black").textContent = pairing["black"];
  row.querySelector(".result").textContent = pairing["result"].replaceAll(
    "1/2",
    "½",
  );
  const checkbox = row.querySelector("input");
  checkbox.checked = selectedGames.has(getGameKey(round, board));
  checkbox.addEventListener("change", () => {
    updateSelectedGames(round, board, checkbox.checked);
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

function updateSelectedGames(round, board, isChecked) {
  const gameKey = getGameKey(round, board);
  if (isChecked) selectedGames.add(gameKey);
  else selectedGames.delete(gameKey);
}

function getGameKey(round, board) {
  return `${round}-${board}`;
}

function updateSelectionState() {
  pgnButton.setDisabledBy("noSelectedGames", selectedGames.size === 0);
  selectedGamesCounter.textContent = selectedGames.size;
}

function resetTournament() {
  responseBlock.hidden = true;
  roundsBlock.replaceChildren();
  pairsBlock.replaceChildren();
  selectedGames.clear();
  loadedTournamentId = "";
  roundsData = null;
  filters.round = null;
  filters.query = "";
  updateSelectionState();
  pgnList.clear();
}

searchBar.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  searchInput.value = query;
  if (filters.round === null && query === filters.query) return;
  filters.round = null;
  filters.query = query;
  selectedGames.clear();
  updateTabs();
  renderTable();
  updateSelectAllCheckbox();
  updateSelectionState();
});

function updateTabs() {
  for (const tab of roundsBlock.querySelectorAll("[data-round]")) {
    const isSelected = tab.dataset.round === filters.round;
    tab.setAttribute("aria-selected", `${isSelected}`);
  }
}

function updateSearch() {
  searchInput.value = filters.query;
}

function renderTable() {
  const data = getVisibleGames();
  pairsBlock.replaceChildren();
  for (const round in data) {
    if (filters.round === null) {
      pairsBlock.append(getRoundSeparator(round));
    }
    for (const board in data[round]) {
      const row = createTableRow(round, board, data[round][board]);
      pairsBlock.append(row);
    }
  }
}

function getVisibleGames() {
  if (filters.round !== null)
    return { [filters.round]: roundsData[filters.round] };

  const filtered = {};
  const query = filters.query.toLowerCase();
  for (const round in roundsData) {
    for (const board in roundsData[round]) {
      const game = roundsData[round][board];
      const white = game["white"].toLowerCase();
      const black = game["black"].toLowerCase();
      if (white.includes(query) || black.includes(query)) {
        if (!filtered[round]) filtered[round] = {};
        filtered[round][board] = game;
      }
    }
  }
  return filtered;
}

function getRoundSeparator(round) {
  const row = document.createElement("tr");
  row.classList.add("round-separator");
  const cell = document.createElement("td");
  cell.colSpan = 5;
  const span = document.createElement("span");
  span.textContent = `Round ${round}`;
  cell.append(span);
  row.append(cell);
  return row;
}
