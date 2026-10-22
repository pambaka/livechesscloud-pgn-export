import sys
from http import HTTPStatus
from typing import Any, Self
from uuid import UUID

import requests

POOL_URL = "https://1.pool.livechesscloud.com"
TOURNAMENT_ID_FORMAT = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"


class LiveChessCloudException(Exception):
    pass

class LiveChessCloudNotFound(LiveChessCloudException):
    pass


class LiveChessCloudClient:
    def __init__(self, tournament_id: UUID) -> None:
        self.base_url = f"{POOL_URL}/get/{tournament_id}"
        self.session = requests.Session()
        self._tournament: dict[str, Any] | None = None

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_: object) -> None:
        self.session.close()

    def get_tournament(self) -> dict[str, Any]:
        if self._tournament is None:
            self._tournament = self._fetch_json("tournament.json")
        return self._tournament

    def get_round(self, round: int) -> dict[str, Any]:
        return self._fetch_json(f"round-{round}/index.json")

    def get_rounds(self) -> list[dict[str, Any] | None]:
        tournament = self.get_tournament()
        round_infos: list[dict[str, Any]] = tournament.get("rounds", [])
        rounds: list[dict[str, Any] | None] = []
        for i, round_info in enumerate(round_infos, 1):
            if round_info.get("count", 0) == 0:
                rounds.append(None)
            else:
                rounds.append(self.get_round(i))
        return rounds

    def get_game(self, round_num: int, board: int) -> dict:
        return self._fetch_json(f"round-{round_num}/game-{board}.json")

    def _fetch_json(self, path: str) -> dict[str, Any]:
        url = f"{self.base_url}/{path}"
        response = self.session.get(url, timeout=10)
        if response.status_code == HTTPStatus.NOT_FOUND:
            raise LiveChessCloudNotFound(f"{url}: Not found")
        if response.status_code != HTTPStatus.OK:
            raise LiveChessCloudException(
                f"{url}: "
                f"Request failed with status code {response.status_code}"
            )
        try:
            data = response.json()
        except requests.JSONDecodeError as e:
            raise LiveChessCloudException(
                f"{url}: Response is not valid JSON"
            ) from e
        if not isinstance(data, dict):
            raise LiveChessCloudException(
                f"{url}: "
                f"Expected a JSON object (dict), got {type(data).__name__}"
            )
        return data


if __name__ == "__main__":
    args = sys.argv
    if len(args) != 2:
        sys.exit(
            "Usage: python client.py <tournament_id>\n"
            f"Tournament ID format: {TOURNAMENT_ID_FORMAT}"
        )

    try:
        tournament_id = UUID(args[1])
    except ValueError:
        sys.exit(
            f"Invalid tournament ID (UUID expected: {TOURNAMENT_ID_FORMAT})"
        )

    try:
        with LiveChessCloudClient(tournament_id) as client:
            print(client.get_tournament())
    except LiveChessCloudException as e:
        sys.exit(str(e))
