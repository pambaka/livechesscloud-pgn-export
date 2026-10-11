const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const API_BASE = isLocal
  ? "http://127.0.0.1:8000"
  : "https://livechesscloud-pgn-export.onrender.com";

/**@type {HTMLInputElement} */
const tournamentInput = document.getElementById("tournament_id");

const form = document.querySelector("form");
form.addEventListener("submit", handleSubmit);

/**@param {SubmitEvent} event */
async function handleSubmit(event) {
  event.preventDefault();
  const id = tournamentInput.value.trim();
  const response = await fetch(
    `${API_BASE}/api/tournaments/${encodeURIComponent(id)}`,
  );
  console.log(response);
}
