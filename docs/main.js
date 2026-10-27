const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const API_BASE = isLocal
  ? "http://127.0.0.1:8000"
  : "https://livechesscloud-pgn-export.onrender.com";
let loadedTournamentId = "";
const selectedGames = new Set();

const form = document.querySelector("form");
/** @type {HTMLInputElement} */
const tournamentInput = document.getElementById("tournament_id");
const responseBlock = document.getElementById("response");
const roundsBlock = document.getElementById("rounds");
const pairsBlock = document.getElementById("pairs");
/** @type {HTMLTemplateElement} */
const rowTemplate = document.getElementById("row-template");
/** @type {HTMLInputElement} */
const selectAllCheckbox = document.getElementById("select-all");
const selectedGamesCounter = document.getElementById("counter");
/** @type {HTMLButtonElement} */
const pgnButton = document.getElementById("pgn-button");

selectAllCheckbox.addEventListener("change", () => {
  const checkboxes = pairsBlock.querySelectorAll("input[type=checkbox]");
  const isAllChecked = selectAllCheckbox.checked;
  for (const checkbox of checkboxes) {
    checkbox.checked = isAllChecked;
    checkbox.dispatchEvent(new Event("change"));
  }
});

function getUrl(id, path = "") {
  return `${API_BASE}/api/tournaments/${encodeURIComponent(id)}${path}`;
}

pgnButton.addEventListener("click", async () => {
  try {
    const keys = [...selectedGames];
    const [roundNum, boardNum] = keys[0].split("-");
    const response = await fetch(
      getUrl(loadedTournamentId, `/pgn?round=${roundNum}&board=${boardNum}`),
    );
    const text = await response.text();
    console.log(text);
  } catch (error) {
    console.error(error);
    return;
  }
});

form.addEventListener("submit", handleSubmit);
/** @param {SubmitEvent} event */
async function handleSubmit(event) {
  event.preventDefault();
  const id = tournamentInput.value.trim();
  let roundsData;
  try {
    const response = await fetch(getUrl(id));
    if (!response.ok) {
      console.error(response.status);
      return;
    }
    roundsData = await response.json();
    loadedTournamentId = id;
  } catch (error) {
    console.error(error);
    return;
  }
  responseBlock.hidden = false;
  roundsBlock.replaceChildren();
  pairsBlock.replaceChildren();
  selectedGames.clear();
  updateSelectionState();
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
