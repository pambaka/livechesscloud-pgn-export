const isLocal = ["127.0.0.1", "localhost"].includes(location.hostname);
const API_BASE = isLocal
  ? "http://127.0.0.1:8000"
  : "https://livechesscloud-pgn-export.onrender.com";

function getUrl(id, path = "") {
  return `${API_BASE}/api/tournaments/${encodeURIComponent(id)}${path}`;
}

export class ApiError extends Error {
  constructor(status) {
    super(`Request failed: ${status}`);
    this.status = status;
  }
}

async function request(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return response;
}

export async function fetchRounds(tournamentId) {
  const response = await request(getUrl(tournamentId));
  return response.json();
}

export async function fetchPgn(tournamentId, roundNum, boardNum) {
  const response = await request(
    getUrl(tournamentId, `/pgn?round=${roundNum}&board=${boardNum}`),
  );
  return response.text();
}
