const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const API_BASE = isLocal
  ? "http://127.0.0.1:8000"
  : "https://livechesscloud-pgn-export.onrender.com";

const form = document.querySelector("form");
/**@type {HTMLInputElement} */
const tournamentInput = document.getElementById("tournament_id");
const responseBlock = document.getElementById("response");
const roundsBlock = document.getElementById("rounds");
const pairsBlock = document.getElementById("pairs");

form.addEventListener("submit", handleSubmit);

/**@param {SubmitEvent} event */
async function handleSubmit(event) {
  event.preventDefault();
  const id = tournamentInput.value.trim();
  let roundsData;
  try {
    const response = await fetch(
      `${API_BASE}/api/tournaments/${encodeURIComponent(id)}`,
    );
    if (!response.ok) {
      console.error(response.status);
      return;
    }
    roundsData = await response.json();
  } catch (error) {
    console.error(error);
    return;
  }
  responseBlock.hidden = false;
  roundsBlock.replaceChildren();
  pairsBlock.replaceChildren();
  for (const [roundNum, roundPairings] of Object.entries(roundsData)) {
    const tab = document.createElement("button");
    tab.classList.add("round-tab");
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.addEventListener("click", (event) =>
      handleTabClick(event, roundPairings),
    );
    tab.textContent = roundNum;
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
    const pair = document.createElement("p");
    pair.textContent =
      boardNum + ": " + pairing["white"] + " - " + pairing["black"];
    pairsBlock.appendChild(pair);
  }
}
