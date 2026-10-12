import sys
from typing import Any, Self
from uuid import UUID

import requests

POOL_URL = "https://1.pool.livechesscloud.com"
TOURNAMENT_ID_FORMAT = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"


class LiveChessCloudException(Exception):
    pass


class LiveChessCloudClient:
    def __init__(self, tournament_id: UUID) -> None:
        self.base_url = f"{POOL_URL}/get/{tournament_id}"
        self.session = requests.Session()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_: object) -> None:
        self.session.close()

    def get_tournament(self) -> dict[str, Any]:
        response = self.session.get(
            f"{self.base_url}/tournament.json", timeout=10
        )
        if response.status_code != 200:
            raise LiveChessCloudException(
                f"Request failed with status code: {response.status_code}"
            )
        try:
            data = response.json()
        except requests.JSONDecodeError as e:
            raise LiveChessCloudException("Response is not valid JSON") from e
        if not isinstance(data, dict):
            raise LiveChessCloudException(
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
