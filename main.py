import sys
from typing import Self

import requests

POOL_URL = "https://1.pool.livechesscloud.com"


class LiveChessCloudException(Exception):
    pass


class LiveChessCloudClient:
    def __init__(self, tournament_id: str) -> None:
        self.base_url = f"{POOL_URL}/get/{tournament_id}"
        self.session = requests.Session()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_: object) -> None:
        self.session.close()

    def get_tournament(self) -> None:
        response = self.session.get(
            f"{self.base_url}/tournament.json", timeout=10
        )
        if response.status_code != 200:
            raise LiveChessCloudException(
                f"Request failed with status code: {response.status_code}"
            )
        data = response.json()
        print(data)


if __name__ == "__main__":
    args = sys.argv
    if len(args) != 2:
        sys.exit("Usage: python main.py <tournament_id>")

    try:
        with LiveChessCloudClient(args[1]) as client:
            client.get_tournament()
    except LiveChessCloudException as e:
        sys.exit(str(e))
